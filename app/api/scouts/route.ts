import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * GET /api/scouts — the deployed scouts shown on the dashboard.
 *
 * Tries the FastAPI backend first (GET /api/v1/scouts). If the backend is
 * unreachable or hasn't been wired up yet, it falls back to a local set of
 * dummy scouts so the dashboard always renders. Swap `FALLBACK_SCOUTS` /
 * remove the try-catch once real per-user persistence is live.
 */

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

export type ScoutPersonality = {
  voice: string;
  voiceId?: string;
  language: string;
  toneSummary?: string;
};

export type ScoutPlatform = {
  platform: "telegram" | "whatsapp";
  connected: boolean;
  handle?: string | null;
};

export type ScoutSchedule = {
  frequency: string;
  intervalMinutes: number;
  times: string[];
  timezone: string;
  enabled: boolean;
  nextRunAt?: string | null;
  lastSentAt?: string | null;
};

export type ScoutStats = {
  briefingsSent: number;
  sourcesTracked: number;
  lastBriefing?: string | null;
};

export type Scout = {
  id: string;
  name: string;
  icon: string;
  accent: string;
  niche: string;
  description: string;
  status: "active" | "paused";
  keywords: string[];
  personality: ScoutPersonality;
  platforms: ScoutPlatform[];
  schedule: ScoutSchedule;
  stats: ScoutStats;
};

const FALLBACK_SCOUTS: Scout[] = [
  {
    id: "finance-markets",
    name: "Finance Scout",
    icon: "💹",
    accent: "#34d399",
    niche: "Finance & Markets",
    description: "Stocks, crypto, earnings and macro moves — the moment they break.",
    status: "active",
    keywords: ["S&P 500", "Fed rates", "earnings", "Bitcoin", "macro"],
    personality: {
      voice: "Professional",
      language: "English",
      toneSummary: "Crisp, analyst-style delivery with the numbers up front.",
    },
    platforms: [
      { platform: "telegram", connected: true, handle: "@jayandhan" },
      { platform: "whatsapp", connected: false, handle: null },
    ],
    schedule: {
      frequency: "Twice daily",
      intervalMinutes: 720,
      times: ["08:00", "18:00"],
      timezone: "Asia/Kolkata",
      enabled: true,
      nextRunAt: "2026-07-01T18:00:00+05:30",
      lastSentAt: "2026-07-01T08:00:00+05:30",
    },
    stats: { briefingsSent: 128, sourcesTracked: 42, lastBriefing: "4h ago" },
  },
  {
    id: "jobs-careers",
    name: "Careers Scout",
    icon: "💼",
    accent: "#4d7fff",
    niche: "Jobs & Careers",
    description: "Fresh roles, hiring trends and openings matched to your profile.",
    status: "active",
    keywords: ["AI engineer", "remote", "startups hiring", "referrals"],
    personality: {
      voice: "Casual",
      language: "English",
      toneSummary: "Friendly and encouraging, like a well-connected recruiter friend.",
    },
    platforms: [
      { platform: "telegram", connected: true, handle: "@jayandhan" },
      { platform: "whatsapp", connected: true, handle: "+91 •••• ••1234" },
    ],
    schedule: {
      frequency: "Daily",
      intervalMinutes: 1440,
      times: ["09:00"],
      timezone: "Asia/Kolkata",
      enabled: true,
      nextRunAt: "2026-07-02T09:00:00+05:30",
      lastSentAt: "2026-07-01T09:00:00+05:30",
    },
    stats: { briefingsSent: 54, sourcesTracked: 18, lastBriefing: "7h ago" },
  },
  {
    id: "law-policy",
    name: "Policy Scout",
    icon: "⚖️",
    accent: "#8b5cf6",
    niche: "Law & Policy",
    description: "Regulations, rulings and legal shifts that actually affect you.",
    status: "paused",
    keywords: ["data privacy", "GDPR", "AI regulation", "tax law"],
    personality: {
      voice: "Calm",
      language: "English",
      toneSummary: "Measured and precise — no hype, just what changed and why it matters.",
    },
    platforms: [
      { platform: "telegram", connected: true, handle: "@jayandhan" },
      { platform: "whatsapp", connected: false, handle: null },
    ],
    schedule: {
      frequency: "Weekly",
      intervalMinutes: 10080,
      times: ["Mon 07:30"],
      timezone: "Asia/Kolkata",
      enabled: false,
      nextRunAt: null,
      lastSentAt: "2026-06-23T07:30:00+05:30",
    },
    stats: { briefingsSent: 9, sourcesTracked: 11, lastBriefing: "8d ago" },
  },
  {
    id: "tech-science",
    name: "Tech Scout",
    icon: "🧬",
    accent: "#f472b6",
    niche: "Tech & Science",
    description: "Product launches, research breakthroughs and the next big thing.",
    status: "active",
    keywords: ["LLMs", "chip news", "space", "biotech", "open source"],
    personality: {
      voice: "Energetic",
      language: "English",
      toneSummary: "Upbeat and curious, great for keeping up with fast-moving tech.",
    },
    platforms: [
      { platform: "telegram", connected: true, handle: "@jayandhan" },
      { platform: "whatsapp", connected: false, handle: null },
    ],
    schedule: {
      frequency: "Real-time",
      intervalMinutes: 60,
      times: ["As it happens"],
      timezone: "Asia/Kolkata",
      enabled: true,
      nextRunAt: "2026-07-01T15:00:00+05:30",
      lastSentAt: "2026-07-01T13:00:00+05:30",
    },
    stats: { briefingsSent: 340, sourcesTracked: 63, lastBriefing: "1h ago" },
  },
];

