/**
 * Shared domain types for Papyrus.
 * Single source of truth — reused by lib/, components/, app/, and convex/ functions
 * so paper/session/notebook shapes never drift between layers.
 */

export type PaperSource = "arxiv" | "semanticScholar" | "upload";

export interface PaperSummary {
  sourceId: string; // arXiv id or Semantic Scholar paperId
  source: PaperSource;
  title: string;
  authors: string[];
  abstract: string;
  year?: number;
  venue?: string;
  citationCount?: number;
  pdfUrl?: string;
  externalUrl: string;
}

export type NotebookBlockType = "markdown" | "code";

export interface NotebookBlock {
  order: number;
  type: NotebookBlockType;
  content: string;
  // For code blocks, an optional short title shown above the cell (e.g. "Step 3: Tokenizer")
  title?: string;
}

export type SessionStatus = "pending" | "generating" | "ready" | "failed";

export interface NotebookSession {
  _id: string;
  userId: string;
  title: string;
  paper: PaperSummary;
  status: SessionStatus;
  createdAt: number;
  updatedAt: number;
  errorMessage?: string;
}

/** Structured response we ask the LLM to produce for notebook generation. */
export interface NotebookGenerationResult {
  title: string;
  blocks: Omit<NotebookBlock, "order">[];
}
