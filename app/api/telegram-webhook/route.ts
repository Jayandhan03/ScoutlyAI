import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import TelegramLink from "@/models/TelegramLink";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

async function sendMessage(chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

export async function POST(req: Request) {
  try {
    const update = await req.json();
    const message = update?.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId = String(message.chat.id);
    const text: string = message.text ?? "";
    const username: string | undefined = message.from?.username;
    const firstName: string | undefined = message.from?.first_name;

    if (text.startsWith("/start")) {
      const token = text.split(" ")[1]?.trim();
      if (token) {
        await connectToDatabase();
        await TelegramLink.findOneAndUpdate(
          { token },
          { chatId, username, firstName, linkedAt: new Date() },
          { upsert: true, new: true }
        );
        await sendMessage(
          chatId,
          `✅ Connected! Your YourNews account is now linked.\n\nYou'll receive your AI audio briefings here. Go back to the app to start generating.`
        );
      } else {
        await sendMessage(
          chatId,
          `👋 Welcome to YourNews AI Bot!\n\nTo link your account, open the YourNews app and click "Connect Telegram".`
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[telegram-webhook]", err?.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
