"use client";

import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { NotebookBlockDoc } from "@/lib/types";
import { MoreHorizontal, Pencil, RefreshCw, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotebookCellProps {
  block: NotebookBlockDoc;
  index: number;
}

export function NotebookCell({ block, index }: NotebookCellProps) {
  const isCode = block.type === "code";
  const number = String(index + 1).padStart(2, "0");

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(block.content);

  const updateBlockContent = useMutation(api.notebooks.updateBlockContent);
  const regenerateBlock = useAction(api.notebooks.regenerateBlock);

  const blockId = block._id as Id<"notebookBlocks">;

  const handleSave = async () => {
    await updateBlockContent({ blockId, content: draft });
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(block.content);
    setEditing(false);
  };

  const handleRegenerate = async () => {
    await regenerateBlock({ blockId });
  };

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
            {block.editedByUser && (
              <span className="text-[10px] text-[#4a5460]">(edited)</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {block.regenerating ? (
              <RefreshCw size={14} className="animate-spin text-amber-400/80" />
            ) : editing ? (
              <>
                <button onClick={handleSave} title="Save">
                  <Check size={14} className="text-emerald-400" />
                </button>
                <button onClick={handleCancel} title="Cancel">
                  <X size={14} className="text-[#8892a0]" />
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} title="Edit">
                  <Pencil
                    size={14}
                    className="text-[#4a5460] hover:text-[#e6e4dc]"
                  />
                </button>
                <button onClick={handleRegenerate} title="Regenerate">
                  <RefreshCw
                    size={14}
                    className="text-[#4a5460] hover:text-[#e6e4dc]"
                  />
                </button>
                <MoreHorizontal size={16} className="text-[#4a5460]" />
              </>
            )}
          </div>
        </div>

        <div className="p-4">
          {editing ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={Math.max(4, draft.split("\n").length)}
              className={cn(
                "w-full resize-y rounded-md border border-[#2a3541] bg-[#0a0e13] p-2 text-sm leading-relaxed text-[#d8dde3] outline-none focus:border-amber-400/50",
                isCode ? "font-mono" : "",
              )}
            />
          ) : isCode ? (
            <pre className="overflow-x-auto font-mono text-sm leading-relaxed text-[#d8dde3]">
              <code>{block.content}</code>
            </pre>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#b8bfc7]">
              {block.content}
            </p>
          )}
        </div>

        {isCode && !editing && (
          <div className="flex items-center gap-1.5 border-t border-[#1e2732] px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-[#4a5460]">executed</span>
          </div>
        )}
      </div>
    </div>
  );
}
