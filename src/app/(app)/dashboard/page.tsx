"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { SessionListItem } from "@/components/notebook/SessionListItem";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search, Upload } from "lucide-react";

export default function DashboardPage() {
  const { isAuthenticated } = useConvexAuth();
  const sessions = useQuery(
    api.sessions.listMine,
    isAuthenticated ? {} : "skip",
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-[#e6e4dc]">Your Notebooks</h1>
        <div className="flex gap-2">
          <Link href="/search">
            <Button variant="secondary" size="sm">
              <Search size={16} />
              Search Papers
            </Button>
          </Link>
          <Link href="/upload">
            <Button size="sm">
              <Upload size={16} />
              Upload Paper
            </Button>
          </Link>
        </div>
      </div>

      {sessions === undefined && (
        <p className="mt-6 text-[#6a7583]">Loading…</p>
      )}

      {sessions?.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-[#2a3541] bg-[#12181f]/40 p-10 text-center text-[#6a7583]">
          No notebooks yet. Search for a paper or upload one to get started.
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {sessions?.map((s) => (
          <SessionListItem
            key={s._id}
            id={s._id}
            title={s.title}
            paperTitle={s.paperTitle}
            status={s.status}
            updatedAt={s._creationTime}
          />
        ))}
      </div>
    </div>
  );
}
