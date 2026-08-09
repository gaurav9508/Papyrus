import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { BookOpen, Search, Upload, LayoutDashboard } from "lucide-react";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/search", label: "Search Papers", icon: Search },
  { href: "/upload", label: "Upload Paper", icon: Upload },
];

export function Navbar() {
  return (
    <nav className="flex items-center justify-between border-b border-[#1e2732] bg-[#0b0f14] px-6 py-3">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 font-semibold text-[#e6e4dc]"
      >
        <BookOpen size={20} />
        Papyrus
      </Link>

      <div className="flex items-center gap-1">
        {NAV_LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-[#8892a0] transition-colors hover:bg-[#12181f] hover:text-[#e6e4dc]"
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </div>

      <UserButton />
    </nav>
  );
}
