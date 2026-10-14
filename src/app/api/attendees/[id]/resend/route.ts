import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Attendee } from "@/models/Attendee";
import { sendTicketEmail } from "@/lib/email";
import { jsonError } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    await requireSession(["admin"]);
    await connectDB();
    const { id } = await params;

    const attendee = await Attendee.findById(id);
    if (!attendee) return jsonError("Attendee not found", 404);

    try {
      await sendTicketEmail({
        name: attendee.name,
        email: attendee.email,
        ticketId: attendee.ticketId,
        category: attendee.category,
        eventDate: attendee.eventDate,
        validFrom: attendee.validFrom,
        validTo: attendee.validTo,
        venue: attendee.venue,
        eventName: attendee.eventName,
      });
      attendee.emailStatus = "sent";
      attendee.emailSentAt = new Date();
      attendee.emailError = undefined;
      await attendee.save();
      return Response.json({ ok: true, emailStatus: "sent" });
    } catch (emailError) {
      attendee.emailStatus = "failed";
      attendee.emailError =
        emailError instanceof Error ? emailError.message : "Email failed";
      await attendee.save();
      return jsonError(attendee.emailError || "Email failed", 502);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "FAILED";
    if (message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    if (message === "FORBIDDEN") return jsonError("Forbidden", 403);
    return jsonError("Failed to resend email", 500);
  }
}
