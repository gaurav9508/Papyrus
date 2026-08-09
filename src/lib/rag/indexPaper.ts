import { ConvexHttpClient } from "convex/browser";
import { chunkText } from "./chunk";
import { embedTexts } from "@/lib/llm/gemini";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

/** Chunk + embed a paper's text for RAG chat. Call once, right after PDF extraction — same text used for notebook generation. */
export async function indexPaperForChat(
  convex: ConvexHttpClient,
  sessionId: Id<"sessions">,
  fullText: string,
): Promise<void> {
  const chunks = chunkText(fullText);
  if (chunks.length === 0) return;
  const embeddings = await embedTexts(chunks);
  await convex.mutation(api.chunks.insertMany, {
    sessionId,
    chunks: chunks.map((text, i) => ({
      chunkIndex: i,
      text,
      embedding: embeddings[i],
    })),
  });
}
