import mongoose, { Schema, models, model } from "mongoose";
import type { PassCategory } from "@/lib/types";

export interface ICheckInLog {
  _id: mongoose.Types.ObjectId;
  attendeeId: mongoose.Types.ObjectId;
  ticketId: string;
  attendeeName: string;
  category: PassCategory;
  result: "success" | "duplicate" | "wrong_date" | "unauthorized" | "invalid";
  message: string;
  staffId?: mongoose.Types.ObjectId;
  staffName?: string;
  scannedAt: Date;
}

const CheckInLogSchema = new Schema<ICheckInLog>({
  attendeeId: { type: Schema.Types.ObjectId, ref: "Attendee" },
  ticketId: { type: String, required: true, index: true },
  attendeeName: String,
  category: String,
  result: {
    type: String,
    enum: ["success", "duplicate", "wrong_date", "unauthorized", "invalid"],
    required: true,
  },
  message: { type: String, required: true },
  staffId: { type: Schema.Types.ObjectId, ref: "User" },
  staffName: String,
  scannedAt: { type: Date, default: Date.now, index: true },
});

export const CheckInLog = models.CheckInLog || model<ICheckInLog>("CheckInLog", CheckInLogSchema);
