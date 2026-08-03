"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { NotebookViewer } from "@/components/notebook/NotebookViewer";
import { Loader2, XCircle } from "lucide-react";

export default function SessionPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id as Id<"sessions">;

  const session = useQuery(api.sessions.get, { sessionId });
  const blocks = useQuery(
    api.notebooks.listForSession,
    session?.status === "ready" ? { sessionId } : "skip"
  );

  function handleDownload() {
    window.open(`/api/notebooks/${sessionId}/download`, "_blank");
  }

  if (session === undefined) {
    return <p className="text-stone-500">Loading…</p>;
  }

  if (session === null) {
    return <p className="text-stone-500">Session not found.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">{session.title}</h1>
        {session.paperExternalUrl && (
          <a
            href={session.paperExternalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-stone-500 hover:underline"
          >
            View original paper ↗
          </a>
        )}
      </div>

      {(session.status === "pending" || session.status === "generating") && (
        <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-8 text-stone-600">
          <Loader2 className="animate-spin" size={20} />
          Generating your step-by-step notebook — this can take a minute…
        </div>
      )}

      {session.status === "failed" && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          <XCircle size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Notebook generation failed.</p>
            {session.errorMessage && <p className="text-sm">{session.errorMessage}</p>}
          </div>
        </div>
      )}

      {session.status === "ready" && blocks && (
        <NotebookViewer title={session.title} blocks={blocks} onDownload={handleDownload} />
      )}
    </div>
  );
}
