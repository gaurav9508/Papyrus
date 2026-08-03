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
    <nav className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-3">
      <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-stone-900">
        <BookOpen size={20} />
        Papyrus
      </Link>

      <div className="flex items-center gap-1">
        {NAV_LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100"
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </div>

      <UserButton afterSignOutUrl="/" />
    </nav>
  );
}
