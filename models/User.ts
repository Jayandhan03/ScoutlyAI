import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
    image?: string;
    googleId?: string;
    provider: string;
    createdAt: Date;
    lastLogin: Date;
}

const UserSchema: Schema<IUser> = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        image: { type: String },
        googleId: { type: String },
        provider: { type: String, default: "google" },
        lastLogin: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// Prevent model re-compilation during hot reload in development
const User: Model<IUser> =
    (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>("User", UserSchema);

export default User;
