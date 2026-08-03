import type { PaperSummary } from "@/lib/types";

const BASE_URL = "https://api.semanticscholar.org/graph/v1";
const FIELDS =
  "title,authors,abstract,year,venue,citationCount,externalIds,openAccessPdf,url";

interface S2Author {
  name: string;
}

interface S2Paper {
  paperId: string;
  title: string;
  authors: S2Author[];
  abstract: string | null;
  year: number | null;
  venue: string | null;
  citationCount: number | null;
  externalIds?: { ArXiv?: string };
  openAccessPdf?: { url: string } | null;
  url: string;
}

function mapToPaperSummary(p: S2Paper): PaperSummary {
  return {
    sourceId: p.paperId,
    source: "semanticScholar",
    title: p.title,
    authors: p.authors?.map((a) => a.name) ?? [],
    abstract: p.abstract ?? "",
    year: p.year ?? undefined,
    venue: p.venue ?? undefined,
    citationCount: p.citationCount ?? undefined,
    pdfUrl: p.openAccessPdf?.url,
    externalUrl: p.url,
  };
}

/** Search Semantic Scholar's free public API for papers matching a topic. */
export async function searchSemanticScholar(
  query: string,
  limit = 10
): Promise<PaperSummary[]> {
  const url = new URL(`${BASE_URL}/paper/search`);
  url.searchParams.set("query", query);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("fields", FIELDS);

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    // Semantic Scholar's free tier is unauthenticated but rate-limited; cache briefly.
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Semantic Scholar search failed: ${res.status}`);
  }

  const data = (await res.json()) as { data?: S2Paper[] };
  return (data.data ?? []).map(mapToPaperSummary);
}
