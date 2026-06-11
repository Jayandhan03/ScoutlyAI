import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITelegramLink extends Document {
  token: string;
  chatId: string;
  username?: string;
  firstName?: string;
  linkedAt: Date;
}

const TelegramLinkSchema = new Schema<ITelegramLink>({
  token: { type: String, required: true, unique: true, index: true },
  chatId: { type: String, required: true },
  username: { type: String },
  firstName: { type: String },
  linkedAt: { type: Date, default: Date.now },
});

const TelegramLink: Model<ITelegramLink> =
  (mongoose.models.TelegramLink as Model<ITelegramLink>) ||
  mongoose.model<ITelegramLink>("TelegramLink", TelegramLinkSchema);

export default TelegramLink;
