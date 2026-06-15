import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITelegramLink extends Document {
  email: string;
  chatId: string;
  telegramId?: string;
  username?: string;
  firstName?: string;
  linkedAt: Date;
}

const TelegramLinkSchema = new Schema<ITelegramLink>({
  email: { type: String, required: true, unique: true, index: true, lowercase: true },
  chatId: { type: String, required: true },
  telegramId: { type: String },
  username: { type: String },
  firstName: { type: String },
  linkedAt: { type: Date, default: Date.now },
});

const TelegramLink: Model<ITelegramLink> =
  (mongoose.models.TelegramLink as Model<ITelegramLink>) ||
  mongoose.model<ITelegramLink>("TelegramLink", TelegramLinkSchema);

export default TelegramLink;
