"use client";

import { useEffect, useState } from "react";
import PreferencesChat, { ExtractedPrefs } from "./PreferencesChat";

type Prefs = ExtractedPrefs & {
  articleLimit: number;
  scheduleEnabled: boolean;
  frequency: string;
  intervalMinutes: number;
  lastSentAt: string | null;
  nextRunAt: string | null;
};

const FREQUENCIES = [
  { key: "hourly", label: "Hourly", sub: "every hour", icon: "⚡", minutes: 60 },
  { key: "every_3h", label: "Every 3 hrs", sub: "6× a day", icon: "🕒", minutes: 180 },
  { key: "every_6h", label: "Every 6 hrs", sub: "4× a day", icon: "🕕", minutes: 360 },
  { key: "twice_daily", label: "Twice a day", sub: "morning & night", icon: "🌗", minutes: 720 },
  { key: "daily", label: "Daily", sub: "once a day", icon: "☀️", minutes: 1440 },
  { key: "weekly", label: "Weekly", sub: "once a week", icon: "📅", minutes: 10080 },
];

function Spinner({ size = 15 }: { size?: number }) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size, borderRadius: "50%",
      border: "2px solid rgba(255,255,255,0.25)", borderTopColor: "#fff",
      animation: "spin 0.7s linear infinite", flexShrink: 0,
    }} />
  );
}

function relTime(iso: string | null): string {
  if (!iso) return "";
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms)) return "";
  if (ms <= 0) return "any moment now";
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `in ~${mins} min`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `in ~${hrs} hr${hrs > 1 ? "s" : ""}`;
  const days = Math.round(hrs / 24);
  return `in ~${days} day${days > 1 ? "s" : ""}`;
}

/* Small numbered step badge */
function StepBadge({ n, done, active }: { n: number; done?: boolean; active?: boolean }) {
  return (
    <div style={{
      width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 12.5, fontWeight: 800,
      background: done
        ? "linear-gradient(135deg, #34d399, #10b981)"
        : active
        ? "linear-gradient(135deg, #4d7fff, #8b5cf6)"
        : "rgba(255,255,255,0.07)",
      color: done || active ? "#fff" : "rgba(160,175,220,0.6)",
      border: done || active ? "none" : "1px solid rgba(255,255,255,0.1)",
      boxShadow: active ? "0 0 16px rgba(77,127,255,0.5)" : "none",
    }}>
      {done ? "✓" : n}
    </div>
  );
}

