import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAuthenticatedConvexClient } from "@/lib/convexServer";
import { api } from "../../../../../../convex/_generated/api";
import { embedQuery, generateText } from "@/lib/llm/gemini";
import { Id } from "../../../../../../convex/_generated/dataModel";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  await auth.protect();

  const { message } = (await req.json()) as { message?: string };
  if (!message?.trim())
    return NextResponse.json({ error: "Missing 'message'." }, { status: 400 });

  const { sessionId: rawSessionId } = await params;
  const sessionId = rawSessionId as Id<"sessions">;
  const convex = await getAuthenticatedConvexClient();

  try {
    await convex.mutation(api.chatMessages.add, {
      sessionId,
      role: "user",
      content: message.trim(),
    });

    const questionEmbedding = await embedQuery(message.trim());
    const chunks = await convex.action(api.chunks.search, {
      sessionId,
      embedding: questionEmbedding,
      topK: 5,
    });
    const history = await convex.query(api.chatMessages.listMine, {
      sessionId,
    });

    const context = chunks.map((c) => c.text).join("\n\n---\n\n");
    const historyText = history
      .slice(-10)
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    const prompt = `You are answering questions about a research paper. Use only the excerpts below — if the answer isn't in them, say so.

Paper excerpts:
${context}

Conversation so far:
${historyText}

Answer the latest question clearly and concisely.`;

    const answer = await generateText(prompt);
    await convex.mutation(api.chatMessages.add, {
      sessionId,
      role: "assistant",
      content: answer,
    });

    return NextResponse.json({ answer });
  } catch (err) {
    console.error("Notebook chat failed:", err);
    return NextResponse.json(
      { error: "Failed to generate a response." },
      { status: 502 },
    );
  }
}
