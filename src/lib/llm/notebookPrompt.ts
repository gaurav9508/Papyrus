import type { PaperSummary } from "@/lib/types";

interface RegenBlockInput {
  paperTitle: string;
  blockType: "markdown" | "code";
  blockTitle?: string;
  blockContent: string;
  prevBlock?: { title?: string; content: string };
  nextBlock?: { title?: string; content: string };
  context: string;
}

/**
 * Builds the prompt used to turn a paper's text into a structured, step-by-step
 * notebook. Centralized here so prompt tweaks happen in exactly one place.
 */
export function buildNotebookPrompt(
  paper: PaperSummary,
  paperText: string,
): string {
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

/** Builds the prompt for regenerating a single notebook cell in place. */
export function buildRegenBlockPrompt(input: RegenBlockInput): string {
  return `You are an expert ML engineer and teacher, improving one cell of an existing implementation notebook for the paper "${input.paperTitle}".

Relevant paper excerpts:
"""
${input.context}
"""

${input.prevBlock ? `Previous cell (${input.prevBlock.title ?? "untitled"}):\n${input.prevBlock.content}\n` : ""}
Cell to regenerate (type: ${input.blockType}, title: ${input.blockTitle ?? "untitled"}):
"""
${input.blockContent}
"""
${input.nextBlock ? `\nNext cell (${input.nextBlock.title ?? "untitled"}):\n${input.nextBlock.content}` : ""}

Rewrite ONLY this cell. Keep it consistent with the surrounding cells (same variables/names where relevant), same "${input.blockType}" type. If code, keep it minimal, runnable, well-commented.

Respond with ONLY valid JSON, no other text:
{ "title": "string", "content": "string" }`;
}
