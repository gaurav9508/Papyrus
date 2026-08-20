import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUserId, verifySystemSecret } from "./lib/auth";

/** List the current user's sessions, most recent first — powers the dashboard sidebar. */
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    return await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) return null;
    return session;
  },
});

export const toggleSharing = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId)
      throw new Error("Session not found.");

    if (session.isPublic) {
      await ctx.db.patch(args.sessionId, { isPublic: false });
      return null;
    }

    const slug =
      session.shareSlug ?? crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    await ctx.db.patch(args.sessionId, { isPublic: true, shareSlug: slug });
    return slug;
  },
});

export const getByShareSlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_shareSlug", (q) => q.eq("shareSlug", args.slug))
      .unique();
    if (!session || !session.isPublic) return null;
    return session;
  },
});

/** Create a new pending session for a chosen paper (from search or upload). */
export const create = mutation({
  args: {
    title: v.string(),
    paperSourceId: v.string(),
    paperSource: v.union(
      v.literal("arxiv"),
      v.literal("semanticScholar"),
      v.literal("upload"),
    ),
    paperTitle: v.string(),
    paperAuthors: v.array(v.string()),
    paperAbstract: v.string(),
    paperExternalUrl: v.optional(v.string()),
    paperPdfUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return await ctx.db.insert("sessions", {
      ...args,
      userId,
      status: "pending",
    });
  },
});

export const setStatus = mutation({
  args: {
    sessionId: v.id("sessions"),
    status: v.union(
      v.literal("pending"),
      v.literal("generating"),
      v.literal("ready"),
      v.literal("failed"),
    ),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId)
      throw new Error("Session not found.");
    await ctx.db.patch(args.sessionId, {
      status: args.status,
      errorMessage: args.errorMessage,
      generationStartedAt:
        args.status === "generating" ? Date.now() : session.generationStartedAt,
    });
  },
});

export const remove = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId)
      throw new Error("Session not found.");

    const blocks = await ctx.db
      .query("notebookBlocks")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    await Promise.all(blocks.map((b) => ctx.db.delete(b._id)));
    await ctx.db.delete(args.sessionId);
  },
});

export const setStatusSystem = mutation({
  args: {
    sessionId: v.id("sessions"),
    status: v.union(
      v.literal("pending"),
      v.literal("generating"),
      v.literal("ready"),
      v.literal("failed"),
    ),
    errorMessage: v.optional(v.string()),
    secret: v.string(),
  },
  handler: async (ctx, args) => {
    if (!verifySystemSecret(args.secret)) {
      throw new Error("Unauthorized.");
    }
    await ctx.db.patch(args.sessionId, {
      status: args.status,
      errorMessage: args.errorMessage,
      generationStartedAt:
        args.status === "generating" ? Date.now() : undefined,
    });
  },
});
