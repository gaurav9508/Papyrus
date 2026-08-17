"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PaperCard } from "@/components/papers/PaperCard";
import { Input } from "@/components/ui/input";
import { ButtonLight } from "@/components/ui/button-light";
import type { PaperSummary } from "@/lib/types";
import { Search as SearchIcon } from "lucide-react";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PaperSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createSession = useMutation(api.sessions.create);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/papers/search?q=${encodeURIComponent(query)}`,
      );
      if (!res.ok) throw new Error("Search failed.");
      const data = await res.json();
      setResults(data.results);
    } catch {
      setError("Something went wrong searching for papers. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }

  async function handleGenerate(paper: PaperSummary) {
    setGeneratingId(paper.sourceId);
    setError(null);
    try {
      const sessionId = await createSession({
        title: paper.title,
        paperSourceId: paper.sourceId,
        paperSource: paper.source,
        paperTitle: paper.title,
        paperAuthors: paper.authors,
        paperAbstract: paper.abstract,
        paperExternalUrl: paper.externalUrl,
        paperPdfUrl: paper.pdfUrl,
      });

      fetch("/api/notebooks/generate-from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, paper }),
      });

      router.push(`/sessions/${sessionId}`);
    } catch {
      setError("Couldn't start notebook generation. Please try again.");
      setGeneratingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="font-serif text-4xl text-(--color-ink)">
        Search <span className="italic text-(--color-blue)">Papers.</span>
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        Find a paper on any topic and turn it into a guided implementation
        notebook.
      </p>

      <form onSubmit={handleSearch} className="mt-6 flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. small language models, RLHF, vision transformers…"
        />
        <ButtonLight type="submit" variant="primary" disabled={isSearching}>
          <SearchIcon size={16} />
          {isSearching ? "Searching…" : "Search"}
        </ButtonLight>
      </form>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      <div className="mt-6 flex flex-col gap-4">
        {results.map((paper) => (
          <PaperCard
            key={`${paper.source}-${paper.sourceId}`}
            paper={paper}
            onGenerate={handleGenerate}
            isGenerating={generatingId === paper.sourceId}
          />
        ))}
      </div>

      {results.length === 0 && !isSearching && (
        <div className="mt-16 flex flex-col items-center justify-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-(--color-cream-dim)">
            <SearchIcon size={20} className="text-(--color-blue)" />
          </div>
          <p className="font-serif text-lg text-(--color-ink)">
            Search for a topic to find related papers.
          </p>
          <p className="text-sm text-neutral-400">
            Try “small language models,” “RLHF,” or “vision transformers.”
          </p>
        </div>
      )}
    </div>
  );
}
