import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import TelegramLink from "@/models/TelegramLink";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const formData = await req.formData();
    const audio = formData.get("audio") as File | null;
    const topic = (formData.get("topic") as string) ?? "News Briefing";

    if (!audio) {
      return NextResponse.json({ success: false, error: "audio is required" }, { status: 422 });
    }

    await connectToDatabase();
    const link = await TelegramLink.findOne({ email: session.user.email });
    if (!link) {
      return NextResponse.json(
        { success: false, error: "Telegram not connected. Please link your account first." },
        { status: 404 }
      );
    }

    const tgForm = new FormData();
    tgForm.append("chat_id", link.chatId);
    tgForm.append("audio", audio, audio.name ?? "news_briefing.mp3");
    tgForm.append("caption", `🎙 *${topic}* — YourNews AI Briefing`);
    tgForm.append("parse_mode", "Markdown");

    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendAudio`, {
      method: "POST",
      body: tgForm,
      signal: AbortSignal.timeout(30_000),
    });

    if (!tgRes.ok) {
      const errBody = await tgRes.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, error: errBody.description ?? "Telegram API error" },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[send-telegram]", err?.message);
    return NextResponse.json({ success: false, error: err.message ?? "Unexpected error" }, { status: 500 });
  }
}
