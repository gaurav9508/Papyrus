import type { PaperSummary } from "@/lib/types";
import { searchArxiv } from "./arxiv";
import { searchSemanticScholar } from "./semanticScholar";

/**
 * Unified paper search across sources. This is the ONLY function the app's
 * UI/Convex actions should call for search — it hides which underlying
 * source(s) were used and de-duplicates by title so callers don't repeat
 * that logic themselves.
 */
export async function searchPapers(
  query: string,
  limit = 10,
): Promise<PaperSummary[]> {
  const [s2Results, arxivResults] = await Promise.allSettled([
    searchSemanticScholar(query, limit),
    searchArxiv(query, Math.min(limit, 5)),
  ]);

  if (s2Results.status === "rejected") {
    console.error("Semantic Scholar search failed:", s2Results.reason);
  }

  const combined: PaperSummary[] = [];
  if (s2Results.status === "fulfilled") combined.push(...s2Results.value);
  if (arxivResults.status === "fulfilled") combined.push(...arxivResults.value);

  return dedupeByTitle(combined).slice(0, limit);
}

function dedupeByTitle(papers: PaperSummary[]): PaperSummary[] {
  const seen = new Set<string>();
  const result: PaperSummary[] = [];
  for (const paper of papers) {
    const key = paper.title.toLowerCase().replace(/\s+/g, " ").trim();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(paper);
    }
  }
  return result;
}
