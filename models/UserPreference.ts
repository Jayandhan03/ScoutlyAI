import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Per-user news preferences + delivery schedule.
 *
 * Written by the Next.js app (from the preference chatbot + schedule UI) and
 * READ by the FastAPI backend scheduler, which also updates the bookkeeping
 * fields (lastSentAt / nextRunAt / lastResult) as it delivers briefings.
 * Collection name resolves to "userpreferences" — matched by the backend.
 */
export interface IUserPreference extends Document {
  email: string;
  // What the user wants to hear about
  topics: string[];
  keywords: string[];
  region: string;
  summary: string;
  articleLimit: number;
  // How often they want it
  scheduleEnabled: boolean;
  frequency: string; // human label, e.g. "every_6h", "daily"
  intervalMinutes: number; // canonical interval the scheduler uses
  // Bookkeeping (owned by the backend scheduler)
  lastSentAt?: Date | null;
  nextRunAt?: Date | null;
  lastResult?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

const UserPreferenceSchema = new Schema<IUserPreference>(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    topics: { type: [String], default: [] },
    keywords: { type: [String], default: [] },
    region: { type: String, default: "Global" },
    summary: { type: String, default: "" },
    articleLimit: { type: Number, default: 5 },
    scheduleEnabled: { type: Boolean, default: false },
    frequency: { type: String, default: "daily" },
    intervalMinutes: { type: Number, default: 1440 },
    lastSentAt: { type: Date, default: null },
    nextRunAt: { type: Date, default: null },
    lastResult: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

const UserPreference: Model<IUserPreference> =
  (mongoose.models.UserPreference as Model<IUserPreference>) ||
  mongoose.model<IUserPreference>("UserPreference", UserPreferenceSchema);

export default UserPreference;
