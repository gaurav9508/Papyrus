import { ConvexHttpClient } from "convex/browser";
import { auth } from "@clerk/nextjs/server";

/**
 * Returns a Convex client authenticated as the current request's Clerk user.
 * Use this in API routes (route.ts) that need to call Convex mutations/queries
 * on the user's behalf — never expose this client-side.
 *
 * Requires a Clerk JWT template named "convex" (see README setup steps).
 */
export async function getAuthenticatedConvexClient(): Promise<ConvexHttpClient> {
  const { getToken } = await auth();
  const token = await getToken({ template: "convex" });
  if (!token) {
    throw new Error("Not authenticated.");
  }

  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL as string);
  client.setAuth(token);
  return client;
}
