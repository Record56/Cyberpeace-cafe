import { NextRequest } from "next/server";
import { hashPassword, requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { isValidCategory, jsonError } from "@/lib/validation";
import { PASS_CATEGORIES } from "@/lib/constants";
import type { PassCategory } from "@/lib/types";
import { User } from "@/models/User";

type Params = { params: Promise<{ id: string }> };

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

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireSession(["admin"]);
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const user = await User.findById(id);
    if (!user) return jsonError("User not found", 404);

    if (body.name !== undefined) {
      const name = String(body.name || "").trim();
      if (!name) return jsonError("Name is required");
      user.name = name;
    }

    if (body.email !== undefined) {
      const email = String(body.email || "")
        .toLowerCase()
        .trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return jsonError("Invalid email");
      }
      const clash = await User.findOne({ email, _id: { $ne: user._id } }).lean();
      if (clash) return jsonError("A user with this email already exists", 409);
      user.email = email;
    }

    if (body.role !== undefined) {
      if (body.role !== "admin" && body.role !== "staff") {
        return jsonError("Invalid role");
      }
      if (String(user._id) === session.id && body.role !== "admin") {
        return jsonError("You cannot demote your own admin account");
      }
      if (user.role === "admin" && body.role === "staff") {
        const adminCount = await User.countDocuments({
          role: "admin",
          active: true,
        });
        if (adminCount <= 1 && user.active) {
          return jsonError("Cannot demote the last active admin");
        }
      }
      user.role = body.role;
    }

    if (body.allowedCategories !== undefined) {
      const allowedCategories = parseAllowedCategories(body.allowedCategories);
      if (allowedCategories === null) {
        return jsonError(
          `allowedCategories must be from: ${PASS_CATEGORIES.join(", ")}`
        );
      }
      user.allowedCategories =
        user.role === "admin" ? [...PASS_CATEGORIES] : allowedCategories;
    }

    if (body.active !== undefined) {
      const nextActive = Boolean(body.active);
      if (String(user._id) === session.id && !nextActive) {
        return jsonError("You cannot deactivate your own account");
      }
      if (user.role === "admin" && user.active && !nextActive) {
        const adminCount = await User.countDocuments({
          role: "admin",
          active: true,
        });
        if (adminCount <= 1) {
          return jsonError("Cannot deactivate the last active admin");
        }
      }
      user.active = nextActive;
    }

    if (body.password !== undefined && body.password !== "") {
      const password = String(body.password);
      if (password.length < 8) {
        return jsonError("Password must be at least 8 characters");
      }
      user.passwordHash = await hashPassword(password);
    }

    await user.save();
    return Response.json({ user: publicUser(user) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "FAILED";
    if (message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    if (message === "FORBIDDEN") return jsonError("Forbidden", 403);
    if (message.includes("duplicate key") || message.includes("E11000")) {
      return jsonError("A user with this email already exists", 409);
    }
    return jsonError("Failed to update user", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireSession(["admin"]);
    await connectDB();
    const { id } = await params;

    if (id === session.id) {
      return jsonError("You cannot delete your own account");
    }

    const user = await User.findById(id);
    if (!user) return jsonError("User not found", 404);

    if (user.role === "admin") {
      const adminCount = await User.countDocuments({
        role: "admin",
        active: true,
      });
      if (adminCount <= 1 && user.active) {
        return jsonError("Cannot delete the last active admin");
      }
    }

    await User.findByIdAndDelete(id);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "FAILED";
    if (message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    if (message === "FORBIDDEN") return jsonError("Forbidden", 403);
    return jsonError("Failed to delete user", 500);
  }
}
