import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Attendee } from "@/models/Attendee";
import { CheckInLog } from "@/models/CheckInLog";
import { jsonError } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    await requireSession(["admin", "staff"]);
    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const onlyCheckedIn = searchParams.get("checkedIn") !== "false";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Number(searchParams.get("limit") || 25));

    const filter: Record<string, unknown> = {};
    if (onlyCheckedIn) filter.status = "checked_in";
    if (category) filter.category = category;

    const [entries, total, categorySummary, recentLogs] = await Promise.all([
      Attendee.find(filter)
        .sort({ checkedInAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select(
          "name email ticketId category status checkedInAt checkedInByName eventDate venue"
        )
        .lean(),
      Attendee.countDocuments(filter),
      Attendee.aggregate([
        {
          $group: {
            _id: "$category",
            total: { $sum: 1 },
            checkedIn: {
              $sum: { $cond: [{ $eq: ["$status", "checked_in"] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      CheckInLog.find()
        .sort({ scannedAt: -1 })
        .limit(50)
        .lean(),
    ]);

    return Response.json({
      entries,
      total,
      page,
      limit,
      categorySummary: categorySummary.map((row) => ({
        category: row._id,
        total: row.total,
        checkedIn: row.checkedIn,
        remaining: row.total - row.checkedIn,
      })),
      recentLogs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "FAILED";
    if (message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    return jsonError("Failed to load reports", 500);
  }
}
