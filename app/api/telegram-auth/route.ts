import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import TelegramLink from "@/models/TelegramLink";
import crypto from "crypto";

function verifyTelegramHash(body: Record<string, string>): boolean {
  const { hash, ...fields } = body;
  const dataCheckString = Object.keys(fields)
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join("\n");
  const secretKey = crypto
    .createHash("sha256")
    .update(process.env.TELEGRAM_BOT_TOKEN!)
    .digest();
  const calculated = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");
  // constant-time compare
  return crypto.timingSafeEqual(Buffer.from(calculated, "hex"), Buffer.from(hash, "hex"));
}

// GET — check if the current session user already has Telegram linked
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

// POST — receive widget auth payload, verify, and save
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { id, first_name, username, auth_date, hash, photo_url } = body;

    if (!id || !hash || !auth_date) {
      return NextResponse.json({ success: false, error: "Invalid Telegram auth data" }, { status: 400 });
    }

    // Build the data check string fields (only include fields that exist)
    const toVerify: Record<string, string> = {
      id: String(id),
      auth_date: String(auth_date),
      hash,
    };
    if (first_name) toVerify.first_name = first_name;
    if (username) toVerify.username = username;
    if (photo_url) toVerify.photo_url = photo_url;

    if (!verifyTelegramHash(toVerify)) {
      return NextResponse.json({ success: false, error: "Invalid Telegram signature" }, { status: 403 });
    }

    // Reject auth older than 24 hours
    if (Math.floor(Date.now() / 1000) - Number(auth_date) > 86400) {
      return NextResponse.json({ success: false, error: "Telegram auth expired" }, { status: 403 });
    }

    await connectToDatabase();
    await TelegramLink.findOneAndUpdate(
      { email: session.user.email },
      { chatId: String(id), telegramId: String(id), username, firstName: first_name, linkedAt: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, first_name, username });
  } catch (err: any) {
    console.error("[telegram-auth]", err?.message);
    return NextResponse.json({ success: false, error: err.message ?? "Unexpected error" }, { status: 500 });
  }
}
