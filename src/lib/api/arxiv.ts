import type { PaperSummary } from "@/lib/types";

const BASE_URL = "https://export.arxiv.org/api/query";

/** Minimal XML text extraction helper — avoids pulling in a full XML parser dependency. */
function extractAll(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "g");
  const matches: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    matches.push(m[1].trim());
  }
  return matches;
}

function extractEntries(xml: string): string[] {
  return extractAll(xml, "entry");
}

function parseEntry(entryXml: string): PaperSummary {
  const idUrl = extractAll(entryXml, "id")[0] ?? "";
  const arxivId = idUrl.split("/abs/")[1] ?? idUrl;
  const title = (extractAll(entryXml, "title")[0] ?? "").replace(/\s+/g, " ").trim();
  const summary = (extractAll(entryXml, "summary")[0] ?? "").replace(/\s+/g, " ").trim();
  const authors = extractAll(entryXml, "author").map((a) => {
    const name = extractAll(a, "name")[0];
    return name ?? "";
  });
  const publishedRaw = extractAll(entryXml, "published")[0];
  const year = publishedRaw ? new Date(publishedRaw).getFullYear() : undefined;

  return {
    sourceId: arxivId,
    source: "arxiv",
    title,
    authors,
    abstract: summary,
    year,
    pdfUrl: `https://arxiv.org/pdf/${arxivId}`,
    externalUrl: `https://arxiv.org/abs/${arxivId}`,
  };
}

/** Search arXiv's free public API for papers matching a topic. */
export async function searchArxiv(query: string, limit = 10): Promise<PaperSummary[]> {
  const url = new URL(BASE_URL);
  url.searchParams.set("search_query", `all:${query}`);
  url.searchParams.set("start", "0");
  url.searchParams.set("max_results", String(limit));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`arXiv search failed: ${res.status}`);
  }

  const xml = await res.text();
  return extractEntries(xml).map(parseEntry);
}

/** Fetch a single arXiv paper's metadata by id (used when a user pastes/selects a direct arXiv link). */
export async function getArxivPaper(arxivId: string): Promise<PaperSummary | null> {
  const url = new URL(BASE_URL);
  url.searchParams.set("id_list", arxivId);

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const xml = await res.text();
  const entries = extractEntries(xml);
  return entries.length > 0 ? parseEntry(entries[0]) : null;
}
