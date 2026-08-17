import { ConvexHttpClient } from "convex/browser";

/**
 * Plain Convex client for the internal retry route (no Clerk user session).
 * Calls only secret-gated public functions (`*System` mutations/queries) —
 * no admin auth needed since those functions check `INTERNAL_RETRY_SECRET` themselves.
 */
export function getAdminConvexClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL not set.");
  return new ConvexHttpClient(url);
}
