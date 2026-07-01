import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import TelegramLink from "@/models/TelegramLink";
import TelegramLinkToken from "@/models/TelegramLinkToken";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET; // optional

async function sendMessage(chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  }).catch(() => {});
}

// Telegram sends updates here via setWebhook.
export async function POST(req: Request) {
  try {
    // If a secret is configured, reject calls that don't carry it.
    if (
      WEBHOOK_SECRET &&
      req.headers.get("x-telegram-bot-api-secret-token") !== WEBHOOK_SECRET
    ) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const update = await req.json();
    const message = update?.message;
    if (!message?.chat?.id) return NextResponse.json({ ok: true });

    const chatId = String(message.chat.id);
    const text: string = message.text ?? "";
    const username: string | undefined = message.from?.username;
    const firstName: string | undefined = message.from?.first_name;
    const telegramId: string | undefined =
      message.from?.id != null ? String(message.from.id) : undefined;

    if (text.startsWith("/start")) {
      const token = text.split(/\s+/)[1]?.trim();

      if (!token) {
        await sendMessage(
          chatId,
          `👋 *Welcome to Leora!*\n\nTo link your account, open the Leora app and tap *Connect with Telegram* — that link brings you back here automatically.`
        );
        return NextResponse.json({ ok: true });
      }

      await connectToDatabase();
      const pending = await TelegramLinkToken.findOne({ token });

      if (!pending) {
        await sendMessage(
          chatId,
          `⚠️ This link has expired. Please go back to the Leora app and tap *Connect with Telegram* again.`
        );
        return NextResponse.json({ ok: true });
      }

      await TelegramLink.findOneAndUpdate(
        { email: pending.email },
        { chatId, telegramId, username, firstName, linkedAt: new Date() },
        { upsert: true, new: true }
      );
      await TelegramLinkToken.deleteOne({ _id: pending._id });

      await sendMessage(
        chatId,
        `✅ *Connected!* Your Leora account is now linked.\n\nGenerate an audio briefing in the app and tap *Send to Telegram* — it'll arrive right here. 🎙`
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[telegram-webhook]", message);
    // Always 200 so Telegram doesn't retry-storm on transient errors.
    return NextResponse.json({ ok: false });
  }
}

// GET ?setup=1 — one-time helper to register this route as the bot webhook.
// Visit https://<your-domain>/api/telegram-webhook?setup=1 once after deploy.
export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);

  if (searchParams.get("setup") !== "1") {
    // Plain ping / status.
    const info = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`
    ).then((r) => r.json());
    return NextResponse.json({ ok: true, webhook: info?.result });
  }

  const webhookUrl = `${origin}/api/telegram-webhook`;
  const body: Record<string, unknown> = {
    url: webhookUrl,
    allowed_updates: ["message"],
    drop_pending_updates: true,
  };
  if (WEBHOOK_SECRET) body.secret_token = WEBHOOK_SECRET;

  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  ).then((r) => r.json());

  return NextResponse.json({ ok: true, setWebhook: res, webhookUrl });
}
