import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Attendee } from "@/models/Attendee";
import { isValidCategory, jsonError } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireSession(["admin", "staff"]);
    await connectDB();
    const { id } = await params;
    const attendee = await Attendee.findById(id).lean();
    if (!attendee) return jsonError("Attendee not found", 404);
    return Response.json({ attendee });
  } catch (error) {
    const message = error instanceof Error ? error.message : "FAILED";
    if (message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    return jsonError("Failed to fetch attendee", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireSession(["admin"]);
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const updates: Record<string, unknown> = {};
    if (body.name) updates.name = String(body.name).trim();
    if (body.email) updates.email = String(body.email).toLowerCase().trim();
    if (body.phone !== undefined) updates.phone = String(body.phone || "").trim();
    if (body.category) {
      if (!isValidCategory(body.category)) return jsonError("Invalid category");
      updates.category = body.category;
    }
    if (body.eventDate) updates.eventDate = String(body.eventDate);
    if (body.validFrom) updates.validFrom = String(body.validFrom);
    if (body.validTo) updates.validTo = String(body.validTo);
    if (body.venue) updates.venue = String(body.venue);
    if (body.notes !== undefined) updates.notes = String(body.notes || "");

    const attendee = await Attendee.findByIdAndUpdate(id, updates, { new: true });
    if (!attendee) return jsonError("Attendee not found", 404);
    return Response.json({ attendee });
  } catch (error) {
    const message = error instanceof Error ? error.message : "FAILED";
    if (message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    if (message === "FORBIDDEN") return jsonError("Forbidden", 403);
    return jsonError("Failed to update attendee", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireSession(["admin"]);
    await connectDB();
    const { id } = await params;
    const deleted = await Attendee.findByIdAndDelete(id);
    if (!deleted) return jsonError("Attendee not found", 404);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "FAILED";
    if (message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    if (message === "FORBIDDEN") return jsonError("Forbidden", 403);
    return jsonError("Failed to delete attendee", 500);
  }
}
