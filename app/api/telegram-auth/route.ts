import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import TelegramLink from "@/models/TelegramLink";
import TelegramLinkToken from "@/models/TelegramLinkToken";
import crypto from "crypto";

const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME ?? "UrNewsAI_bot";

// GET — is the current session user linked to Telegram?
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ connected: false });

    await connectToDatabase();
    const link = await TelegramLink.findOne({ email: session.user.email });
    if (!link) return NextResponse.json({ connected: false });

    return NextResponse.json({
      connected: true,
      username: link.username,
      first_name: link.firstName,
    });
  } catch {
    return NextResponse.json({ connected: false });
  }
}

// POST — mint a one-time token and return the bot deep-link to open.
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    await connectToDatabase();

    const token = crypto.randomBytes(24).toString("hex");
    // One pending token per user — replace any previous attempt.
    await TelegramLinkToken.findOneAndUpdate(
      { email: session.user.email },
      { token, email: session.user.email, createdAt: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      deepLink: `https://t.me/${BOT_USERNAME}?start=${token}`,
      botUsername: BOT_USERNAME,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[telegram-auth POST]", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE — unlink the current user's Telegram.
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    await connectToDatabase();
    await TelegramLink.deleteOne({ email: session.user.email });
    await TelegramLinkToken.deleteOne({ email: session.user.email });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[telegram-auth DELETE]", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
