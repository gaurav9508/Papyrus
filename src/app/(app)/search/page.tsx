"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PaperCard } from "@/components/papers/PaperCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
      const res = await fetch(`/api/papers/search?q=${encodeURIComponent(query)}`);
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

      // Kick off generation in the background, then take the user to the session
      // page immediately so they can watch its status update live.
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
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-stone-900">Search Papers</h1>

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. small language models, RLHF, vision transformers…"
        />
        <Button type="submit" disabled={isSearching}>
          <SearchIcon size={16} />
          {isSearching ? "Searching…" : "Search"}
        </Button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-col gap-4">
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
        <p className="text-stone-400">Search for a topic to find related papers.</p>
      )}
    </div>
  );
}
