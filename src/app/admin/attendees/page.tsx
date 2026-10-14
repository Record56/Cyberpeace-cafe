"use client";

import { FormEvent, useEffect, useState } from "react";
import { Pagination } from "@/components/Pagination";
import { StatusBadge } from "@/components/StatusBadge";
import { PASS_CATEGORIES } from "@/lib/constants";
import { api } from "@/lib/api-client";

const PAGE_SIZE = 25;

interface Attendee {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  ticketId: string;
  category: string;
  eventDate: string;
  validFrom: string;
  validTo: string;
  venue: string;
  emailStatus: string;
  emailError?: string;
  status: string;
  checkedInAt?: string;
}

export default function AttendeesPage() {
  const [items, setItems] = useState<Attendee[]>([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    category: "Audience Pass",
    eventDate: new Date().toISOString().slice(0, 10),
    validFrom: new Date().toISOString().slice(0, 10),
    validTo: new Date().toISOString().slice(0, 10),
    venue: "",
    sendEmail: true,
  });

  async function load(
    nextStatus = status,
    nextPage = page,
    resetPage = false
  ) {
    const pageToLoad = resetPage ? 1 : nextPage;
    const params = new URLSearchParams();
    params.set("page", String(pageToLoad));
    params.set("limit", String(PAGE_SIZE));
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (nextStatus) params.set("status", nextStatus);
    const data = await api<{ items: Attendee[]; total: number; page: number }>(
      `/api/attendees?${params}`
    );
    setItems(data.items);
    setTotal(data.total);
    setPage(data.page);
  }

  useEffect(() => {
    load().catch((err) => setMessage(err.message));
  }, []);

  async function createAttendee(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const data = await api<{ attendee: Attendee }>("/api/attendees", {
        method: "POST",
        body: JSON.stringify(form),
      });
      const emailStatus = data.attendee.emailStatus;
      if (emailStatus === "sent") {
        setMessage("Attendee created. QR pass emailed successfully.");
      } else if (emailStatus === "failed") {
        setMessage(
          `Attendee created, but email failed: ${data.attendee.emailError || "check SMTP settings"}`
        );
      } else {
        setMessage("Attendee created. QR pass generated (email not sent).");
      }
      setForm((f) => ({ ...f, name: "", email: "", phone: "" }));
      await load(status, 1, true);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Create failed");
    } finally {
      setLoading(false);
    }
  }

  async function bulkUpload(file: File | null) {
    if (!file) return;
    setLoading(true);
    setMessage("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("sendEmail", "true");
      const res = await fetch("/api/attendees/bulk", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bulk upload failed");
      setMessage(
        `Bulk upload done: ${data.createdCount} created, ${data.errorCount} errors.`
      );
      await load(status, 1, true);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Bulk upload failed");
    } finally {
      setLoading(false);
    }
  }

  async function resend(id: string) {
    try {
      await api(`/api/attendees/${id}/resend`, { method: "POST" });
      setMessage("Email resent.");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Resend failed");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this attendee?")) return;
    await api(`/api/attendees/${id}`, { method: "DELETE" });
    const nextTotal = Math.max(0, total - 1);
    const lastPage = Math.max(1, Math.ceil(nextTotal / PAGE_SIZE));
    await load(status, Math.min(page, lastPage));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Attendees</h1>
        <p className="mt-1 text-[var(--muted)]">
          Create one-by-one or bulk upload CSV/Excel. Generate & resend QR passes.
        </p>
      </div>

      {message ? (
        <p className="panel px-4 py-3 text-sm text-[var(--accent)]">{message}</p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={createAttendee} className="panel space-y-3 p-5">
          <h2 className="text-lg font-semibold">Create attendee</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="field sm:col-span-2">
              <label>Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Ticket category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {PASS_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Event date</label>
              <input
                type="date"
                required
                value={form.eventDate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    eventDate: e.target.value,
                    validFrom: e.target.value,
                    validTo: e.target.value,
                  })
                }
              />
            </div>
            <div className="field">
              <label>Valid from</label>
              <input
                type="date"
                value={form.validFrom}
                onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Valid to</label>
              <input
                type="date"
                value={form.validTo}
                onChange={(e) => setForm({ ...form, validTo: e.target.value })}
              />
            </div>
            <div className="field sm:col-span-2">
              <label>Venue (optional)</label>
              <input
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                placeholder="Uses event default if empty"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <input
              type="checkbox"
              checked={form.sendEmail}
              onChange={(e) => setForm({ ...form, sendEmail: e.target.checked })}
            />
            Send QR pass email now
          </label>
          <button className="btn btn-primary" disabled={loading}>
            {loading ? "Saving..." : "Create + Generate QR"}
          </button>

          <div className="border-t border-[var(--line)] pt-4">
            <h3 className="font-medium">Bulk upload CSV / Excel</h3>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Columns: name, email, phone, category, eventDate, validFrom, validTo, venue
            </p>
            <input
              className="mt-3 block w-full text-sm"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => bulkUpload(e.target.files?.[0] || null)}
            />
          </div>
        </form>

        <section className="panel p-5">
          <div className="mb-3 flex flex-wrap gap-2">
            {(
              [
                { value: "", label: "All list" },
                { value: "checked_in", label: "Verified" },
                { value: "registered", label: "Not verified" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value || "all"}
                type="button"
                className={`btn !px-3 !py-2 text-sm ${
                  status === opt.value ? "btn-primary" : "btn-ghost"
                }`}
                onClick={() => {
                  setStatus(opt.value);
                  load(opt.value, 1, true).catch((err) => setMessage(err.message));
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <input
              className="min-w-[180px] flex-1 rounded-xl border border-[var(--line)] bg-[rgba(7,17,31,0.65)] px-3 py-2"
              placeholder="Search name, email, ticket"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
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
                load(status, 1, true).catch((err) => setMessage(err.message))
              }
            >
              Filter
            </button>
          </div>

          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Attendee</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Email</th>
                  <th>Entry</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a._id}>
                    <td>
                      <div className="font-medium">{a.name}</div>
                      <div className="text-xs text-[var(--muted)]">{a.ticketId}</div>
                      <div className="text-xs text-[var(--muted)]">{a.email}</div>
                    </td>
                    <td>{a.category}</td>
                    <td>
                      <div>{a.eventDate}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {a.validFrom === a.validTo
                          ? "Single day"
                          : `${a.validFrom} → ${a.validTo}`}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={a.emailStatus} />
                    </td>
                    <td>
                      <StatusBadge status={a.status} />
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <button className="btn btn-ghost !px-2 !py-1 text-xs" onClick={() => resend(a._id)}>
                          Resend
                        </button>
                        <button className="btn btn-danger !px-2 !py-1 text-xs" onClick={() => remove(a._id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!items.length ? (
                  <tr>
                    <td colSpan={6} className="text-[var(--muted)]">
                      No attendees found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            limit={PAGE_SIZE}
            total={total}
            onPageChange={(next) => {
              load(status, next).catch((err) => setMessage(err.message));
            }}
          />
        </section>
      </div>
    </div>
  );
}
