import type { PaperSummary } from "@/lib/types";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { truncate } from "@/lib/utils";

interface PaperCardProps {
  paper: PaperSummary;
  onGenerate: (paper: PaperSummary) => void;
  isGenerating?: boolean;
}

/** Displays a single search result with metadata and a "Generate Notebook" action. */
export function PaperCard({ paper, onGenerate, isGenerating }: PaperCardProps) {
  return (
    <Card className="flex flex-col gap-2">
      <CardTitle>{paper.title}</CardTitle>
      <CardDescription>
        {paper.authors.slice(0, 4).join(", ")}
        {paper.authors.length > 4 ? " et al." : ""}
        {paper.year ? ` · ${paper.year}` : ""}
        {paper.venue ? ` · ${paper.venue}` : ""}
      </CardDescription>
      <p className="text-sm text-stone-600">{truncate(paper.abstract, 280)}</p>

      <div className="mt-2 flex items-center gap-3">
        <Button size="sm" onClick={() => onGenerate(paper)} disabled={isGenerating || !paper.pdfUrl}>
          {isGenerating ? "Generating…" : "Generate Notebook"}
        </Button>
        <a
          href={paper.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-stone-500 hover:underline"
        >
          View source ↗
        </a>
        {!paper.pdfUrl && (
          <span className="text-xs text-stone-400">No PDF available</span>
        )}
      </div>
    </Card>
  );
}
