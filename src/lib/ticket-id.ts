import { randomBytes } from "crypto";

export function generateTicketId(prefix = "CPC") {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${stamp}-${rand}`;
}
