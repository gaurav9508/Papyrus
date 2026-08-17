import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUserId } from "./lib/auth";

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
