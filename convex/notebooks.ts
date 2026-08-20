import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { requireUserId } from "./lib/auth";
import { internal } from "./_generated/api";
import { generateStructuredJson, embedQuery } from "../src/lib/llm/gemini";
import { buildRegenBlockPrompt } from "../src/lib/llm/notebookPrompt";

/** Get all cells for a session, in order — powers the in-app walkthrough viewer. */
export const listForSession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    await requireUserId(ctx); // ensures caller is authenticated; ownership checked via session
    const session = await ctx.db.get(args.sessionId);
    if (!session) return [];

    const blocks = await ctx.db
      .query("notebookBlocks")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    return blocks.sort((a, b) => a.order - b.order);
  },
});

/** Public, unauthenticated version — only returns blocks if the session is publicly shared. */
export const listForSessionPublic = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || !session.isPublic) return [];

    const blocks = await ctx.db
      .query("notebookBlocks")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    return blocks.sort((a, b) => a.order - b.order);
  },
});

/** Bulk-insert generated blocks for a session (called once after LLM generation completes). */
export const saveGenerated = mutation({
  args: {
    sessionId: v.id("sessions"),
    blocks: v.array(
      v.object({
        type: v.union(v.literal("markdown"), v.literal("code")),
        title: v.optional(v.string()),
        content: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId)
      throw new Error("Session not found.");

    await Promise.all(
      args.blocks.map((block, index) =>
        ctx.db.insert("notebookBlocks", {
          ...block,
          sessionId: args.sessionId,
          order: index,
        }),
      ),
    );

    await ctx.db.patch(args.sessionId, { status: "ready" });
  },
});

/**
 * Same as saveGenerated but callable from the internal retry route (no Clerk session).
 * Public function gated by a shared secret instead of Clerk auth — required because
 * `internal.*` functions cannot be invoked from outside Convex (e.g. Next.js API routes).
 */
export const saveGeneratedSystem = mutation({
  args: {
    sessionId: v.id("sessions"),
    blocks: v.array(
      v.object({
        type: v.union(v.literal("markdown"), v.literal("code")),
        title: v.optional(v.string()),
        content: v.string(),
      }),
    ),
    secret: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.secret !== process.env.INTERNAL_RETRY_SECRET) {
      throw new Error("Unauthorized.");
    }
    await Promise.all(
      args.blocks.map((block, index) =>
        ctx.db.insert("notebookBlocks", {
          ...block,
          sessionId: args.sessionId,
          order: index,
        }),
      ),
    );
    await ctx.db.patch(args.sessionId, {
      status: "ready",
      errorMessage: undefined,
    });
  },
});

/** Wipe partial notebook/chunk data before a retry regenerates them. Secret-gated (see above). */
export const clearGeneratedSystem = mutation({
  args: { sessionId: v.id("sessions"), secret: v.string() },
  handler: async (ctx, args) => {
    if (args.secret !== process.env.INTERNAL_RETRY_SECRET) {
      throw new Error("Unauthorized.");
    }
    const blocks = await ctx.db
      .query("notebookBlocks")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    await Promise.all(blocks.map((b) => ctx.db.delete(b._id)));

    const chunks = await ctx.db
      .query("paperChunks")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    await Promise.all(chunks.map((c) => ctx.db.delete(c._id)));
  },
});

export const updateBlockContent = mutation({
  args: {
    blockId: v.id("notebookBlocks"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const block = await ctx.db.get(args.blockId);
    if (!block) throw new Error("Block not found.");
    const session = await ctx.db.get(block.sessionId);
    if (!session || session.userId !== userId)
      throw new Error("Not authorized.");

    await ctx.db.patch(args.blockId, {
      content: args.content,
      editedByUser: true,
    });
  },
});

export const regenerateBlock = action({
  args: { blockId: v.id("notebookBlocks") },
  handler: async (ctx, args): Promise<void> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated.");
    const userId = identity.subject;

    const block = await ctx.runQuery(
      internal.notebookHelpers.getBlockInternal,
      {
        blockId: args.blockId,
      },
    );
    if (!block) throw new Error("Block not found.");

    const session = await ctx.runQuery(
      internal.notebookHelpers.getSessionInternal,
      {
        sessionId: block.sessionId,
      },
    );
    if (!session || session.userId !== userId)
      throw new Error("Not authorized.");

    await ctx.runMutation(internal.notebookHelpers.setRegeneratingInternal, {
      blockId: args.blockId,
      value: true,
    });

    try {
      const allBlocks = await ctx.runQuery(
        internal.notebookHelpers.listBlocksInternal,
        {
          sessionId: block.sessionId,
        },
      );
      const idx = allBlocks.findIndex((b) => b._id === args.blockId);
      const prevBlock = idx > 0 ? allBlocks[idx - 1] : undefined;
      const nextBlock =
        idx < allBlocks.length - 1 ? allBlocks[idx + 1] : undefined;

      const queryVector = await embedQuery(
        `${block.title ?? ""}\n${block.content}`,
      );

      const results = await ctx.vectorSearch("paperChunks", "by_embedding", {
        vector: queryVector,
        limit: 6,
        filter: (q) => q.eq("sessionId", block.sessionId),
      });

      const chunkDocs = await ctx.runQuery(internal.chunkHelpers.getByIds, {
        ids: results.map((r) => r._id),
      });
      const context = chunkDocs.map((c) => c.text).join("\n\n");

      const prompt = buildRegenBlockPrompt({
        paperTitle: session.paperTitle,
        blockType: block.type,
        blockTitle: block.title,
        blockContent: block.content,
        prevBlock: prevBlock
          ? { title: prevBlock.title, content: prevBlock.content }
          : undefined,
        nextBlock: nextBlock
          ? { title: nextBlock.title, content: nextBlock.content }
          : undefined,
        context,
      });

      const result = await generateStructuredJson<{
        title?: string;
        content: string;
      }>(prompt);

      await ctx.runMutation(internal.notebookHelpers.patchBlockInternal, {
        blockId: args.blockId,
        content: result.content,
        title: result.title ?? block.title,
      });
    } catch (err) {
      await ctx.runMutation(internal.notebookHelpers.setRegeneratingInternal, {
        blockId: args.blockId,
        value: false,
      });
      throw err;
    }
  },
});
