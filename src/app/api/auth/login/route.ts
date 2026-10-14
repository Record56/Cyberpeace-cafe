import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import {
  createSessionToken,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { jsonError } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");

    if (!email || !password) {
      return jsonError("Email and password are required");
    }

    await connectDB();
    const user = await User.findOne({ email, active: true });
    if (!user) return jsonError("Invalid credentials", 401);

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return jsonError("Invalid credentials", 401);

    const sessionUser = {
      id: String(user._id),
      email: String(user.email),
      name: String(user.name),
      role: user.role,
      // Plain array — Mongoose DocumentArray cannot be put in JWT payload
      allowedCategories: (user.allowedCategories || []).map(String),
    };

    const token = await createSessionToken(sessionUser);
    await setSessionCookie(token);

    return Response.json({ user: sessionUser });
  } catch (error) {
    console.error(error);
    return jsonError("Login failed", 500);
  }
}
