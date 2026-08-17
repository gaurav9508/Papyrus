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
const MAX_RETRIES = 4;
const BASE_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Exponential backoff with jitter: 1s, 2s, 4s, 8s (+/- up to 300ms). */
function backoffDelay(attempt: number): number {
  const exp = BASE_DELAY_MS * 2 ** attempt;
  const jitter = Math.random() * 300;
  return exp + jitter;
}

async function fetchWithRetry(url: string): Promise<Response> {
  let lastRes: Response | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });

    if (res.status !== 429) {
      return res;
    }

    lastRes = res;

    if (attempt === MAX_RETRIES) {
      console.error(
        `Semantic Scholar: rate limited after ${MAX_RETRIES + 1} attempts, giving up.`,
      );
      break;
    }

    const retryAfterHeader = res.headers.get("retry-after");
    const delay = retryAfterHeader
      ? Number(retryAfterHeader) * 1000
      : backoffDelay(attempt);

    console.warn(
      `Semantic Scholar: 429 rate limited (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${Math.round(delay)}ms.`,
    );

    await sleep(delay);
  }

  return lastRes!;
}

/** Search Semantic Scholar's free public API for papers matching a topic. */
export async function searchSemanticScholar(
  query: string,
  limit = 10,
): Promise<PaperSummary[]> {
  const url = new URL(`${BASE_URL}/paper/search`);
  url.searchParams.set("query", query);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("fields", FIELDS);

  const res = await fetchWithRetry(url.toString());

  if (!res.ok) {
    throw new Error(`Semantic Scholar search failed: ${res.status}`);
  }

  const data = (await res.json()) as { data?: S2Paper[] };
  return (data.data ?? []).map(mapToPaperSummary);
}
