import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Attendee } from "@/models/Attendee";
import { jsonError } from "@/lib/validation";

const HEADERS = [
  "Name",
  "Email",
  "Phone",
  "Ticket ID",
  "Category",
  "Event Date",
  "Valid From",
  "Valid To",
  "Venue",
  "Status",
  "Check-in Time",
  "Verified By",
  "Email Status",
] as const;

function escapeCsv(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(req: NextRequest) {
  try {
    await requireSession(["admin"]);
    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const onlyCheckedIn = searchParams.get("checkedIn") === "true";

    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    if (onlyCheckedIn) filter.status = "checked_in";

    const attendees = await Attendee.find(filter).sort({ checkedInAt: -1 }).lean();

    const lines = [
      HEADERS.join(","),
      ...attendees.map((a) =>
        [
          a.name,
          a.email,
          a.phone || "",
          a.ticketId,
          a.category,
          a.eventDate,
          a.validFrom,
          a.validTo,
          a.venue,
          a.status,
          a.checkedInAt ? new Date(a.checkedInAt).toISOString() : "",
          a.checkedInByName || "",
          a.emailStatus,
        ]
          .map((v) => escapeCsv(String(v ?? "")))
          .join(",")
      ),
    ];

    const csv = lines.join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="entry-report-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "FAILED";
    if (message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    if (message === "FORBIDDEN") return jsonError("Forbidden", 403);
    return jsonError("Export failed", 500);
  }
}
