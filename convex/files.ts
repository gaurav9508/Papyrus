import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib/auth";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUserId(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const savePaperFile = mutation({
  args: {
    sessionId: v.id("sessions"),
    storageId: v.id("_storage"),
    filename: v.string(),
    contentType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) throw new Error("Not found");
    return await ctx.db.insert("paperFiles", {
      sessionId: args.sessionId,
      storageId: args.storageId,
      filename: args.filename,
      contentType: args.contentType,
    });
  },
});

export const getFileUrl = query({
  args: { fileId: v.id("paperFiles") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const file = await ctx.db.get(args.fileId);
    if (!file) return null;
    const session = await ctx.db.get(file.sessionId);
    if (!session || session.userId !== userId) return null;
    return await ctx.storage.getUrl(file.storageId);
  },
});
