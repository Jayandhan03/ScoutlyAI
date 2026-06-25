import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import UserPreference from "@/models/UserPreference";

const MIN_INTERVAL_MINUTES = 15;

function publicShape(doc: any) {
  if (!doc) return null;
  return {
    topics: doc.topics ?? [],
    keywords: doc.keywords ?? [],
    region: doc.region ?? "Global",
    summary: doc.summary ?? "",
    articleLimit: doc.articleLimit ?? 5,
    scheduleEnabled: doc.scheduleEnabled ?? false,
    frequency: doc.frequency ?? "daily",
    intervalMinutes: doc.intervalMinutes ?? 1440,
    lastSentAt: doc.lastSentAt ?? null,
    nextRunAt: doc.nextRunAt ?? null,
  };
}

// GET — current user's saved preferences (null if none yet).
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    await connectToDatabase();
    const doc = await UserPreference.findOne({ email: session.user.email }).lean();
    return NextResponse.json({ success: true, preferences: publicShape(doc) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[preferences GET]", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PUT — upsert preferences and/or schedule. Accepts any subset of fields.
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    await connectToDatabase();

    const existing = await UserPreference.findOne({ email: session.user.email });

    const set: Record<string, unknown> = {};
    if (Array.isArray(body.topics)) set.topics = body.topics.filter(Boolean);
    if (Array.isArray(body.keywords)) set.keywords = body.keywords.filter(Boolean);
    if (typeof body.region === "string") set.region = body.region;
    if (typeof body.summary === "string") set.summary = body.summary;
    if (Number.isFinite(body.articleLimit)) {
      set.articleLimit = Math.min(20, Math.max(1, Math.round(body.articleLimit)));
    }
    if (typeof body.frequency === "string") set.frequency = body.frequency;
    if (Number.isFinite(body.intervalMinutes)) {
      set.intervalMinutes = Math.max(MIN_INTERVAL_MINUTES, Math.round(body.intervalMinutes));
    }
    if (typeof body.scheduleEnabled === "boolean") set.scheduleEnabled = body.scheduleEnabled;

    // Resolve the effective schedule state after this update.
    const scheduleEnabled =
      "scheduleEnabled" in set
        ? (set.scheduleEnabled as boolean)
        : existing?.scheduleEnabled ?? false;
    const intervalMinutes =
      "intervalMinutes" in set
        ? (set.intervalMinutes as number)
        : existing?.intervalMinutes ?? 1440;

    // Recompute nextRunAt whenever schedule state or cadence is touched.
    const scheduleTouched = "scheduleEnabled" in set || "intervalMinutes" in set || "frequency" in set;
    if (scheduleTouched) {
      if (scheduleEnabled) {
        set.nextRunAt = new Date(Date.now() + intervalMinutes * 60_000);
      } else {
        set.nextRunAt = null;
      }
    }

    const doc = await UserPreference.findOneAndUpdate(
      { email: session.user.email },
      { $set: set, $setOnInsert: { email: session.user.email } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return NextResponse.json({ success: true, preferences: publicShape(doc) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[preferences PUT]", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE — disable the schedule (keeps saved topics for later).
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }
    await connectToDatabase();
    await UserPreference.updateOne(
      { email: session.user.email },
      { $set: { scheduleEnabled: false, nextRunAt: null } }
    );
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[preferences DELETE]", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
