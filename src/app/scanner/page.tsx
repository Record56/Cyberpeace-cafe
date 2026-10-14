"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { StatusBadge } from "@/components/StatusBadge";
import { PASS_CATEGORIES } from "@/lib/constants";
import { api } from "@/lib/api-client";

interface ScanResult {
  ok: boolean;
  result: string;
  message: string;
  attendee?: {
    name: string;
    email?: string;
    ticketId: string;
    category: string;
    eventDate: string;
    validFrom: string;
    validTo: string;
    venue: string;
    status: string;
    checkedInAt?: string;
    checkedInByName?: string;
  };
}

interface AttendeeRow {
  _id: string;
  name: string;
  email: string;
  ticketId: string;
  category: string;
  eventDate: string;
  validFrom: string;
  validTo: string;
  venue: string;
  status: string;
  checkedInAt?: string;
  checkedInByName?: string;
}

type Tab = "scan" | "all" | "verified";

const resultTone: Record<string, string> = {
  success: "border-emerald-400/40 bg-emerald-400/10 text-emerald-100",
  duplicate: "border-amber-400/40 bg-amber-400/10 text-amber-100",
  wrong_date: "border-orange-400/40 bg-orange-400/10 text-orange-100",
  unauthorized: "border-rose-400/40 bg-rose-400/10 text-rose-100",
  invalid: "border-rose-400/40 bg-rose-400/10 text-rose-100",
};

const resultTitle: Record<string, string> = {
  success: "Entry verified",
  duplicate: "Already scanned",
  wrong_date: "Wrong date",
  unauthorized: "Not authorized",
  invalid: "Scan failed",
};

