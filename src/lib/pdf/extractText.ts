import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

/** Max characters of paper text we send to the LLM (keeps prompts within free-tier context limits). */
const MAX_CHARS = 40_000;

/** Extract plain text from a PDF buffer (works for both uploaded files and fetched arXiv PDFs). */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return truncateForPrompt(result.text);
  } finally {
    await parser.destroy();
  }
}

/** Extract plain text from a DOCX buffer. */
export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return truncateForPrompt(result.value);
}

/** Extract plain text from a TXT buffer. */
export async function extractTextFromTxt(buffer: Buffer): Promise<string> {
  return truncateForPrompt(buffer.toString("utf-8"));
}

/**
 * Dispatch to the correct extractor based on file extension/MIME type.
 * Used by the upload flow, which now accepts PDF, DOCX, and TXT.
 */
export async function extractTextFromFile(
  buffer: Buffer,
  filename: string,
  contentType?: string,
): Promise<string> {
  const ext = filename.toLowerCase().split(".").pop();

  if (ext === "docx" || contentType?.includes("wordprocessingml")) {
    return extractTextFromDocx(buffer);
  }
  if (ext === "txt" || contentType === "text/plain") {
    return extractTextFromTxt(buffer);
  }
  // default: pdf
  return extractTextFromPdf(buffer);
}

/** Fetch a PDF from a URL (e.g. arXiv) and extract its text. */
export async function extractTextFromPdfUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch PDF: ${res.status}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return extractTextFromPdf(Buffer.from(arrayBuffer));
}

function truncateForPrompt(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > MAX_CHARS ? cleaned.slice(0, MAX_CHARS) : cleaned;
}
