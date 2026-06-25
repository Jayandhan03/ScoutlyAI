import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const maxDuration = 60;

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

/**
 * POST /api/preferences/deliver-now
 * Ask the backend to immediately generate + send one briefing to the current
 * user's Telegram, using their saved preferences. Backs "Send me one now".
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const res = await fetch(`${BACKEND}/api/v1/scheduler/deliver-now`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: session.user.email }),
      signal: AbortSignal.timeout(55_000),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data.detail ?? data.error ?? "Delivery failed" },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, ...data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[preferences/deliver-now]", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
