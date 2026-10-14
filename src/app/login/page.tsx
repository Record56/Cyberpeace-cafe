"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@cyberpeace.org");
  const [password, setPassword] = useState("Admin@12345");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push(data.user.role === "admin" ? "/admin" : "/scanner");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10">
      <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rise space-y-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--accent)]">
            CyberPeace Cafe
          </p>
          <h1 className="max-w-xl text-4xl font-semibold leading-tight md:text-5xl">
            Event pass control for registrations, QR entry, and gate reports.
          </h1>
          <p className="max-w-lg text-[var(--muted)]">
            Admin creates attendees, emails unique QR passes, and staff verifies
            entry with category + date validation.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              "Bulk CSV upload",
              "QR email passes",
              "Live gate scanner",
            ].map((item) => (
              <div key={item} className="panel px-4 py-3 text-sm text-[var(--muted)]">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="panel rise p-6 md:p-8">
          <h2 className="text-2xl font-semibold">Staff / Admin Login</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Use seeded admin or staff credentials after running seed.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error ? (
              <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            ) : null}
            <button className="btn btn-primary w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
