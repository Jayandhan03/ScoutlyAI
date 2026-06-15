import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Short-lived token that binds a "Connect Telegram" attempt to the signed-in
 * user's email. The user opens https://t.me/<bot>?start=<token>; when the bot
 * receives /start <token> via the webhook, we look up the email here and create
 * the permanent TelegramLink. Tokens auto-expire via a TTL index.
 */
export interface ITelegramLinkToken extends Document {
  token: string;
  email: string;
  createdAt: Date;
}

const TelegramLinkTokenSchema = new Schema<ITelegramLinkToken>({
  token: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, lowercase: true },
  // TTL: Mongo removes the document 10 minutes after creation.
  createdAt: { type: Date, default: Date.now, expires: 600 },
});

const TelegramLinkToken: Model<ITelegramLinkToken> =
  (mongoose.models.TelegramLinkToken as Model<ITelegramLinkToken>) ||
  mongoose.model<ITelegramLinkToken>("TelegramLinkToken", TelegramLinkTokenSchema);

export default TelegramLinkToken;
