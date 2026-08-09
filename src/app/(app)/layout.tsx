"use client";

import { Navbar } from "@/components/layout/Navbar";
import { useSyncUser } from "@/hooks/useSyncUser";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  useSyncUser();

  return (
    <div className="min-h-screen bg-[#0b0f14]">
      <Navbar />
      {children}
    </div>
  );
}
