import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Attendee } from "@/models/Attendee";
import { CheckInLog } from "@/models/CheckInLog";
import {
  isDateAllowed,
  jsonError,
  parseTicketPayload,
  todayISO,
} from "@/lib/validation";
import type { PassCategory } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["admin", "staff"]);
    await connectDB();

    const body = await req.json();
    const ticketId = parseTicketPayload(String(body.qr || body.ticketId || ""));

    if (!ticketId) {
      await CheckInLog.create({
        ticketId: "UNKNOWN",
        result: "invalid",
        message: "Invalid QR / ticket payload",
        staffId: session.id,
        staffName: session.name,
      });
      return Response.json({
        ok: false,
        result: "invalid",
        message: "Invalid QR code",
      });
    }

    const attendee = await Attendee.findOne({ ticketId });
    if (!attendee) {
      await CheckInLog.create({
        ticketId,
        result: "invalid",
        message: "Ticket not found",
        staffId: session.id,
        staffName: session.name,
      });
      return Response.json({
        ok: false,
        result: "invalid",
        message: "Ticket not found",
      });
    }

    const allowed =
      session.role === "admin" ||
      !session.allowedCategories?.length ||
      session.allowedCategories.includes(attendee.category as PassCategory);

    if (!allowed) {
      await CheckInLog.create({
        attendeeId: attendee._id,
        ticketId,
        attendeeName: attendee.name,
        category: attendee.category,
        result: "unauthorized",
        message: `Staff not authorized for ${attendee.category}`,
        staffId: session.id,
        staffName: session.name,
      });
      return Response.json({
        ok: false,
        result: "unauthorized",
        message: `Not authorized for ${attendee.category}`,
        attendee: summarize(attendee),
      });
    }

    const today = todayISO();
    if (!isDateAllowed(today, attendee.validFrom, attendee.validTo)) {
      await CheckInLog.create({
        attendeeId: attendee._id,
        ticketId,
        attendeeName: attendee.name,
        category: attendee.category,
        result: "wrong_date",
        message: `Pass valid ${attendee.validFrom} to ${attendee.validTo}`,
        staffId: session.id,
        staffName: session.name,
      });
      return Response.json({
        ok: false,
        result: "wrong_date",
        message: `Wrong date. Valid: ${attendee.validFrom} → ${attendee.validTo}`,
        attendee: summarize(attendee),
      });
    }

    if (attendee.status === "checked_in") {
      await CheckInLog.create({
        attendeeId: attendee._id,
        ticketId,
        attendeeName: attendee.name,
        category: attendee.category,
        result: "duplicate",
        message: `Already checked in at ${attendee.checkedInAt?.toISOString()}`,
        staffId: session.id,
        staffName: session.name,
      });
      return Response.json({
        ok: false,
        result: "duplicate",
        message: "Duplicate scan — already checked in",
        attendee: summarize(attendee),
      });
    }

    attendee.status = "checked_in";
    attendee.checkedInAt = new Date();
    attendee.checkedInBy = new mongoose.Types.ObjectId(session.id);
    attendee.checkedInByName = session.name;
    await attendee.save();

    await CheckInLog.create({
      attendeeId: attendee._id,
      ticketId,
      attendeeName: attendee.name,
      category: attendee.category,
      result: "success",
      message: "Entry granted",
      staffId: new mongoose.Types.ObjectId(session.id),
      staffName: session.name,
    });

    return Response.json({
      ok: true,
      result: "success",
      message: "Entry granted",
      attendee: summarize(attendee),
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "FAILED";
    if (message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    if (message === "FORBIDDEN") return jsonError("Forbidden", 403);
    return jsonError("Check-in failed", 500);
  }
}

function summarize(attendee: {
  name: string;
  email: string;
  ticketId: string;
  category: string;
  eventDate: string;
  validFrom: string;
  validTo: string;
  venue: string;
  status: string;
  checkedInAt?: Date;
  checkedInByName?: string;
}) {
  return {
    name: attendee.name,
    email: attendee.email,
    ticketId: attendee.ticketId,
    category: attendee.category,
    eventDate: attendee.eventDate,
    validFrom: attendee.validFrom,
    validTo: attendee.validTo,
    venue: attendee.venue,
    status: attendee.status,
    checkedInAt: attendee.checkedInAt,
    checkedInByName: attendee.checkedInByName,
  };
}
