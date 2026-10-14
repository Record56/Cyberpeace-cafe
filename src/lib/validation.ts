import { format } from "date-fns";
import type { PassCategory } from "./types";
import { PASS_CATEGORIES } from "./constants";

export function isValidCategory(value: string): value is PassCategory {
  return PASS_CATEGORIES.includes(value as PassCategory);
}

export function todayISO() {
  return format(new Date(), "yyyy-MM-dd");
}

export function isDateAllowed(today: string, validFrom: string, validTo: string) {
  return today >= validFrom && today <= validTo;
}

export function parseTicketPayload(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed) as { ticketId?: string };
    if (parsed.ticketId) return parsed.ticketId;
  } catch {
    // plain ticket id fallback
  }

  if (/^[A-Z0-9-]+$/i.test(trimmed)) return trimmed.toUpperCase();
  return null;
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
