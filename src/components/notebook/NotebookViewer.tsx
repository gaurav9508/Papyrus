import type { NotebookBlock } from "@/lib/types";
import { NotebookCell } from "./NotebookCell";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface NotebookViewerProps {
  title: string;
  blocks: NotebookBlock[];
  onDownload: () => void;
}

/** Renders the full in-app walkthrough for a generated notebook, with a download-as-.ipynb action. */
export function NotebookViewer({ title, blocks, onDownload }: NotebookViewerProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-stone-900">{title}</h2>
        <Button variant="secondary" size="sm" onClick={onDownload}>
          <Download size={16} />
          Download .ipynb
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {blocks.map((block) => (
          <NotebookCell key={block.order} block={block} />
        ))}
      </div>
    </div>
  );
}