export default function PersonalizedDelivery({ tgConnected }: { tgConnected: boolean }) {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [freq, setFreq] = useState("daily");
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentFlash, setSentFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/preferences");
        if (res.ok) {
          const data = await res.json();
          if (data.preferences) {
            setPrefs(data.preferences);
            setFreq(data.preferences.frequency ?? "daily");
            setEnabled(Boolean(data.preferences.scheduleEnabled));
          }
        }
      } catch { /* silent */ } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const hasPrefs = !!prefs && (prefs.topics?.length ?? 0) > 0;

  async function savePreferencesFromChat(p: ExtractedPrefs) {
    const res = await fetch("/api/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topics: p.topics, keywords: p.keywords, region: p.region, summary: p.summary }),
    });
    const data = await res.json();
    if (res.ok && data.preferences) {
      setPrefs(data.preferences);
      setFreq(data.preferences.frequency ?? "daily");
      setEnabled(Boolean(data.preferences.scheduleEnabled));
    }
  }

  async function saveSchedule(nextEnabled: boolean, nextFreq: string) {
    setSaving(true);
    setError(null);
    const minutes = FREQUENCIES.find(f => f.key === nextFreq)?.minutes ?? 1440;
    try {
      const res = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleEnabled: nextEnabled, frequency: nextFreq, intervalMinutes: minutes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save schedule.");
        return;
      }
      setPrefs(data.preferences);
      setEnabled(Boolean(data.preferences.scheduleEnabled));
      setFreq(data.preferences.frequency ?? nextFreq);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function sendSampleNow() {
    if (sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/preferences/deliver-now", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not send a sample.");
        return;
      }
      setSentFlash(true);
      setTimeout(() => setSentFlash(false), 4000);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSending(false);
    }
  }

  if (!loaded) return null;

  const step2Active = hasPrefs;

  return (
    <div style={{
      width: "100%", maxWidth: 680, marginTop: 40, position: "relative", overflow: "hidden",
      background: "linear-gradient(180deg, rgba(77,127,255,0.06), rgba(139,92,246,0.03))",
      border: "1px solid rgba(77,127,255,0.16)",
      borderRadius: 24, padding: "34px 32px",
      backdropFilter: "blur(18px)",
      boxShadow: "0 0 80px rgba(77,127,255,0.07), 0 24px 60px rgba(0,0,0,0.3)",
      animation: "floatUp 0.85s 0.2s cubic-bezier(0.16,1,0.3,1) both",
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "absolute", top: -70, right: -40, width: 260, height: 160, borderRadius: "50%",
        background: "rgba(139,92,246,0.12)", filter: "blur(60px)", pointerEvents: "none",
      }} />

      {/* Section badge */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        fontSize: 10.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
        color: "#8b5cf6", background: "rgba(139,92,246,0.1)",
        border: "1px solid rgba(139,92,246,0.22)", borderRadius: 999,
        padding: "5px 14px", marginBottom: 16,
      }}>
        ✨ Set &amp; forget
      </div>

      {/* Heading */}
      <h2 style={{
        margin: "0 0 8px", fontFamily: "'Sora', sans-serif",
        fontSize: "clamp(22px, 3.5vw, 28px)", fontWeight: 800,
        letterSpacing: "-0.03em", lineHeight: 1.15, color: "#f0f2ff",
      }}>
        Your Personalized{" "}
        <span style={{
          background: "linear-gradient(135deg, #4d7fff, #8b5cf6 60%, #38bdf8)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        }}>Auto-Briefings</span>
      </h2>
      <p style={{ margin: "0 0 26px", fontSize: 14.5, color: "rgba(200,210,255,0.6)", lineHeight: 1.65, maxWidth: 520 }}>
        Tell the assistant what you care about, choose a rhythm, and the bot keeps
        the latest audio news flowing to your Telegram — no clicks required.
      </p>

      {/* ── STEP 1 — Preferences ── */}
      <div style={{ display: "flex", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <StepBadge n={1} done={hasPrefs} active={!hasPrefs} />
          <div style={{ flex: 1, width: 2, borderRadius: 2, background: hasPrefs ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.08)" }} />
        </div>

        <div style={{ flex: 1, paddingBottom: 22 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: "#f0f2ff", marginBottom: 3 }}>
            What you want to hear
          </div>
          <div style={{ fontSize: 12.5, color: "rgba(160,175,220,0.55)", marginBottom: 14 }}>
            A quick AI chat captures your niche topics &amp; angle.
          </div>

          {hasPrefs ? (
            <div style={{
              padding: "16px 18px", borderRadius: 16,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                  color: "#34d399", background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)",
                  borderRadius: 999, padding: "3px 9px",
                }}>✓ Saved</span>
                <span style={{ fontSize: 11.5, color: "rgba(160,175,220,0.45)" }}>tuned by AI</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: prefs!.summary ? 12 : 14 }}>
                {prefs!.topics.map(t => <span key={t} style={chip("#4d7fff")}>{t}</span>)}
                {prefs!.keywords.map(k => <span key={k} style={chip("#8b5cf6")}>{k}</span>)}
                {prefs!.region && <span style={chip("#38bdf8")}>📍 {prefs!.region}</span>}
              </div>
              {prefs!.summary && (
                <p style={{
                  margin: "0 0 14px", padding: "10px 14px", borderRadius: 10,
                  fontSize: 13, fontStyle: "italic", color: "rgba(200,210,255,0.65)", lineHeight: 1.55,
                  background: "rgba(77,127,255,0.05)", borderLeft: "2px solid rgba(77,127,255,0.4)",
                }}>
                  “{prefs!.summary}”
                </p>
              )}
              <button onClick={() => setChatOpen(true)} style={ghostBtn}>✎ Edit with AI chat</button>
            </div>
          ) : (
            <button
              onClick={() => setChatOpen(true)}
              style={{
                width: "100%", padding: "22px 18px", borderRadius: 16,
                background: "linear-gradient(135deg, rgba(77,127,255,0.1), rgba(139,92,246,0.08))",
                border: "1px dashed rgba(77,127,255,0.35)",
                color: "#a9bdff", cursor: "pointer", fontFamily: "'Inter', sans-serif",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(77,127,255,0.6)"; (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, rgba(77,127,255,0.16), rgba(139,92,246,0.12))"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(77,127,255,0.35)"; (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, rgba(77,127,255,0.1), rgba(139,92,246,0.08))"; }}
            >
              <span style={{ fontSize: 22 }}>🧠</span>
              <span style={{ textAlign: "left" }}>
                <span style={{ display: "block", fontSize: 14.5, fontWeight: 700 }}>Set up your news preferences</span>
                <span style={{ display: "block", fontSize: 12, color: "rgba(160,175,220,0.55)", marginTop: 1 }}>Chat with the AI — takes ~30 seconds</span>
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ── STEP 2 — Schedule ── */}
      <div style={{ display: "flex", gap: 14, opacity: step2Active ? 1 : 0.45, transition: "opacity 0.3s" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <StepBadge n={2} active={step2Active && !enabled} done={enabled} />
        </div>

        <div style={{ flex: 1, pointerEvents: step2Active ? "auto" : "none" }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: "#f0f2ff", marginBottom: 3 }}>
            How often to deliver
          </div>
          <div style={{ fontSize: 12.5, color: "rgba(160,175,220,0.55)", marginBottom: 14 }}>
            Pick a rhythm — change it anytime.
          </div>

          {/* Frequency cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 9, marginBottom: 16 }}>
            {FREQUENCIES.map(f => {
              const active = freq === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => { setFreq(f.key); if (enabled) saveSchedule(true, f.key); }}
                  style={{
                    position: "relative", padding: "14px 8px 12px", borderRadius: 14, cursor: "pointer",
                    textAlign: "center", fontFamily: "'Inter', sans-serif", overflow: "hidden",
                    background: active
                      ? "linear-gradient(135deg, rgba(77,127,255,0.22), rgba(139,92,246,0.16))"
                      : "rgba(255,255,255,0.03)",
                    border: `1px solid ${active ? "rgba(77,127,255,0.55)" : "rgba(255,255,255,0.08)"}`,
                    boxShadow: active ? "0 0 22px rgba(77,127,255,0.25)" : "none",
                    transition: "all 0.18s",
                  }}
                >
                  {active && (
                    <span style={{
                      position: "absolute", top: 6, right: 6, fontSize: 10, color: "#fff",
                      width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      background: "linear-gradient(135deg, #4d7fff, #8b5cf6)",
                    }}>✓</span>
                  )}
                  <div style={{ fontSize: 19, marginBottom: 5, filter: active ? "none" : "grayscale(0.4) opacity(0.85)" }}>{f.icon}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: active ? "#bcccff" : "#e6ebff" }}>{f.label}</div>
                  <div style={{ fontSize: 10, color: "rgba(160,175,220,0.5)", marginTop: 1 }}>{f.sub}</div>
                </button>
              );
            })}
          </div>

          {/* Telegram-required banner */}
          {!tgConnected && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10, marginBottom: 12,
              padding: "11px 14px", borderRadius: 12,
              background: "rgba(42,171,238,0.07)", border: "1px solid rgba(42,171,238,0.22)",
            }}>
              <span style={{ fontSize: 16 }}>📲</span>
              <span style={{ fontSize: 12.5, color: "rgba(200,225,255,0.75)", lineHeight: 1.45 }}>
                Connect Telegram in the section above to switch on automatic delivery.
              </span>
            </div>
          )}

          {/* Status + master toggle */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "15px 18px", borderRadius: 16,
            background: enabled ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.025)",
            border: `1px solid ${enabled ? "rgba(52,211,153,0.28)" : "rgba(255,255,255,0.08)"}`,
            transition: "all 0.25s",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{
                width: 9, height: 9, borderRadius: "50%", flexShrink: 0,
                background: enabled ? "#34d399" : "rgba(160,175,220,0.4)",
                boxShadow: enabled ? "0 0 10px #34d399" : "none",
                animation: enabled ? "pulse 2s ease-in-out infinite" : "none",
              }} />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: enabled ? "#34d399" : "#e6ebff" }}>
                  {enabled ? "Auto-delivery is ON" : "Auto-delivery is off"}
                </div>
                <div style={{ fontSize: 12, color: "rgba(200,210,255,0.55)", marginTop: 2 }}>
                  {enabled && prefs?.nextRunAt
                    ? `Next briefing ${relTime(prefs.nextRunAt)} · via Telegram`
                    : tgConnected
                    ? "Turn on to start receiving briefings"
                    : "Connect Telegram first"}
                </div>
              </div>
            </div>
            <button
              onClick={() => { const next = !enabled; setEnabled(next); saveSchedule(next, freq); }}
              disabled={saving || !tgConnected}
              title={!tgConnected ? "Connect Telegram first" : ""}
              style={{
                width: 54, height: 30, borderRadius: 999, position: "relative", flexShrink: 0,
                background: enabled ? "linear-gradient(135deg, #34d399, #10b981)" : "rgba(255,255,255,0.12)",
                border: "none", cursor: saving || !tgConnected ? "not-allowed" : "pointer",
                opacity: !tgConnected ? 0.5 : 1, transition: "background 0.25s",
              }}
            >
              <span style={{
                position: "absolute", top: 3, left: enabled ? 27 : 3,
                width: 24, height: 24, borderRadius: "50%", background: "#fff",
                transition: "left 0.22s cubic-bezier(0.16,1,0.3,1)", boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
              }} />
            </button>
          </div>

          {/* Send sample now */}
          {tgConnected && hasPrefs && (
            <button
              onClick={sendSampleNow}
              disabled={sending}
              style={{
                marginTop: 12, width: "100%", height: 46, borderRadius: 12,
                background: sentFlash ? "rgba(52,211,153,0.15)" : "rgba(42,171,238,0.1)",
                border: `1px solid ${sentFlash ? "rgba(52,211,153,0.4)" : "rgba(42,171,238,0.3)"}`,
                color: sentFlash ? "#34d399" : "#2AABEE",
                fontSize: 13.5, fontWeight: 700, cursor: sending ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                fontFamily: "'Inter', sans-serif", transition: "all 0.2s",
              }}
            >
              {sentFlash ? "✓ Sent to your Telegram!" : sending ? <><Spinner /> Generating &amp; sending…</> : "🎧 Send me a sample now"}
            </button>
          )}

          <div style={{ minHeight: 18, marginTop: 10, textAlign: "center" }}>
            {savedFlash && <span style={{ fontSize: 12.5, color: "#34d399" }}>✓ Schedule saved</span>}
            {error && <span style={{ fontSize: 12.5, color: "#ff7070" }}>⚠ {error}</span>}
          </div>
        </div>
      </div>

      <PreferencesChat
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        onSaved={savePreferencesFromChat}
        initialPrefs={hasPrefs ? { topics: prefs!.topics, keywords: prefs!.keywords, region: prefs!.region, summary: prefs!.summary } : null}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const ghostBtn: React.CSSProperties = {
  height: 36, padding: "0 16px", borderRadius: 10,
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(77,127,255,0.28)",
  color: "#a9bdff", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
  fontFamily: "'Inter', sans-serif",
};

function chip(color: string): React.CSSProperties {
  return {
    fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 999,
    color, background: `${color}1a`, border: `1px solid ${color}40`,
  };
}
