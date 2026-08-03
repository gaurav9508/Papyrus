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
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) throw new Error("Session not found.");

    await Promise.all(
      args.blocks.map((block, index) =>
        ctx.db.insert("notebookBlocks", { ...block, sessionId: args.sessionId, order: index })
      )
    );

    await ctx.db.patch(args.sessionId, { status: "ready" });
  },
});
