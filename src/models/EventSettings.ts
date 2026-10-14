import mongoose, { Schema, models, model } from "mongoose";
import type { PassCategory } from "@/lib/types";

export interface IEventSettings {
  _id: mongoose.Types.ObjectId;
  eventName: string;
  venue: string;
  eventDates: string[];
  categoryRules: Array<{
    category: PassCategory;
    validFrom: string;
    validTo: string;
    multiDay: boolean;
    active: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const EventSettingsSchema = new Schema<IEventSettings>(
  {
    eventName: { type: String, required: true },
    venue: { type: String, required: true },
    eventDates: { type: [String], default: [] },
    categoryRules: [
      {
        category: String,
        validFrom: String,
        validTo: String,
        multiDay: { type: Boolean, default: false },
        active: { type: Boolean, default: true },
      },
    ],
  },
  { timestamps: true }
);

export const EventSettings =
  models.EventSettings || model<IEventSettings>("EventSettings", EventSettingsSchema);
