import type { QueryCtx, MutationCtx } from "../_generated/server";

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

/**
 * Constant-time string comparison without Node's "crypto" module —
 * Convex's default (non-"use node") runtime can't import Node core modules.
 */
export function verifySystemSecret(provided: string): boolean {
  const expected = process.env.INTERNAL_RETRY_SECRET ?? "";
  if (provided.length !== expected.length) return false;

  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}