export default function ScannerPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [manualId, setManualId] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");
  const [tab, setTab] = useState<Tab>("scan");
  const [items, setItems] = useState<AttendeeRow[]>([]);
  const [listTotal, setListTotal] = useState(0);
  const [listLoading, setListLoading] = useState(false);
  const [listQ, setListQ] = useState("");
  const [listCategory, setListCategory] = useState("");
  const [listError, setListError] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const busyRef = useRef(false);
  const modalOpenRef = useRef(false);

  useEffect(() => {
    api<{ user: { name: string; role: string } }>("/api/auth/me")
      .then((data) => {
        setUserName(data.user.name);
        setReady(true);
      })
      .catch(() => router.push("/login"));

    return () => {
      scannerRef.current?.stop().catch(() => undefined);
      scannerRef.current = null;
    };
  }, [router]);

  const loadList = useCallback(
    async (which: "all" | "verified") => {
      setListLoading(true);
      setListError("");
      try {
        const params = new URLSearchParams();
        params.set("limit", "100");
        if (listQ.trim()) params.set("q", listQ.trim());
        if (listCategory) params.set("category", listCategory);
        if (which === "verified") params.set("status", "checked_in");
        const data = await api<{ items: AttendeeRow[]; total: number }>(
          `/api/attendees?${params}`
        );
        setItems(data.items);
        setListTotal(data.total);
      } catch (err) {
        setListError(err instanceof Error ? err.message : "Failed to load list");
      } finally {
        setListLoading(false);
      }
    },
    [listQ, listCategory]
  );

  useEffect(() => {
    if (tab === "all" || tab === "verified") {
      loadList(tab).catch(() => undefined);
    }
  }, [tab, loadList]);

  function openResultModal(data: ScanResult) {
    setResult(data);
    setModalOpen(true);
    modalOpenRef.current = true;
  }

  function closeModal() {
    setModalOpen(false);
    modalOpenRef.current = false;
    // Keep busy briefly so the same QR is not re-fired immediately
    setTimeout(() => {
      busyRef.current = false;
    }, 1200);
  }

  async function goToTab(next: Tab) {
    if (next !== "scan" && (scanning || scannerRef.current)) {
      try {
        await scannerRef.current?.stop();
      } catch {
        // ignore
      }
      scannerRef.current = null;
      setScanning(false);
    }
    setTab(next);
  }

  async function verifyTicket(qr: string) {
    if (busyRef.current || modalOpenRef.current) return;
    busyRef.current = true;
    setError("");
    try {
      const data = await api<ScanResult>("/api/checkin", {
        method: "POST",
        body: JSON.stringify({ qr }),
      });
      openResultModal(data);
      if (data.ok && (tab === "all" || tab === "verified")) {
        loadList(tab).catch(() => undefined);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
      busyRef.current = false;
    }
  }

  async function startCamera() {
    setError("");
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-reader");
      }
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 250, height: 250 } },
        async (decoded) => {
          await verifyTicket(decoded);
        },
        () => undefined
      );
      setScanning(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Camera permission denied or unavailable"
      );
    }
  }

  async function stopCamera() {
    try {
      await scannerRef.current?.stop();
    } catch {
      // ignore
    }
    setScanning(false);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function handleScanNext() {
    closeModal();
    setResult(null);
    setManualId("");
    goToTab("scan");
  }

  function handleViewVerified() {
    closeModal();
    goToTab("verified");
  }

  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center text-[var(--muted)]">
        Checking staff session...
      </main>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "scan", label: "Scan" },
    { id: "all", label: "All list" },
    { id: "verified", label: "Verified" },
  ];

  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 py-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
            Mobile Staff Scanner
          </p>
          <h1 className="text-2xl font-semibold">QR Entry Gate</h1>
          <p className="text-sm text-[var(--muted)]">{userName}</p>
        </div>
        <button className="btn btn-ghost !px-3 !py-2 text-sm" onClick={logout}>
          Logout
        </button>
      </div>

      <nav className="mb-4 grid grid-cols-3 gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`btn !px-2 !py-2 text-sm ${
              tab === t.id ? "btn-primary" : "btn-ghost"
            }`}
            onClick={() => goToTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "scan" ? (
        <>
          <section className="panel overflow-hidden p-3">
            <div id="qr-reader" className="overflow-hidden rounded-xl" />
            <div className="mt-3 flex gap-2">
              {!scanning ? (
                <button className="btn btn-primary flex-1" onClick={startCamera}>
                  Start camera
                </button>
              ) : (
                <button className="btn btn-ghost flex-1" onClick={stopCamera}>
                  Stop camera
                </button>
              )}
            </div>
          </section>

          <section className="panel mt-4 space-y-3 p-4">
            <h2 className="font-medium">Manual ticket ID</h2>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl border border-[var(--line)] bg-[rgba(7,17,31,0.65)] px-3 py-2"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder="CPC-XXXX-XXXX"
              />
              <button
                className="btn btn-primary"
                onClick={() => verifyTicket(manualId)}
                disabled={!manualId.trim()}
              >
                Verify
              </button>
            </div>
          </section>

          {error ? (
            <p className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          {!modalOpen ? (
            <p className="mt-4 text-sm text-[var(--muted)]">
              Scan a QR pass. Result opens in a popup with full attendee details.
              Use All list / Verified tabs to review entries.
            </p>
          ) : null}
        </>
      ) : (
        <section className="panel space-y-4 p-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">
                {tab === "verified" ? "Verified attendees" : "All attendees"}
              </h2>
              <p className="text-sm text-[var(--muted)]">
                {listLoading ? "Loading…" : `${listTotal} total`}
              </p>
            </div>
            <button
              className="btn btn-ghost !px-3 !py-2 text-sm"
              onClick={() => loadList(tab)}
              disabled={listLoading}
            >
              Refresh
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              className="min-w-[140px] flex-1 rounded-xl border border-[var(--line)] bg-[rgba(7,17,31,0.65)] px-3 py-2 text-sm"
              placeholder="Search name, email, ticket"
              value={listQ}
              onChange={(e) => setListQ(e.target.value)}
            />
            <select
              className="rounded-xl border border-[var(--line)] bg-[rgba(7,17,31,0.65)] px-3 py-2 text-sm"
              value={listCategory}
              onChange={(e) => setListCategory(e.target.value)}
            >
              <option value="">All categories</option>
              {PASS_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              className="btn btn-ghost !px-3 !py-2 text-sm"
              onClick={() => loadList(tab)}
            >
              Filter
            </button>
          </div>

          {listError ? (
            <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
              {listError}
            </p>
          ) : null}

          <ul className="divide-y divide-[var(--line)]">
            {items.map((a) => (
              <li key={a._id} className="space-y-1 py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{a.name}</p>
                    <p className="text-xs text-[var(--muted)]">{a.ticketId}</p>
                    <p className="text-xs text-[var(--muted)]">{a.email}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                <p className="text-sm text-[var(--muted)]">
                  {a.category} · {a.eventDate}
                </p>
                {a.checkedInAt ? (
                  <p className="text-xs text-[var(--ok)]">
                    Checked in {new Date(a.checkedInAt).toLocaleString()}
                    {a.checkedInByName ? ` by ${a.checkedInByName}` : ""}
                  </p>
                ) : (
                  <p className="text-xs text-[var(--muted)]">Not scanned yet</p>
                )}
              </li>
            ))}
            {!listLoading && !items.length ? (
              <li className="py-6 text-center text-sm text-[var(--muted)]">
                {tab === "verified"
                  ? "No verified attendees yet."
                  : "No attendees found."}
              </li>
            ) : null}
          </ul>
        </section>
      )}

      {modalOpen && result ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="scan-result-title"
          onClick={handleScanNext}
        >
          <div
            className={`panel rise w-full max-w-md space-y-4 border p-5 ${
              resultTone[result.result] || resultTone.invalid
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide opacity-80">
                  {result.result.replace("_", " ")}
                </p>
                <h2 id="scan-result-title" className="text-xl font-semibold">
                  {resultTitle[result.result] || "Scan result"}
                </h2>
              </div>
              <button
                type="button"
                className="btn btn-ghost !px-2 !py-1 text-sm"
                onClick={handleScanNext}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <p className="text-sm opacity-95">{result.message}</p>

            {result.attendee ? (
              <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-base font-semibold">{result.attendee.name}</p>
                  <StatusBadge status={result.attendee.status} />
                </div>
                {result.attendee.email ? (
                  <p className="opacity-90">{result.attendee.email}</p>
                ) : null}
                <p>
                  <span className="opacity-70">Ticket:</span>{" "}
                  {result.attendee.ticketId}
                </p>
                <p>
                  <span className="opacity-70">Category:</span>{" "}
                  {result.attendee.category}
                </p>
                <p>
                  <span className="opacity-70">Event date:</span>{" "}
                  {result.attendee.eventDate}
                </p>
                <p>
                  <span className="opacity-70">Valid:</span>{" "}
                  {result.attendee.validFrom}
                  {result.attendee.validFrom !== result.attendee.validTo
                    ? ` → ${result.attendee.validTo}`
                    : ""}
                </p>
                <p>
                  <span className="opacity-70">Venue:</span> {result.attendee.venue}
                </p>
                <p>
                  <span className="opacity-70">Scan status:</span>{" "}
                  {result.ok
                    ? "Verified just now"
                    : result.result === "duplicate"
                      ? "Already verified earlier"
                      : "Not verified"}
                </p>
                {result.attendee.checkedInAt ? (
                  <p>
                    <span className="opacity-70">Checked in:</span>{" "}
                    {new Date(result.attendee.checkedInAt).toLocaleString()}
                    {result.attendee.checkedInByName
                      ? ` by ${result.attendee.checkedInByName}`
                      : ""}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm opacity-90">
                No matching attendee for this scan.
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <button className="btn btn-primary flex-1" onClick={handleScanNext}>
                Scan next
              </button>
              <button className="btn btn-ghost flex-1" onClick={handleViewVerified}>
                View verified list
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
