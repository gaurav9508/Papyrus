"use client";

import { Navbar } from "@/components/layout/Navbar";
import { useSyncUser } from "@/hooks/useSyncUser";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  useSyncUser();

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
    </div>
  );
}
