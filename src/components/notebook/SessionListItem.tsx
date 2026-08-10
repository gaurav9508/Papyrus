"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { Trash2 } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  CardLight,
  CardLightTitle,
  CardLightDescription,
} from "@/components/ui/card-light";
import { formatDate } from "@/lib/utils";

type Status = "pending" | "generating" | "ready" | "failed";

interface SessionListItemProps {
  id: string;
  title: string;
  paperTitle: string;
  status: Status;
  updatedAt: number;
  view?: "grid" | "list";
}

const statusStyles: Record<Status, string> = {
  pending: "bg-[color:var(--color-cream-dim)] text-[color:var(--color-ink)]/60",
  generating: "bg-[color:var(--color-gold)]/15 text-[color:var(--color-gold)]",
  ready: "bg-emerald-500/10 text-emerald-600",
  failed:
    "bg-[color:var(--color-terracotta)]/15 text-[color:var(--color-terracotta)]",
};

/** One card in the dashboard's session ("notebook") grid or list. */
export function SessionListItem({
  id,
  title,
  paperTitle,
  status,
  updatedAt,
  view = "grid",
}: SessionListItemProps) {
  const router = useRouter();
  const removeSession = useMutation(api.sessions.remove);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this notebook? This can't be undone.")) return;
    setDeleting(true);
    try {
      await removeSession({ sessionId: id as Id<"sessions"> });
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  };

  const statusBadge = (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status]}`}
    >
      {status}
    </span>
  );

  if (view === "list") {
    return (
      <CardLight
        onClick={() => router.push(`/sessions/${id}`)}
        className="group flex cursor-pointer items-center justify-between px-4 py-3 transition-colors hover:border-(--color-blue)"
      >
        <div className="min-w-0">
          <CardLightTitle className="truncate text-base">
            {title}
          </CardLightTitle>
          <CardLightDescription className="truncate">
            {paperTitle}
          </CardLightDescription>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          {statusBadge}
          <span className="text-xs text-ink/40">{formatDate(updatedAt)}</span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Delete notebook"
            className="rounded-full p-1.5 text-ink/30 opacity-0 transition-opacity hover:bg-terracotta/10 hover:text-(--color-terracotta) group-hover:opacity-100 disabled:opacity-50"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </CardLight>
    );
  }

  return (
    <CardLight
      onClick={() => router.push(`/sessions/${id}`)}
      className="group relative flex aspect-square cursor-pointer flex-col justify-between rounded-2xl p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-(--color-blue) hover:shadow-md"
    >
      <button
        onClick={handleDelete}
        disabled={deleting}
        aria-label="Delete notebook"
        className="absolute right-3 top-3 rounded-full p-1.5 text-ink/30 opacity-0 transition-opacity hover:bg-terracotta/10 hover:text-(--color-terracotta) group-hover:opacity-100 disabled:opacity-50"
      >
        <Trash2 size={16} />
      </button>

      <div>
        <CardLightTitle className="line-clamp-2 pr-6 text-base">
          {title}
        </CardLightTitle>
        <CardLightDescription className="mt-1 line-clamp-2">
          {paperTitle}
        </CardLightDescription>
      </div>

      <div className="flex items-center justify-between">
        {statusBadge}
        <span className="text-xs text-ink/40">{formatDate(updatedAt)}</span>
      </div>
    </CardLight>
  );
}
