import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { EventSettings } from "@/models/EventSettings";
import { PASS_CATEGORIES } from "@/lib/constants";
import { isValidCategory, jsonError } from "@/lib/validation";
import { format, addDays } from "date-fns";

async function getOrCreateSettings() {
  let settings = await EventSettings.findOne();
  if (!settings) {
    const d1 = format(new Date(), "yyyy-MM-dd");
    const d2 = format(addDays(new Date(), 2), "yyyy-MM-dd");
    settings = await EventSettings.create({
      eventName: process.env.EVENT_NAME || "CyberPeace Cafe",
      venue: process.env.EVENT_VENUE || "Main Convention Hall",
      eventDates: [d1, d2],
      categoryRules: PASS_CATEGORIES.map((category) => ({
        category,
        validFrom: d1,
        validTo: d1,
        multiDay: false,
        active: true,
      })),
    });
  }
  return settings;
}

export async function GET() {
  try {
    await requireSession(["admin", "staff"]);
    await connectDB();
    const settings = await getOrCreateSettings();
    return Response.json({ settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "FAILED";
    if (message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    return jsonError("Failed to load categories", 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireSession(["admin"]);
    await connectDB();
    const body = await req.json();
    const settings = await getOrCreateSettings();

    if (body.eventName) settings.eventName = String(body.eventName);
    if (body.venue) settings.venue = String(body.venue);
    if (Array.isArray(body.eventDates)) {
      settings.eventDates = body.eventDates.map((d: string) => String(d));
    }
    if (Array.isArray(body.categoryRules)) {
      settings.categoryRules = body.categoryRules
        .filter((rule: { category: string }) => isValidCategory(rule.category))
        .map(
          (rule: {
            category: string;
            validFrom: string;
            validTo: string;
            multiDay?: boolean;
            active?: boolean;
          }) => ({
            category: rule.category,
            validFrom: String(rule.validFrom),
            validTo: String(rule.validTo),
            multiDay: Boolean(rule.multiDay),
            active: rule.active !== false,
          })
        );
    }

    await settings.save();
    return Response.json({ settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "FAILED";
    if (message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    if (message === "FORBIDDEN") return jsonError("Forbidden", 403);
    return jsonError("Failed to update categories", 500);
  }
}
