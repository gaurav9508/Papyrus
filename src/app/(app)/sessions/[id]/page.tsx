"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { NotebookViewer } from "@/components/notebook/NotebookViewer";
import { NotebookChatPanel } from "@/components/notebook/NotebookChatPanel";
import { Loader2, XCircle, MessageSquareText } from "lucide-react";

export default function SessionPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id as Id<"sessions">;

  const [chatOpen, setChatOpen] = useState(true);

  const session = useQuery(api.sessions.get, { sessionId });
  const blocks = useQuery(
    api.notebooks.listForSession,
    session?.status === "ready" ? { sessionId } : "skip",
  );

  function handleDownload() {
    window.open(`/api/notebooks/${sessionId}/download`, "_blank");
  }

  if (session === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0f14] text-[#8892a0]">
        Loading…
      </div>
    );
  }

  if (session === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0f14] text-[#8892a0]">
        Session not found.
      </div>
    );
  }

  const isReady = session.status === "ready" && blocks;

  return (
    <div className="min-h-screen bg-[#0b0f14]">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-[#1e2732] px-6 py-3">
        <div className="flex items-center gap-2 text-xs text-[#5c6b78]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-[#8892a0]">
            {session.title} / implementation.ipynb
          </span>
          <span className="text-[#4a5460]">
            {session.status === "ready" ? "Synced" : session.status}
            {" · "}Gemini 2.5 Flash assisted
          </span>
        </div>

        {isReady && (
          <button
            onClick={() => setChatOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-md border border-[#2a3541] bg-[#12181f] px-3 py-1.5 text-xs font-medium text-[#e6e4dc] transition-colors hover:border-[#3a4854]"
          >
            <MessageSquareText size={14} />
            {chatOpen ? "Close chat" : "Ask the paper"}
          </button>
        )}
      </div>

      {(session.status === "pending" || session.status === "generating") && (
        <div className="mx-6 my-8 flex items-center gap-3 rounded-lg border border-[#1e2732] bg-[#12181f] p-8 text-[#8892a0]">
          <Loader2 className="animate-spin" size={20} />
          Generating your step-by-step notebook — this can take a minute…
        </div>
      )}

      {session.status === "failed" && (
        <div className="mx-6 my-8 flex items-start gap-3 rounded-lg border border-red-900/40 bg-red-950/30 p-6 text-red-300">
          <XCircle size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Notebook generation failed.</p>
            {session.errorMessage && (
              <p className="text-sm text-red-400">{session.errorMessage}</p>
            )}
          </div>
        </div>
      )}

      {isReady && (
        <div className="flex">
          <div className={chatOpen ? "w-full md:w-3/5" : "w-full"}>
            <NotebookViewer
              title={session.title}
              paperUrl={session.paperExternalUrl}
              blocks={blocks!}
              onDownload={handleDownload}
            />
          </div>

          {chatOpen && (
            <div className="hidden md:block md:w-2/5 border-l border-[#1e2732]">
              <NotebookChatPanel
                sessionId={sessionId}
                paperTitle={session.title}
                onClose={() => setChatOpen(false)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
