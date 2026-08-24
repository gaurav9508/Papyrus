"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { FileText, Send, Sparkles, X, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const SUGGESTIONS = ["What's the core method?", "What should I try first?"];

const markdownComponents = {
  p: (props: any) => (
    <p className="mb-2 last:mb-0 leading-relaxed" {...props} />
  ),
  strong: (props: any) => <strong className="font-semibold" {...props} />,
  em: (props: any) => <em className="italic" {...props} />,
  ul: (props: any) => (
    <ul className="mb-2 ml-4 list-disc space-y-1 last:mb-0" {...props} />
  ),
  ol: (props: any) => (
    <ol className="mb-2 ml-4 list-decimal space-y-1 last:mb-0" {...props} />
  ),
  li: (props: any) => <li className="leading-relaxed" {...props} />,
  code: (props: any) => (
    <code className="rounded bg-black/30 px-1 py-0.5 text-xs" {...props} />
  ),
  pre: (props: any) => (
    <pre
      className="mb-2 overflow-x-auto rounded-md bg-black/30 p-2 text-xs last:mb-0"
      {...props}
    />
  ),
  a: ({ children, ...props }: any) => (
    <a
      className="text-amber-400 underline underline-offset-2"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
};

/** Matches user messages that are asking for a summary/export, e.g. "summarize this", "summarise the chat". */
function isSummaryRequest(text: string): boolean {
  return /^(summari[sz]e|summary|export( this)?( as)? pdf|download( a)? summary)/i.test(
    text.trim(),
  );
}

export function NotebookChatPanel({
  sessionId,
  paperTitle,
  onClose,
}: {
  sessionId: Id<"sessions">;
  paperTitle: string;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { isAuthenticated } = useConvexAuth();
  const messages = useQuery(
    api.chatMessages.listMine,
    isAuthenticated ? { sessionId } : "skip",
  );

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function handleExportSummary(scope: "notebook" | "chat" | "both") {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const res = await fetch(`/api/notebooks/${sessionId}/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope }),
      });
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `summary-${sessionId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  const handleSend = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || sending) return;

    // Chat-triggered variant: typing a summarize/export request downloads the PDF
    // instead of hitting the RAG chat endpoint.
    if (isSummaryRequest(message)) {
      setInput("");
      handleExportSummary("both");
      return;
    }

    setInput("");
    setSending(true);
    try {
      await fetch(`/api/notebooks/${sessionId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#0b0f14]">
      <div className="flex shrink-0 items-start justify-between px-6 pt-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[#6a7583]">
            Paper companion
          </p>
          <h2 className="mt-1 flex items-center gap-1.5 font-serif text-2xl text-[#e6e4dc]">
            Ask the paper <Sparkles size={16} className="text-amber-400" />
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleExportSummary("both")}
            disabled={isExporting}
            title="Summarize this session and download as PDF"
            className="flex items-center gap-1.5 rounded-full border border-[#2a3541] px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-[#b8bfc7] hover:border-amber-400 hover:text-amber-400 disabled:opacity-40"
          >
            <Download size={12} />
            {isExporting ? "Exporting…" : "Export PDF"}
          </button>
          <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
          <button
            onClick={onClose}
            aria-label="Close chat"
            className="text-[#6a7583] hover:text-[#e6e4dc] md:hidden"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="mx-6 mt-4 flex shrink-0 items-center gap-3 rounded-lg border border-[#1e2732] bg-[#12181f] px-4 py-3">
        <FileText size={16} className="text-[#6a7583]" />
        <div>
          <p className="text-sm font-medium text-[#e6e4dc]">{paperTitle}</p>
          <p className="text-xs text-[#6a7583]">
            Grounded in the full paper text
          </p>
        </div>
      </div>

      <div className="themed-scroll flex-1 space-y-3 overflow-y-auto px-6 py-4">
        {messages?.length === 0 && (
          <div className="rounded-lg bg-[#12181f] px-4 py-3 text-sm leading-relaxed text-[#b8bfc7]">
            I'm grounded in this paper. Ask me about the method, the code, or
            what to try next — or type "summarize" to get a PDF recap.
          </div>
        )}
        {messages?.map((m) => (
          <div
            key={m._id}
            className={
              m.role === "user"
                ? "ml-auto max-w-[85%] rounded-2xl bg-[#e6e4dc] px-4 py-2 text-sm text-[#0b0f14]"
                : "mr-auto max-w-[85%] rounded-2xl bg-[#12181f] px-4 py-2 text-sm text-[#d8dde3]"
            }
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {m.content}
            </ReactMarkdown>
          </div>
        ))}
        {sending && (
          <div className="mr-auto max-w-[85%] rounded-2xl bg-[#12181f] px-4 py-2 text-sm text-[#6a7583]">
            Thinking…
          </div>
        )}
        {isExporting && (
          <div className="mr-auto max-w-[85%] rounded-2xl bg-[#12181f] px-4 py-2 text-sm text-[#6a7583]">
            Generating your PDF summary…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-[#1e2732] px-6 py-4">
        <p className="mb-2 text-[10px] uppercase tracking-widest text-[#4a5460]">
          Try asking
        </p>
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              className="rounded-full border border-[#2a3541] px-3 py-1 text-xs text-[#b8bfc7] hover:border-[#3a4854] hover:text-[#e6e4dc]"
            >
              {q}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-[#2a3541] bg-[#12181f] px-3 py-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about this paper… or type 'summarize'"
            className="flex-1 bg-transparent text-sm text-[#e6e4dc] placeholder:text-[#4a5460] focus:outline-none"
          />
          <button
            onClick={() => handleSend()}
            disabled={sending || !input.trim()}
            className="rounded-md bg-amber-400 p-1.5 text-[#0b0f14] disabled:opacity-30"
            aria-label="Send message"
          >
            <Send size={14} />
          </button>
        </div>
        <p className="mt-2 text-[10px] text-[#4a5460]">
          ⏎ Enter to send · answers cite the paper · type "summarize" to export
          a PDF
        </p>
      </div>
    </div>
  );
}
