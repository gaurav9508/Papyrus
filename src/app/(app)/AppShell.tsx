"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { useSyncUser } from "@/hooks/useSyncUser";

export function AppShell({ children }: { children: React.ReactNode }) {
  useSyncUser();
  const pathname = usePathname();
  const isDark = pathname?.startsWith("/sessions");

  return (
    <div
      className={
        isDark ? "min-h-screen bg-[#0b0f14]" : "min-h-screen bg-(--color-cream)"
      }
    >
      <Navbar />
      {children}
    </div>
  );
}
