"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { MessageCircle, X, Send } from "lucide-react";

export function NotebookChatPanel({
  sessionId,
}: {
  sessionId: Id<"sessions">;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messages = useQuery(api.chatMessages.listMine, { sessionId });

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    try {
      await fetch(`/api/notebooks/${sessionId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-stone-900 text-white shadow-lg transition-transform hover:scale-105"
          aria-label="Open notebook chat"
        >
          <MessageCircle size={22} />
        </button>
      )}

      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-stone-200 bg-white shadow-2xl transition-transform duration-200 md:w-1/2 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-stone-200 p-4">
          <h2 className="font-semibold text-stone-900">Ask about this paper</h2>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            className="text-stone-500 hover:text-stone-900"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages?.length === 0 && (
            <p className="text-sm text-stone-400">
              Ask a question — answers are grounded in the paper's actual
              content.
            </p>
          )}
          {messages?.map((m) => (
            <div
              key={m._id}
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                m.role === "user"
                  ? "ml-auto bg-stone-900 text-white"
                  : "mr-auto bg-stone-100 text-stone-800"
              }`}
            >
              {m.content}
            </div>
          ))}
          {sending && (
            <div className="mr-auto max-w-[85%] rounded-2xl bg-stone-100 px-4 py-2 text-sm text-stone-400">
              Thinking…
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t border-stone-200 p-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask a question…"
            className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="rounded-lg bg-stone-900 px-3 py-2 text-white disabled:opacity-40"
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
