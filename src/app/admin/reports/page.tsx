"use client";

import { useEffect, useState } from "react";
import { Pagination } from "@/components/Pagination";
import { StatusBadge } from "@/components/StatusBadge";
import { PASS_CATEGORIES } from "@/lib/constants";
import { api } from "@/lib/api-client";

const PAGE_SIZE = 25;

interface Entry {
  _id: string;
  name: string;
  email: string;
  ticketId: string;
  category: string;
  status: string;
  checkedInAt?: string;
  checkedInByName?: string;
  eventDate: string;
}

interface ReportData {
  entries: Entry[];
  total: number;
  page: number;
  limit: number;
  categorySummary: Array<{
    category: string;
    total: number;
    checkedIn: number;
    remaining: number;
  }>;
  recentLogs: Array<{
    _id: string;
    ticketId: string;
    attendeeName?: string;
    category?: string;
    result: string;
    message: string;
    staffName?: string;
    scannedAt: string;
  }>;
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");

  async function load(nextPage = page, resetPage = false) {
    const pageToLoad = resetPage ? 1 : nextPage;
    const params = new URLSearchParams();
    params.set("page", String(pageToLoad));
    params.set("limit", String(PAGE_SIZE));
    if (category) params.set("category", category);
    const report = await api<ReportData>(`/api/reports?${params}`);
    setData(report);
    setPage(report.page);
  }

  useEffect(() => {
    load(1, true).catch((err) => setMessage(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exportCsv() {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    params.set("checkedIn", "false");
    window.location.href = `/api/reports/export?${params}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Entry reports</h1>
          <p className="mt-1 text-[var(--muted)]">
            Name, category, check-in time, verifying staff, and CSV export.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="rounded-xl border border-[var(--line)] bg-[rgba(7,17,31,0.65)] px-3 py-2"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {PASS_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            className="btn btn-ghost"
            onClick={() =>
              load(1, true).catch((err) => setMessage(err.message))
            }
          >
            Refresh
          </button>
          <button className="btn btn-primary" onClick={exportCsv}>
            Export CSV
          </button>
        </div>
      </div>

      {message ? (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {message}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {(data?.categorySummary || []).map((row) => (
          <div key={row.category} className="panel p-4">
            <p className="text-xs text-[var(--muted)]">{row.category}</p>
            <p className="mt-2 text-xl font-semibold">
              {row.checkedIn}/{row.total}
            </p>
            <p className="text-xs text-[var(--warn)]">{row.remaining} remaining</p>
          </div>
        ))}
      </div>

      <section className="panel p-5">
        <h2 className="mb-4 text-lg font-semibold">Checked-in attendees</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Ticket category</th>
                <th>Check-in time</th>
                <th>Verified by</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.entries || []).map((entry) => (
                <tr key={entry._id}>
                  <td>
                    <div className="font-medium">{entry.name}</div>
                    <div className="text-xs text-[var(--muted)]">{entry.ticketId}</div>
                  </td>
                  <td>{entry.category}</td>
                  <td>
                    {entry.checkedInAt
                      ? new Date(entry.checkedInAt).toLocaleString()
                      : "—"}
                  </td>
                  <td>{entry.checkedInByName || "—"}</td>
                  <td>
                    <StatusBadge status={entry.status} />
                  </td>
                </tr>
              ))}
              {!data?.entries?.length ? (
                <tr>
                  <td colSpan={5} className="text-[var(--muted)]">
                    No check-ins yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          limit={PAGE_SIZE}
          total={data?.total || 0}
          onPageChange={(next) =>
            load(next).catch((err) => setMessage(err.message))
          }
        />
      </section>

      <section className="panel p-5">
        <h2 className="mb-4 text-lg font-semibold">Recent scan attempts</h2>
        <div className="space-y-2">
          {(data?.recentLogs || []).map((log) => (
            <div
              key={log._id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line)] px-3 py-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {log.attendeeName || log.ticketId}{" "}
                  <span className="text-[var(--muted)]">· {log.category || "n/a"}</span>
                </p>
                <p className="text-xs text-[var(--muted)]">{log.message}</p>
              </div>
              <div className="text-right">
                <StatusBadge status={log.result === "success" ? "sent" : "failed"} />
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {log.staffName || "—"} · {new Date(log.scannedAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