/** Normalise the backend's snake_case shape into the camelCase the UI expects. */
function fromBackend(raw: any): Scout {
  return {
    id: raw.id,
    name: raw.name,
    icon: raw.icon ?? "🛰️",
    accent: raw.accent ?? "#4d7fff",
    niche: raw.niche,
    description: raw.description ?? "",
    status: raw.status ?? "active",
    keywords: raw.keywords ?? [],
    personality: {
      voice: raw.personality?.voice ?? "Professional",
      voiceId: raw.personality?.voice_id,
      language: raw.personality?.language ?? "English",
      toneSummary: raw.personality?.tone_summary ?? "",
    },
    platforms: (raw.platforms ?? []).map((p: any) => ({
      platform: p.platform,
      connected: !!p.connected,
      handle: p.handle ?? null,
    })),
    schedule: {
      frequency: raw.schedule?.frequency ?? "daily",
      intervalMinutes: raw.schedule?.interval_minutes ?? 1440,
      times: raw.schedule?.times ?? [],
      timezone: raw.schedule?.timezone ?? "UTC",
      enabled: raw.schedule?.enabled ?? true,
      nextRunAt: raw.schedule?.next_run_at ?? null,
      lastSentAt: raw.schedule?.last_sent_at ?? null,
    },
    stats: {
      briefingsSent: raw.stats?.briefings_sent ?? 0,
      sourcesTracked: raw.stats?.sources_tracked ?? 0,
      lastBriefing: raw.stats?.last_briefing ?? null,
    },
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  // Try the real backend; fall back to dummy data so the dashboard always works.
  try {
    const url = `${BACKEND}/api/v1/scouts?email=${encodeURIComponent(session.user.email)}`;
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      // Never cache scout config — always reflect the latest.
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.success && Array.isArray(data.scouts) && data.scouts.length) {
        return NextResponse.json({ success: true, scouts: data.scouts.map(fromBackend), source: "backend" });
      }
    }
  } catch {
    // Backend not ready — fall through to dummy data.
  }

  return NextResponse.json({ success: true, scouts: FALLBACK_SCOUTS, source: "placeholder" });
}
