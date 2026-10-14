import mongoose, { Schema, models, model } from "mongoose";
import type { CheckInStatus, EmailStatus, PassCategory } from "@/lib/types";

export interface IAttendee {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  ticketId: string;
  category: PassCategory;
  eventDate: string;
  validFrom: string;
  validTo: string;
  venue: string;
  eventName: string;
  qrPayload: string;
  emailStatus: EmailStatus;
  emailError?: string;
  emailSentAt?: Date;
  status: CheckInStatus;
  checkedInAt?: Date;
  checkedInBy?: mongoose.Types.ObjectId;
  checkedInByName?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendeeSchema = new Schema<IAttendee>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    ticketId: { type: String, required: true, unique: true, index: true },
    category: {
      type: String,
      enum: ["VIP Pass", "Media Pass", "Organiser Pass", "Finalist Pass", "Audience Pass"],
      required: true,
      index: true,
    },
    eventDate: { type: String, required: true },
    validFrom: { type: String, required: true },
    validTo: { type: String, required: true },
    venue: { type: String, required: true },
    eventName: { type: String, required: true },
    qrPayload: { type: String, required: true },
    emailStatus: {
      type: String,
      enum: ["pending", "sent", "failed", "not_sent"],
      default: "pending",
      index: true,
    },
    emailError: String,
    emailSentAt: Date,
    status: {
      type: String,
      enum: ["registered", "checked_in"],
      default: "registered",
      index: true,
    },
    checkedInAt: Date,
    checkedInBy: { type: Schema.Types.ObjectId, ref: "User" },
    checkedInByName: String,
    notes: String,
  },
  { timestamps: true }
);

AttendeeSchema.index({ email: 1, category: 1, eventDate: 1 });

export const Attendee = models.Attendee || model<IAttendee>("Attendee", AttendeeSchema);
