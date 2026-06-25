import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Waitlist from "@/models/Waitlist";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST — capture a waitlist signup from the landing page.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const source = typeof body.source === "string" ? body.source : "landing";
    const interests = Array.isArray(body.interests)
      ? body.interests.filter((x: unknown) => typeof x === "string").slice(0, 20)
      : [];

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Upsert so repeat signups don't error on the unique index.
    await Waitlist.findOneAndUpdate(
      { email },
      { $set: { source }, $setOnInsert: { email }, $addToSet: { interests: { $each: interests } } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, message: "You're on the list — welcome aboard! 🎉" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[waitlist POST]", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
