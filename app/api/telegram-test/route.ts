import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import TelegramLink from "@/models/TelegramLink";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

// POST — send a test ping to the current user's linked Telegram chat.
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    await connectToDatabase();
    const link = await TelegramLink.findOne({ email: session.user.email });
    if (!link) {
      return NextResponse.json({ success: false, error: "Telegram not connected" }, { status: 404 });
    }

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: link.chatId,
        text: "✅ *ScoutlyAI test successful!*\n\nYour Telegram is connected. Audio briefings will be delivered here.",
        parse_mode: "Markdown",
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, error: err.description ?? "Telegram API error" },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[telegram-test]", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
