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

  // const debug = useQuery(api.sessions.debugAuth);
  // console.log("auth debug:", debug);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-stone-900">
          Your Notebooks
        </h1>
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

      {sessions === undefined && <p className="text-stone-500">Loading…</p>}

      {sessions?.length === 0 && (
        <div className="rounded-xl border border-dashed border-stone-300 p-10 text-center text-stone-500">
          No notebooks yet. Search for a paper or upload one to get started.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
