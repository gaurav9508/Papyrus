import type { PaperSummary } from "@/lib/types";

/**
 * Builds the prompt used to turn a paper's text into a structured, step-by-step
 * notebook. Centralized here so prompt tweaks happen in exactly one place.
 */
export function buildNotebookPrompt(paper: PaperSummary, paperText: string): string {
  return `You are an expert ML engineer and teacher. You will read the text of a research paper and produce a step-by-step Jupyter-notebook-style implementation walkthrough that a student could run to understand and reproduce the paper's core ideas.

Paper title: ${paper.title}
Authors: ${paper.authors.join(", ")}

Paper text (may be truncated):
"""
${paperText}
"""

Instructions:
- Break the implementation into logical steps (e.g. data/tokenizer setup, model architecture, training loop, evaluation).
- Alternate "markdown" cells (short conceptual explanation, 2-5 sentences) with "code" cells (runnable, well-commented Python).
- Code should be minimal but functional/illustrative (e.g. using PyTorch), not pseudocode — favor small toy-scale examples over production code so it actually runs quickly.
- Include a short "title" for each cell describing the step (e.g. "Step 2: Tokenizer").
- Aim for 8-16 cells total.

Respond with ONLY valid JSON matching this exact shape, no other text:
{
  "title": "string, short notebook title",
  "blocks": [
    { "type": "markdown" | "code", "title": "string", "content": "string" }
  ]
}`;
}
