export function StatusBadge({
  status,
}: {
  status: string;
}) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    checked_in: {
      bg: "rgba(57,255,20,0.12)",
      color: "#86efac",
      border: "rgba(57,255,20,0.4)",
    },
    registered: {
      bg: "rgba(34,211,238,0.12)",
      color: "#67e8f9",
      border: "rgba(34,211,238,0.4)",
    },
    sent: {
      bg: "rgba(57,255,20,0.12)",
      color: "#86efac",
      border: "rgba(57,255,20,0.4)",
    },
    failed: {
      bg: "rgba(248,113,113,0.12)",
      color: "#fca5a5",
      border: "rgba(248,113,113,0.35)",
    },
    pending: {
      bg: "rgba(251,191,36,0.12)",
      color: "#fcd34d",
      border: "rgba(251,191,36,0.35)",
    },
    not_sent: {
      bg: "rgba(148,163,184,0.12)",
      color: "#cbd5e1",
      border: "rgba(148,163,184,0.35)",
    },
  };

  const style = map[status] || map.registered;

  return (
    <span
      className="badge"
      style={{ background: style.bg, color: style.color, borderColor: style.border }}
    >
      {status.replace("_", " ")}
    </span>
  );
}
