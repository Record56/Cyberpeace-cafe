"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { api } from "@/lib/api-client";

interface ScanResult {
  ok: boolean;
  result: string;
  message: string;
  attendee?: {
    name: string;
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

const resultTone: Record<string, string> = {
  success: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  duplicate: "border-amber-400/40 bg-amber-400/10 text-amber-100",
  wrong_date: "border-orange-400/40 bg-orange-400/10 text-orange-100",
  unauthorized: "border-rose-400/40 bg-rose-400/10 text-rose-100",
  invalid: "border-rose-400/40 bg-rose-400/10 text-rose-100",
};

export default function ScannerPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [manualId, setManualId] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const busyRef = useRef(false);

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

  async function verifyTicket(qr: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const data = await api<ScanResult>("/api/checkin", {
        method: "POST",
        body: JSON.stringify({ qr }),
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setTimeout(() => {
        busyRef.current = false;
      }, 1200);
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

  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center text-[var(--muted)]">
        Checking staff session...
      </main>
    );
  }

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

      {result ? (
        <section
          className={`panel mt-4 space-y-2 border p-4 ${
            resultTone[result.result] || resultTone.invalid
          }`}
        >
          <p className="text-xs uppercase tracking-wide opacity-80">{result.result}</p>
          <h2 className="text-xl font-semibold">{result.message}</h2>
          {result.attendee ? (
            <div className="space-y-1 text-sm opacity-95">
              <p>
                <strong>{result.attendee.name}</strong> · {result.attendee.category}
              </p>
              <p>Ticket: {result.attendee.ticketId}</p>
              <p>
                Valid: {result.attendee.validFrom}
                {result.attendee.validFrom !== result.attendee.validTo
                  ? ` → ${result.attendee.validTo}`
                  : ""}
              </p>
              <p>Venue: {result.attendee.venue}</p>
              {result.attendee.checkedInAt ? (
                <p>
                  Checked in: {new Date(result.attendee.checkedInAt).toLocaleString()}
                  {result.attendee.checkedInByName
                    ? ` by ${result.attendee.checkedInByName}`
                    : ""}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : (
        <p className="mt-4 text-sm text-[var(--muted)]">
          Scan a QR pass. Duplicate scans, wrong dates, and unauthorized categories are
          blocked automatically.
        </p>
      )}
    </main>
  );
}
