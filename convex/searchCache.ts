import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const TTL_MS = 60 * 60 * 1000; // 1 hour

export const getByQuery = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("searchCache")
      .withIndex("by_query", (q) => q.eq("query", args.query))
      .first();

    if (!row) return null;
    if (Date.now() - row.createdAt > TTL_MS) return null;

    return row.resultsJson;
  },
});

export const store = mutation({
  args: { query: v.string(), resultsJson: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("searchCache")
      .withIndex("by_query", (q) => q.eq("query", args.query))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        resultsJson: args.resultsJson,
        createdAt: Date.now(),
      });
    } else {
      await ctx.db.insert("searchCache", {
        query: args.query,
        resultsJson: args.resultsJson,
        createdAt: Date.now(),
      });
    }
  },
});
