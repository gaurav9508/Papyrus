import type { NotebookBlock } from "@/lib/types";
import { cn } from "@/lib/utils";

interface NotebookCellProps {
  block: NotebookBlock;
}

/** Renders one notebook cell — markdown as prose, code with monospace + syntax-friendly styling. */
export function NotebookCell({ block }: NotebookCellProps) {
  return (
    <div className={cn("rounded-lg border", block.type === "code" ? "border-stone-800 bg-stone-950" : "border-stone-200 bg-white")}>
      {block.title && (
        <div
          className={cn(
            "border-b px-4 py-2 text-xs font-semibold uppercase tracking-wide",
            block.type === "code" ? "border-stone-800 text-stone-400" : "border-stone-100 text-stone-500"
          )}
        >
          {block.title}
        </div>
      )}
      <div className="p-4">
        {block.type === "code" ? (
          <pre className="overflow-x-auto text-sm text-stone-100">
            <code>{block.content}</code>
          </pre>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{block.content}</p>
        )}
      </div>
    </div>
  );
}
