import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Attendee } from "@/models/Attendee";
import { jsonError } from "@/lib/validation";

export async function GET() {
  try {
    await requireSession(["admin", "staff"]);
    await connectDB();

    const [total, checkedIn, byCategory, emailStats] = await Promise.all([
      Attendee.countDocuments(),
      Attendee.countDocuments({ status: "checked_in" }),
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
      Attendee.aggregate([
        {
          $group: {
            _id: "$emailStatus",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    return Response.json({
      total,
      checkedIn,
      remaining: total - checkedIn,
      byCategory: byCategory.map((row) => ({
        category: row._id,
        total: row.total,
        checkedIn: row.checkedIn,
        remaining: row.total - row.checkedIn,
      })),
      emailStats: Object.fromEntries(emailStats.map((e) => [e._id, e.count])),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "FAILED";
    if (message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    if (message === "FORBIDDEN") return jsonError("Forbidden", 403);
    return jsonError("Failed to load stats", 500);
  }
}
