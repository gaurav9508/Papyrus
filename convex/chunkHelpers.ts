import { v } from "convex/values";
import { internalQuery } from "./_generated/server";

export const paperChunkValidator = v.object({
  _id: v.id("paperChunks"),
  _creationTime: v.number(),
  sessionId: v.id("sessions"),
  fileId: v.optional(v.id("paperFiles")),
  chunkIndex: v.number(),
  text: v.string(),
  embedding: v.array(v.float64()),
});

export const getByIds = internalQuery({
  args: { ids: v.array(v.id("paperChunks")) },
  returns: v.array(paperChunkValidator),
  handler: async (ctx, args) => {
    const docs = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
    return docs.filter((d): d is NonNullable<typeof d> => d !== null);
  },
});

export const getSessionForOwnerCheck = internalQuery({
  args: { sessionId: v.id("sessions") },
  returns: v.union(
    v.object({
      _id: v.id("sessions"),
      _creationTime: v.number(),
      userId: v.string(),
      title: v.string(),
      status: v.union(
        v.literal("pending"),
        v.literal("generating"),
        v.literal("ready"),
        v.literal("failed"),
      ),
      errorMessage: v.optional(v.string()),
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
    }),
    v.null(),
  ),
  handler: async (ctx, args) => ctx.db.get(args.sessionId),
});

export const getSessionExportData = internalQuery({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    const blocks = await ctx.db
      .query("notebookBlocks")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    return { session, blocks, messages };
  },
});
