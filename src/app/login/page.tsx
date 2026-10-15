"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <main className="login-arena">
      <div className="login-arena__grid" aria-hidden />
      <div className="login-arena__glow login-arena__glow--cyan" aria-hidden />
      <div className="login-arena__glow login-arena__glow--gold" aria-hidden />
      <div className="login-arena__scan" aria-hidden />

      <div className="login-arena__shell">
        <section className="login-arena__brand rise">
          <div className="login-arena__logo-wrap">
            <Image
              src="/cyberpeace-cafe-logo.jpg"
              alt="CyberPeace Café"
              width={180}
              height={180}
              priority
              className="login-arena__logo"
            />
          </div>
          <p className="login-arena__eyebrow">Arena Access</p>
          <h1 className="login-arena__title">CyberPeace Café</h1>
          <p className="login-arena__tagline">
            Tournament gate control — QR entry passes, live scan, and match-day
            reports.
          </p>
        </section>

        <section className="login-arena__panel rise">
          <div className="login-arena__panel-head">
            <p className="login-arena__panel-kicker">Player Auth</p>
            <h2 className="login-arena__panel-title">Staff / Admin Login</h2>
            <p className="login-arena__panel-copy">
              Enter credentials to unlock the control deck.
            </p>
          </div>

          <form onSubmit={onSubmit} className="login-arena__form">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@cyberpeace.org"
                autoComplete="email"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-11"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[var(--muted)] transition hover:text-[var(--text)]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            {error ? (
              <p className="login-arena__error" role="alert">
                {error}
              </p>
            ) : null}
            <button className="login-arena__cta" disabled={loading}>
              {loading ? "Syncing..." : "Enter Arena"}
            </button>
          </form>

          <p className="login-arena__status">
            <span className="login-arena__status-dot" />
            Systems online · Access granted on auth
          </p>
        </section>
      </div>
    </main>
  );
}
