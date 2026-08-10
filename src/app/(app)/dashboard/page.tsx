"use client";

import { useMemo, useState } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { SessionListItem } from "@/components/notebook/SessionListItem";
import { ButtonLight } from "@/components/ui/button-light";
import Link from "next/link";
import {
  Upload,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
} from "lucide-react";

type Status = "pending" | "generating" | "ready" | "failed";
const STATUS_FILTERS: Array<Status | "all"> = [
  "all",
  "ready",
  "generating",
  "pending",
  "failed",
];

export default function DashboardPage() {
  const { isAuthenticated } = useConvexAuth();
  const sessions = useQuery(
    api.sessions.listMine,
    isAuthenticated ? {} : "skip",
  );

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    if (!sessions) return sessions;
    const q = query.trim().toLowerCase();
    return sessions.filter((s) => {
      const matchesQuery =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.paperTitle.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [sessions, query, statusFilter]);

  return (
    <div className="min-h-screen bg-[color:var(--color-cream)]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Hero */}
        <div className="flex items-end justify-between border-b border-[color:var(--color-cream-dim)] pb-10">
          <div>
            <p className="mb-3 font-mono text-xs tracking-widest text-[color:var(--color-blue)]">
              YOUR RESEARCH WORKSPACE
            </p>
            <h1 className="font-serif text-5xl text-[color:var(--color-ink)]">
              Your notebooks,
              <br />
              <span className="italic text-[color:var(--color-blue)]">
                ready to run.
              </span>
            </h1>
            <p className="mt-4 max-w-md text-[color:var(--color-ink)]/60">
              Every paper you've searched or uploaded, turned into a working
              notebook.
            </p>
          </div>
          <Link href="/upload">
            <ButtonLight variant="primary" size="md">
              <Upload size={16} />
              Upload new paper
            </ButtonLight>
          </Link>
        </div>

        {/* Search / filter row */}
        <div className="mt-8 flex items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-[color:var(--color-cream-dim)] bg-white px-3 py-2.5">
            <Search size={16} className="text-[color:var(--color-ink)]/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your notebooks..."
              className="w-full bg-transparent text-sm text-[color:var(--color-ink)] outline-none placeholder:text-[color:var(--color-ink)]/40"
            />
          </div>

          <div className="relative">
            <ButtonLight
              variant="secondary"
              size="md"
              onClick={() => setFilterOpen((o) => !o)}
            >
              <SlidersHorizontal size={15} />
              Filter
              {statusFilter !== "all" && (
                <span className="rounded-full bg-[color:var(--color-blue)] px-1.5 text-xs text-white">
                  1
                </span>
              )}
            </ButtonLight>
            {filterOpen && (
              <div className="absolute right-0 z-10 mt-2 w-40 rounded-lg border border-[color:var(--color-cream-dim)] bg-white p-1 shadow-lg">
                {STATUS_FILTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setStatusFilter(s);
                      setFilterOpen(false);
                    }}
                    className={`block w-full rounded-md px-3 py-1.5 text-left text-sm capitalize hover:bg-[color:var(--color-cream)] ${
                      statusFilter === s
                        ? "text-[color:var(--color-blue)]"
                        : "text-[color:var(--color-ink)]/70"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center rounded-lg border border-[color:var(--color-cream-dim)] bg-white p-1">
            <button
              onClick={() => setView("grid")}
              aria-label="Grid view"
              className={`rounded-md p-1.5 ${
                view === "grid"
                  ? "bg-[color:var(--color-ink)] text-[color:var(--color-cream)]"
                  : "text-[color:var(--color-ink)]/40"
              }`}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setView("list")}
              aria-label="List view"
              className={`rounded-md p-1.5 ${
                view === "list"
                  ? "bg-[color:var(--color-ink)] text-[color:var(--color-cream)]"
                  : "text-[color:var(--color-ink)]/40"
              }`}
            >
              <List size={15} />
            </button>
          </div>
        </div>

        {/* Count + heading */}
        <div className="mt-8 flex items-baseline justify-between">
          <div>
            <p className="font-mono text-xs tracking-widest text-[color:var(--color-ink)]/40">
              NOTEBOOKS · {filtered?.length ?? 0}{" "}
              {sessions ? `OF ${sessions.length}` : ""}
            </p>
            <h2 className="mt-1 font-serif text-2xl text-[color:var(--color-ink)]">
              Your library
            </h2>
          </div>
        </div>

        {sessions === undefined && (
          <p className="mt-6 text-[color:var(--color-ink)]/50">Loading…</p>
        )}

        {sessions?.length === 0 && (
          <div className="mt-6 rounded-xl border border-dashed border-[color:var(--color-cream-dim)] bg-white/50 p-10 text-center text-[color:var(--color-ink)]/50">
            No notebooks yet. Search for a paper or upload one to get started.
          </div>
        )}

        {sessions && sessions.length > 0 && filtered?.length === 0 && (
          <div className="mt-6 rounded-xl border border-dashed border-[color:var(--color-cream-dim)] bg-white/50 p-10 text-center text-[color:var(--color-ink)]/50">
            No notebooks match your search.
          </div>
        )}

        <div
          className={
            view === "grid"
              ? "mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
              : "mt-6 flex flex-col gap-3"
          }
        >
          {filtered?.map((s) => (
            <SessionListItem
              key={s._id}
              id={s._id}
              title={s.title}
              paperTitle={s.paperTitle}
              status={s.status}
              updatedAt={s._creationTime}
              view={view}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
