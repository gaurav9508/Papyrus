import { v } from "convex/values";
import { internalQuery, internalMutation, query } from "./_generated/server";
import { verifySystemSecret } from "./lib/auth";

const STUCK_THRESHOLD_MS = 5 * 60 * 1000; // 5 min
const MAX_RETRIES = 3;

export const listStuckGenerating = internalQuery({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - STUCK_THRESHOLD_MS;
    const stuck = await ctx.db
      .query("sessions")
      .withIndex("by_status", (q) => q.eq("status", "generating"))
      .collect();
    return stuck.filter((s) => (s.generationStartedAt ?? 0) < cutoff);
  },
});

/**
 * Public, secret-gated version of the session+file lookup used by the retry route.
 * Required because Next.js API routes cannot call `internal.*` Convex functions.
 */
export const getForRetrySystem = query({
  args: { sessionId: v.id("sessions"), secret: v.string() },
  handler: async (ctx, args) => {
    if (!verifySystemSecret(args.secret)) {
      throw new Error("Unauthorized.");
    }
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;
    const file = await ctx.db
      .query("paperFiles")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
    const fileUrl = file ? await ctx.storage.getUrl(file.storageId) : null;
    return { session, fileUrl, fileId: file?._id ?? null };
  },
});

/** Returns "retry" or "failed" so the caller action knows whether to fire the retry HTTP call. */
export const bumpRetryOrFail = internalMutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return "skip" as const;
    const nextRetryCount = (session.retryCount ?? 0) + 1;

    if (nextRetryCount > MAX_RETRIES) {
      await ctx.db.patch(args.sessionId, {
        status: "failed",
        errorMessage: `Generation stalled and retry limit (${MAX_RETRIES}) exceeded.`,
        retryCount: nextRetryCount,
      });
      return "failed" as const;
    }

    await ctx.db.patch(args.sessionId, {
      status: "pending",
      retryCount: nextRetryCount,
    });
    return "retry" as const;
  },
});
