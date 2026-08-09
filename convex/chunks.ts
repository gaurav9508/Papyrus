import { v } from "convex/values";
import { mutation, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireUserId } from "./lib/auth";
import { paperChunkValidator } from "./chunkHelpers";
import type { Doc } from "./_generated/dataModel";

export const insertMany = mutation({
  args: {
    sessionId: v.id("sessions"),
    chunks: v.array(
      v.object({
        chunkIndex: v.number(),
        text: v.string(),
        embedding: v.array(v.float64()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) throw new Error("Not found");
    for (const chunk of args.chunks) {
      await ctx.db.insert("paperChunks", {
        sessionId: args.sessionId,
        ...chunk,
      });
    }
  },
});

export const search = action({
  args: {
    sessionId: v.id("sessions"),
    embedding: v.array(v.float64()),
    topK: v.optional(v.number()),
  },
  returns: v.array(paperChunkValidator),
  handler: async (ctx, args): Promise<Doc<"paperChunks">[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated.");

    const session = await ctx.runQuery(
      internal.chunkHelpers.getSessionForOwnerCheck,
      {
        sessionId: args.sessionId,
      },
    );
    if (!session || session.userId !== identity.subject)
      throw new Error("Not found");

    const results = await ctx.vectorSearch("paperChunks", "by_embedding", {
      vector: args.embedding,
      limit: args.topK ?? 5,
      filter: (q) => q.eq("sessionId", args.sessionId),
    });

    return await ctx.runQuery(internal.chunkHelpers.getByIds, {
      ids: results.map((r) => r._id),
    });
  },
});
