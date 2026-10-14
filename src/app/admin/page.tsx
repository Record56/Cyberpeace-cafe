"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatCard } from "@/components/StatCard";
import { api } from "@/lib/api-client";

interface Stats {
  total: number;
  checkedIn: number;
  remaining: number;
  byCategory: Array<{
    category: string;
    total: number;
    checkedIn: number;
    remaining: number;
  }>;
  emailStats: Record<string, number>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [seedMsg, setSeedMsg] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await api<Stats>("/api/stats");
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function seed() {
    setSeedMsg("");
    try {
      const data = await api<{ message: string; accounts: { admin: string; staff: string } }>(
        "/api/seed",
        { method: "POST" }
      );
      setSeedMsg(
        `${data.message}. Admin: ${data.accounts.admin} | Staff: ${data.accounts.staff}`
      );
      await load();
    } catch (err) {
      setSeedMsg(err instanceof Error ? err.message : "Seed failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
          <p className="mt-1 text-[var(--muted)]">
            Registered, checked-in, and remaining attendees at a glance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-ghost" onClick={seed}>
            Seed Admin/Staff
          </button>
          <Link href="/admin/attendees" className="btn btn-primary">
            Manage Attendees
          </Link>
        </div>
      </div>

      {seedMsg ? (
        <p className="panel px-4 py-3 text-sm text-[var(--accent)]">{seedMsg}</p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}. Set `MONGODB_URI` in `.env.local` and click Seed.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Registered" value={stats?.total ?? "—"} tone="accent" />
        <StatCard label="Checked In" value={stats?.checkedIn ?? "—"} tone="ok" />
        <StatCard label="Remaining" value={stats?.remaining ?? "—"} tone="warn" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="text-lg font-semibold">Category-wise attendance</h2>
          <div className="mt-4 space-y-3">
            {(stats?.byCategory || []).length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No attendees yet.</p>
            ) : (
              stats?.byCategory.map((row) => (
                <div
                  key={row.category}
                  className="flex items-center justify-between rounded-xl border border-[var(--line)] px-3 py-3"
                >
                  <div>
                    <p className="font-medium">{row.category}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {row.checkedIn}/{row.total} checked in
                    </p>
                  </div>
                  <p className="text-sm text-[var(--warn)]">{row.remaining} left</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="text-lg font-semibold">Email delivery</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {["sent", "failed", "pending", "not_sent"].map((key) => (
              <div
                key={key}
                className="rounded-xl border border-[var(--line)] px-3 py-4"
              >
                <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
                  {key.replace("_", " ")}
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {stats?.emailStats?.[key] ?? 0}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/admin/categories" className="btn btn-ghost">
              Ticket categories
            </Link>
            <Link href="/admin/reports" className="btn btn-ghost">
              Entry reports
            </Link>
            <Link href="/scanner" className="btn btn-ghost">
              Open scanner
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
