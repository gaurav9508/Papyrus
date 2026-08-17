import type { PaperSummary } from "@/lib/types";
import { searchArxiv } from "./arxiv";
import { searchSemanticScholar } from "./semanticScholar";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function normalizeQuery(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Unified paper search across sources. This is the ONLY function the app's
 * UI/Convex actions should call for search — it hides which underlying
 * source(s) were used and de-duplicates by title so callers don't repeat
 * that logic themselves. Results are cached in Convex (searchCache) for
 * 1 hour per normalized query to reduce load on free-tier search APIs.
 */
export async function searchPapers(
  query: string,
  limit = 10,
): Promise<PaperSummary[]> {
  const cacheKey = normalizeQuery(query);

  try {
    const cached = await convex.query(api.searchCache.getByQuery, {
      query: cacheKey,
    });
    if (cached) {
      const parsed: PaperSummary[] = JSON.parse(cached);
      return parsed.slice(0, limit);
    }
  } catch (err) {
    console.error("searchCache read failed:", err);
  }

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

  const deduped = dedupeByTitle(combined).slice(0, limit);

  try {
    await convex.mutation(api.searchCache.store, {
      query: cacheKey,
      resultsJson: JSON.stringify(deduped),
    });
  } catch (err) {
    console.error("searchCache write failed:", err);
  }

  return deduped;
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
