"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * Ensures the signed-in Clerk user has a matching row in Convex.
 * Call once near the root of any authenticated layout/page.
 */
export function useSyncUser() {
  const { user, isSignedIn } = useUser();
  const { isAuthenticated } = useConvexAuth();
  const syncUser = useMutation(api.users.syncUser);

  useEffect(() => {
    if (isAuthenticated && isSignedIn && user) {
      const email = user.primaryEmailAddress?.emailAddress ?? "";
      syncUser({ email, name: user.fullName ?? undefined });
    }
  }, [isAuthenticated, isSignedIn, user, syncUser]);
}
