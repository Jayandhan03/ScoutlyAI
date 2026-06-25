import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWaitlist extends Document {
    email: string;
    source: string;
    interests: string[];
    createdAt: Date;
    updatedAt: Date;
}

const WaitlistSchema: Schema<IWaitlist> = new Schema(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        source: { type: String, default: "landing" },
        interests: { type: [String], default: [] },
    },
    { timestamps: true }
);

const Waitlist: Model<IWaitlist> =
    (mongoose.models.Waitlist as Model<IWaitlist>) ||
    mongoose.model<IWaitlist>("Waitlist", WaitlistSchema);

export default Waitlist;
