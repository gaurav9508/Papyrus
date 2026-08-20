"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { NotebookViewer } from "@/components/notebook/NotebookViewer";
import { Loader2 } from "lucide-react";

export default function SharedSessionPage() {
  const params = useParams<{ slug: string }>();
  const session = useQuery(api.sessions.getByShareSlug, { slug: params.slug });
  const blocks = useQuery(
    api.notebooks.listForSessionPublic,
    session ? { sessionId: session._id } : "skip",
  );

  if (session === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0f14] text-[#8892a0]">
        <Loader2 className="animate-spin" size={20} />
      </div>
    );
  }

  if (session === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0f14] text-[#8892a0]">
        This link is invalid or no longer shared.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f14]">
      <div className="border-b border-[#1e2732] px-6 py-3 text-xs text-[#5c6b78]">
        <span className="text-[#8892a0]">{session.title}</span>
        <span className="text-[#4a5460]"> · Shared read-only view</span>
      </div>
      <NotebookViewer
        title={session.title}
        paperUrl={session.paperExternalUrl}
        blocks={blocks ?? []}
      />
    </div>
  );
}
