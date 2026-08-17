import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const checkStuckSessions = internalAction({
  args: {},
  handler: async (ctx) => {
    const stuck = await ctx.runQuery(
      internal.sessionHelpers.listStuckGenerating,
      {},
    );

    for (const session of stuck) {
      const outcome = await ctx.runMutation(
        internal.sessionHelpers.bumpRetryOrFail,
        {
          sessionId: session._id,
        },
      );

      if (outcome !== "retry") continue;

      try {
        const appUrl = process.env.APP_URL;
        const secret = process.env.INTERNAL_RETRY_SECRET;
        if (!appUrl || !secret) {
          console.error(
            "Missing APP_URL or INTERNAL_RETRY_SECRET in Convex env.",
          );
          continue;
        }
        await fetch(`${appUrl}/api/internal/notebooks/retry`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${secret}`,
          },
          body: JSON.stringify({ sessionId: session._id }),
        });
      } catch (err) {
        console.error("Retry dispatch failed for session", session._id, err);
      }
    }
  },
});
