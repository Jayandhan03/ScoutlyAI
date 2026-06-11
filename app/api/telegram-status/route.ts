import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import TelegramLink from "@/models/TelegramLink";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ connected: false, error: "token is required" }, { status: 422 });
  }

  try {
    await connectToDatabase();
    const link = await TelegramLink.findOne({ token });
    if (!link) return NextResponse.json({ connected: false });

    return NextResponse.json({
      connected: true,
      username: link.username,
      first_name: link.firstName,
    });
  } catch (err: any) {
    console.error("[telegram-status]", err?.message);
    return NextResponse.json({ connected: false });
  }
}
