import type { QueryCtx, MutationCtx } from "../_generated/server";
import { timingSafeEqual } from "crypto";

/**
 * Get the authenticated Clerk user id, or throw.
 * Every query/mutation that requires auth calls this instead of
 * re-implementing the ctx.auth.getUserIdentity() check inline.
 */
export async function requireUserId(
  ctx: QueryCtx | MutationCtx,
): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated.");
  }
  return identity.subject; // Clerk user id
}

export function verifySystemSecret(provided: string): boolean {
  const expected = process.env.INTERNAL_RETRY_SECRET ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
