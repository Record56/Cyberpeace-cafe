export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "ok" | "warn" | "accent";
}) {
  const toneColor =
    tone === "ok"
      ? "var(--ok)"
      : tone === "warn"
        ? "var(--warn)"
        : tone === "accent"
          ? "var(--accent)"
          : "var(--text)";

  return (
    <div className="panel rise p-5">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight" style={{ color: toneColor }}>
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}
