import type { NotebookGenerationResult, PaperSummary } from "@/lib/types";
import { generateStructuredJson } from "@/lib/llm/gemini";
import { buildNotebookPrompt } from "@/lib/llm/notebookPrompt";
import {
  extractTextFromPdf,
  extractTextFromPdfUrl,
} from "@/lib/pdf/extractText";

export interface NotebookGenerationWithText extends NotebookGenerationResult {
  paperText: string;
}

/**
 * Generate a step-by-step notebook from a paper whose PDF is at a URL
 * (e.g. selected from search results, using its arXiv/Semantic Scholar pdfUrl).
 */
export async function generateNotebookFromUrl(
  paper: PaperSummary,
): Promise<NotebookGenerationWithText> {
  if (!paper.pdfUrl) {
    throw new Error(
      "This paper has no available PDF to generate a notebook from.",
    );
  }
  const text = await extractTextFromPdfUrl(paper.pdfUrl);
  return generateNotebookFromText(paper, text);
}

/** Generate a step-by-step notebook from an uploaded PDF buffer. */
export async function generateNotebookFromUpload(
  paper: PaperSummary,
  fileBuffer: Buffer,
): Promise<NotebookGenerationWithText> {
  const text = await extractTextFromPdf(fileBuffer);
  return generateNotebookFromText(paper, text);
}

async function generateNotebookFromText(
  paper: PaperSummary,
  paperText: string,
): Promise<NotebookGenerationWithText> {
  const prompt = buildNotebookPrompt(paper, paperText);
  const result = await generateStructuredJson<NotebookGenerationResult>(prompt);
  return { ...result, paperText };
}
