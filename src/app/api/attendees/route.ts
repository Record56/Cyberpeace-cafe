import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Attendee } from "@/models/Attendee";
import { EventSettings } from "@/models/EventSettings";
import { generateTicketId } from "@/lib/ticket-id";
import { buildTicketPayload } from "@/lib/qr";
import { sendTicketEmail } from "@/lib/email";
import { isValidCategory, jsonError } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    await requireSession(["admin", "staff"]);
    await connectDB();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Number(searchParams.get("limit") || 25));

    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { ticketId: { $regex: q, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      Attendee.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Attendee.countDocuments(filter),
    ]);

    return Response.json({ items, total, page, limit });
  } catch (error) {
    const message = error instanceof Error ? error.message : "FAILED";
    if (message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    return jsonError("Failed to fetch attendees", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSession(["admin"]);
    await connectDB();

    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").toLowerCase().trim();
    const phone = body.phone ? String(body.phone).trim() : undefined;
    const category = String(body.category || "");
    const eventDate = String(body.eventDate || "");
    const validFrom = String(body.validFrom || eventDate);
    const validTo = String(body.validTo || eventDate);
    const sendEmail = body.sendEmail !== false;

    if (!name || !email || !isValidCategory(category) || !eventDate) {
      return jsonError("name, email, category and eventDate are required");
    }

    const settings = await EventSettings.findOne().lean();
    const eventName = settings?.eventName || process.env.EVENT_NAME || "CyberPeace Cafe";
    const venue = String(body.venue || settings?.venue || process.env.EVENT_VENUE || "Main Venue");

    const ticketId = generateTicketId();
    const qrPayload = buildTicketPayload(ticketId);

    const attendee = await Attendee.create({
      name,
      email,
      phone,
      ticketId,
      category,
      eventDate,
      validFrom,
      validTo,
      venue,
      eventName,
      qrPayload,
      emailStatus: sendEmail ? "pending" : "not_sent",
      status: "registered",
      notes: body.notes ? String(body.notes) : undefined,
    });

    if (sendEmail) {
      try {
        await sendTicketEmail({
          name,
          email,
          ticketId,
          category,
          eventDate,
          validFrom,
          validTo,
          venue,
          eventName,
        });
        attendee.emailStatus = "sent";
        attendee.emailSentAt = new Date();
        await attendee.save();
      } catch (emailError) {
        attendee.emailStatus = "failed";
        attendee.emailError =
          emailError instanceof Error ? emailError.message : "Email failed";
        await attendee.save();
      }
    }

    return Response.json({ attendee }, { status: 201 });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "FAILED";
    if (message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    if (message === "FORBIDDEN") return jsonError("Forbidden", 403);
    return jsonError("Failed to create attendee", 500);
  }
}
