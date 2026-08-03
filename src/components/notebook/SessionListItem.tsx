"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { Trash2 } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

type Status = "pending" | "generating" | "ready" | "failed";

interface SessionListItemProps {
  id: string;
  title: string;
  paperTitle: string;
  status: Status;
  updatedAt: number;
}

const statusStyles: Record<Status, string> = {
  pending: "bg-stone-100 text-stone-600",
  generating: "bg-amber-100 text-amber-700",
  ready: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
};

/** One square card in the dashboard's session ("chat") grid. */
export function SessionListItem({
  id,
  title,
  paperTitle,
  status,
  updatedAt,
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

  return (
    <Card
      onClick={() => router.push(`/sessions/${id}`)}
      className="group relative flex aspect-square cursor-pointer flex-col justify-between rounded-2xl p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <button
        onClick={handleDelete}
        disabled={deleting}
        aria-label="Delete notebook"
        className="absolute right-3 top-3 rounded-full p-1.5 text-stone-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 disabled:opacity-50"
      >
        <Trash2 size={16} />
      </button>

      <div>
        <CardTitle className="line-clamp-2 pr-6">{title}</CardTitle>
        <CardDescription className="line-clamp-2">{paperTitle}</CardDescription>
      </div>

      <div className="flex items-center justify-between">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status]}`}
        >
          {status}
        </span>
        <span className="text-xs text-stone-400">{formatDate(updatedAt)}</span>
      </div>
    </Card>
  );
}
