import { connectDB } from "@/lib/mongodb";
import { hashPassword } from "@/lib/auth";
import { User } from "@/models/User";
import { EventSettings } from "@/models/EventSettings";
import { PASS_CATEGORIES } from "@/lib/constants";
import { format, addDays } from "date-fns";

export async function POST() {
  try {
    await connectDB();

    const adminEmail = (process.env.ADMIN_EMAIL || "admin@cyberpeace.org").toLowerCase();
    const staffEmail = (process.env.STAFF_EMAIL || "staff@cyberpeace.org").toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";
    const staffPassword = process.env.STAFF_PASSWORD || "Staff@12345";

    const adminHash = await hashPassword(adminPassword);
    const staffHash = await hashPassword(staffPassword);

    await User.findOneAndUpdate(
      { email: adminEmail },
      {
        name: "Event Admin",
        email: adminEmail,
        passwordHash: adminHash,
        role: "admin",
        allowedCategories: [...PASS_CATEGORIES],
        active: true,
      },
      { upsert: true, returnDocument: "after" }
    );

    await User.findOneAndUpdate(
      { email: staffEmail },
      {
        name: "Gate Staff",
        email: staffEmail,
        passwordHash: staffHash,
        role: "staff",
        allowedCategories: [...PASS_CATEGORIES],
        active: true,
      },
      { upsert: true, returnDocument: "after" }
    );

    const today = new Date();
    const d1 = format(today, "yyyy-MM-dd");
    const d2 = format(addDays(today, 1), "yyyy-MM-dd");
    const d3 = format(addDays(today, 2), "yyyy-MM-dd");

    const existing = await EventSettings.findOne();
    if (!existing) {
      await EventSettings.create({
        eventName: process.env.EVENT_NAME || "CyberPeace Cafe",
        venue: process.env.EVENT_VENUE || "Main Convention Hall",
        eventDates: [d1, d2, d3],
        categoryRules: PASS_CATEGORIES.map((category) => ({
          category,
          validFrom: d1,
          validTo: category === "Organiser Pass" || category === "VIP Pass" ? d3 : d1,
          multiDay: category === "Organiser Pass" || category === "VIP Pass",
          active: true,
        })),
      });
    }

    return Response.json({
      ok: true,
      message: "Seed complete",
      accounts: {
        admin: adminEmail,
        staff: staffEmail,
      },
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Seed failed" }, { status: 500 });
  }
}
