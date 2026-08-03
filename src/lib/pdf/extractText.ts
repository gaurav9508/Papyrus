import { PDFParse } from "pdf-parse";

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
