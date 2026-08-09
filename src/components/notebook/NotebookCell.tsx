import type { NotebookBlock } from "@/lib/types";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotebookCellProps {
  block: NotebookBlock;
  index: number;
}

/** Renders one notebook cell — markdown as prose, code with monospace + dark editor styling. */
export function NotebookCell({ block, index }: NotebookCellProps) {
  const isCode = block.type === "code";
  const number = String(index + 1).padStart(2, "0");

  return (
    <div className="flex gap-3">
      <div className="w-6 shrink-0 pt-4 text-right font-mono text-xs text-[#4a5460]">
        {number}
      </div>

      <div
        className={cn(
          "flex-1 rounded-lg border overflow-hidden",
          isCode
            ? "border-[#1e2732] bg-[#0e1319]"
            : "border-[#1e2732] bg-[#12181f]",
        )}
      >
        <div className="flex items-center justify-between border-b border-[#1e2732] px-4 py-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-widest",
                isCode ? "text-amber-400/80" : "text-[#6a7583]",
              )}
            >
              {isCode ? "Code" : "Markdown"}
            </span>
            {block.title && (
              <span className="text-sm font-medium text-[#e6e4dc]">
                {block.title}
              </span>
            )}
          </div>
          <MoreHorizontal size={16} className="text-[#4a5460]" />
        </div>

        <div className="p-4">
          {isCode ? (
            <pre className="overflow-x-auto font-mono text-sm leading-relaxed text-[#d8dde3]">
              <code>{block.content}</code>
            </pre>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#b8bfc7]">
              {block.content}
            </p>
          )}
        </div>

        {isCode && (
          <div className="flex items-center gap-1.5 border-t border-[#1e2732] px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-[#4a5460]">executed</span>
          </div>
        )}
      </div>
    </div>
  );
}
