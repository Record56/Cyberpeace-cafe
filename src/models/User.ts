import mongoose, { Schema, models, model } from "mongoose";
import type { PassCategory, UserRole } from "@/lib/types";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  allowedCategories: PassCategory[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "staff"], required: true },
    allowedCategories: {
      type: [String],
      default: [],
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User = models.User || model<IUser>("User", UserSchema);
