"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/attendees", label: "Attendees" },
  { href: "/admin/staff", label: "Staff" },
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
    <header className="sticky top-0 z-20 border-b border-[rgba(34,211,238,0.28)] bg-[rgba(5,5,10,0.88)] backdrop-blur-md shadow-[0_0_24px_rgba(34,211,238,0.08)]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/admin" className="flex items-center gap-3">
          <Image
            src="/cyberpeace-cafe-logo.jpg"
            alt="CyberPeace Café"
            width={40}
            height={40}
            className="h-10 w-10 rounded-xl object-cover ring-2 ring-[rgba(34,211,238,0.55)] shadow-[0_0_16px_rgba(34,211,238,0.35)]"
            priority
          />
          <div>
            <p
              className="text-sm font-bold uppercase tracking-[0.12em]"
              style={{ fontFamily: "var(--font-display), Trebuchet MS, sans-serif" }}
            >
              CyberPeace Cafe
            </p>
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--gold)]">
              Arena Control
            </p>
          </div>
        </Link>

        <nav className="flex flex-wrap gap-1">
          {links.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/admin" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] transition ${
                  active
                    ? "bg-[rgba(34,211,238,0.14)] text-[var(--accent)] shadow-[0_0_12px_rgba(34,211,238,0.2)]"
                    : "text-[var(--muted)] hover:bg-[rgba(34,211,238,0.06)] hover:text-white"
                }`}
                style={{ fontFamily: "var(--font-display), Trebuchet MS, sans-serif" }}
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
