import { NextRequest } from "next/server";
import { hashPassword, requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { isValidCategory, jsonError } from "@/lib/validation";
import { PASS_CATEGORIES } from "@/lib/constants";
import type { PassCategory } from "@/lib/types";
import { User } from "@/models/User";

function publicUser(user: {
  _id: unknown;
  name: string;
  email: string;
  role: string;
  allowedCategories?: PassCategory[];
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    _id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    allowedCategories: user.allowedCategories ?? [],
    active: user.active,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function parseAllowedCategories(raw: unknown): PassCategory[] | null {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) return null;
  const categories: PassCategory[] = [];
  for (const item of raw) {
    const value = String(item);
    if (!isValidCategory(value)) return null;
    if (!categories.includes(value)) categories.push(value);
  }
  return categories;
}

export async function GET(req: NextRequest) {
  try {
    await requireSession(["admin"]);
    await connectDB();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const role = searchParams.get("role");
    const active = searchParams.get("active");
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Number(searchParams.get("limit") || 25));

    const filter: Record<string, unknown> = {};
    if (role === "admin" || role === "staff") filter.role = role;
    if (active === "true") filter.active = true;
    if (active === "false") filter.active = false;
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      User.find(filter)
        .select("-passwordHash")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return Response.json({
      items: items.map(publicUser),
      total,
      page,
      limit,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "FAILED";
    if (message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    if (message === "FORBIDDEN") return jsonError("Forbidden", 403);
    return jsonError("Failed to fetch staff", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSession(["admin"]);
    await connectDB();

    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "")
      .toLowerCase()
      .trim();
    const password = String(body.password || "");
    const role = body.role === "admin" ? "admin" : "staff";
    const allowedCategories = parseAllowedCategories(body.allowedCategories);

    if (!name || !email || !password) {
      return jsonError("name, email and password are required");
    }
    if (password.length < 8) {
      return jsonError("Password must be at least 8 characters");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonError("Invalid email");
    }
    if (allowedCategories === null) {
      return jsonError(`allowedCategories must be from: ${PASS_CATEGORIES.join(", ")}`);
    }

    const existing = await User.findOne({ email }).lean();
    if (existing) return jsonError("A user with this email already exists", 409);

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role,
      allowedCategories:
        role === "admin" ? [...PASS_CATEGORIES] : allowedCategories,
      active: body.active !== false,
    });

    return Response.json({ user: publicUser(user) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "FAILED";
    if (message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    if (message === "FORBIDDEN") return jsonError("Forbidden", 403);
    if (message.includes("duplicate key") || message.includes("E11000")) {
      return jsonError("A user with this email already exists", 409);
    }
    return jsonError("Failed to create staff", 500);
  }
}
