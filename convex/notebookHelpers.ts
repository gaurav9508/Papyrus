import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const getBlockInternal = internalQuery({
  args: { blockId: v.id("notebookBlocks") },
  handler: async (ctx, args) => ctx.db.get(args.blockId),
});

export const getSessionInternal = internalQuery({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => ctx.db.get(args.sessionId),
});

export const listBlocksInternal = internalQuery({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const blocks = await ctx.db
      .query("notebookBlocks")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    return blocks.sort((a, b) => a.order - b.order);
  },
});

export const patchBlockInternal = internalMutation({
  args: {
    blockId: v.id("notebookBlocks"),
    content: v.string(),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.blockId, {
      content: args.content,
      title: args.title,
      regenerating: false,
    });
  },
});

export const setRegeneratingInternal = internalMutation({
  args: { blockId: v.id("notebookBlocks"), value: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.blockId, { regenerating: args.value });
  },
});
