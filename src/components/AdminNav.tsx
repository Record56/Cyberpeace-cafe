"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/attendees", label: "Attendees" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/scanner", label: "Scanner" },
];

export function AdminNav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[rgba(7,17,31,0.85)] backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] font-bold text-[#04201c]">
            CP
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide">CyberPeace Cafe</p>
            <p className="text-xs text-[var(--muted)]">Event Pass Control</p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-1">
          {links.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/admin" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-[rgba(45,212,191,0.15)] text-[var(--accent)]"
                    : "text-[var(--muted)] hover:bg-[rgba(255,255,255,0.04)] hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--muted)]">{userName}</span>
          <button className="btn btn-ghost !py-2 !px-3 text-sm" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
