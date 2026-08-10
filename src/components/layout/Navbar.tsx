"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import { BookOpen, Search } from "lucide-react";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/upload", label: "Upload Paper" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isDark = pathname?.startsWith("/sessions");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        router.push("/search");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);

  const theme = isDark
    ? {
        bar: "border-[#1e2732] bg-[#0b0f14]",
        logo: "text-[#e6e4dc]",
        ring: "border-[#3452e0] text-[#3452e0]",
        link: "text-[#8892a0] hover:text-[#e6e4dc]",
        linkActive: "text-[#e6e4dc]",
        search:
          "border-[#1e2732] bg-[#12181f] text-[#8892a0] hover:border-[#3452e0]",
        kbd: "border-[#1e2732] bg-[#0b0f14] text-[#8892a0]",
      }
    : {
        bar: "border-[color:var(--color-cream-dim)] bg-[color:var(--color-cream)]",
        logo: "text-[color:var(--color-ink)]",
        ring: "border-[color:var(--color-blue)] text-[color:var(--color-blue)]",
        link: "text-[color:var(--color-ink)]/60 hover:text-[color:var(--color-ink)]",
        linkActive: "text-[color:var(--color-ink)]",
        search:
          "border-[color:var(--color-cream-dim)] bg-white text-[color:var(--color-ink)]/50 hover:border-[color:var(--color-blue)]",
        kbd: "border-[color:var(--color-cream-dim)] bg-[color:var(--color-cream)] text-[color:var(--color-ink)]/50",
      };

  return (
    <nav
      className={`flex items-center justify-between border-b px-6 py-4 ${theme.bar}`}
    >
      <div className="flex items-center gap-8">
        <Link
          href="/dashboard"
          className={`flex items-center gap-2 font-medium ${theme.logo}`}
        >
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full border ${theme.ring}`}
          >
            <BookOpen size={14} />
          </span>
          <span className="lowercase tracking-tight">papyrus</span>
        </Link>

        <div className="hidden items-center gap-6 text-sm sm:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`transition-colors ${pathname === href ? theme.linkActive : theme.link}`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/search"
          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${theme.search}`}
        >
          <Search size={15} />
          <span className="hidden sm:inline">Search papers</span>
          <kbd
            className={`ml-2 hidden rounded border px-1.5 py-0.5 text-[10px] sm:inline ${theme.kbd}`}
          >
            ⌘K
          </kbd>
        </Link>
        <UserButton />
      </div>
    </nav>
  );
}
