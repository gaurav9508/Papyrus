import type { NotebookBlockDoc } from "@/lib/types";
import { NotebookCell } from "./NotebookCell";
import { Download } from "lucide-react";

interface NotebookViewerProps {
  title: string;
  paperUrl?: string | null;
  blocks: NotebookBlockDoc[];
  onDownload: () => void;
}

/** Renders the full in-app walkthrough for a generated notebook, with a download-as-.ipynb action. */
export function NotebookViewer({
  title,
  paperUrl,
  blocks,
  onDownload,
}: NotebookViewerProps) {
  const codeCells = blocks.filter((b) => b.type === "code").length;

  return (
    <div className="mx-auto max-w-3xl px-8 py-12">
      <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[#6a7583]">
        Notebook · {blocks.length} cells · {codeCells} runnable
      </p>

      <h1 className="font-serif text-4xl leading-tight text-[#e6e4dc]">
        {title}
      </h1>

      <p className="mt-3 text-sm leading-relaxed text-[#8892a0]">
        Implementation notes and experiments
        {paperUrl && (
          <>
            {" "}
            based on href={paperUrl}
            target="_blank" rel="noopener noreferrer" className="text-amber-400
            underline decoration-amber-400/40 underline-offset-2
            hover:decoration-amber-400"
            <a
              href={paperUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 underline decoration-amber-400/40 underline-offset-2 hover:decoration-amber-400"
            >
              the source paper ↗
            </a>
          </>
        )}
        .
      </p>

      <div className="mt-4 flex justify-end">
        <button
          onClick={onDownload}
          className="flex items-center gap-1.5 rounded-md border border-[#2a3541] bg-[#12181f] px-3 py-1.5 text-xs font-medium text-[#e6e4dc] transition-colors hover:border-[#3a4854]"
        >
          <Download size={14} />
          Download .ipynb
        </button>
      </div>

      <div className="mt-8 border-t border-[#1e2732]" />

      <div className="flex flex-col gap-4 pt-8">
        {blocks.map((block, i) => (
          <NotebookCell key={block._id} index={i} block={block} />
        ))}
      </div>
    </div>
  );
}
