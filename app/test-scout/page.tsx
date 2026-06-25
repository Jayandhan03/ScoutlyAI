"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

/* ── Animated waveform bars ── */
function Waveform({ active }: { active: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, height: 40 }}>
      {Array.from({ length: 32 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 3, borderRadius: 99,
            background: "linear-gradient(180deg, #4d7fff, #8b5cf6)",
            animationDelay: `${(i * 0.06) % 1.4}s`,
            height: active ? `${Math.floor(Math.random() * 28 + 8)}px` : "6px",
            transition: "height 0.4s ease",
            animation: active ? "wave-bar 1.1s ease-in-out infinite alternate" : "none",
            opacity: active ? 1 : 0.25,
          }}
        />
      ))}
    </div>
  );
}

function Spinner() {
  return (
    <span style={{
      display: "inline-block", width: 16, height: 16, borderRadius: "50%",
      border: "2px solid rgba(255,255,255,0.25)", borderTopColor: "#fff",
      animation: "spin 0.7s linear infinite", flexShrink: 0,
    }} />
  );
}

/* ── Telegram icon SVG ── */
function TelegramIcon({ size = 18, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.787l3.019-14.228c.309-1.239-.473-1.8-1.282-1.432z" fill={color}/>
    </svg>
  );
}

/* ── Reusable landing-style section header ── */
function SectionHeader({
  eyebrow, title, highlight, subtitle,
  color = "#4d7fff", dim = "rgba(77,127,255,0.10)", border = "rgba(77,127,255,0.28)",
}: {
  eyebrow: string; title: string; highlight?: string; subtitle?: string;
  color?: string; dim?: string; border?: string;
}) {
  return (
    <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 36px" }}>
      <div style={{
        display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase", color, marginBottom: 16,
        padding: "5px 16px", background: dim, border: `1px solid ${border}`, borderRadius: 999,
      }}>{eyebrow}</div>
      <h2 style={{
        fontFamily: "'Sora', sans-serif", fontSize: "clamp(26px, 4vw, 40px)",
        fontWeight: 800, letterSpacing: "-0.035em", margin: 0, lineHeight: 1.15, color: "#f0f2ff",
      }}>
        {title}
        {highlight && <>{" "}<span style={{
          background: "linear-gradient(135deg, #4d7fff 0%, #8b5cf6 55%, #38bdf8 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        }}>{highlight}</span></>}
      </h2>
      {subtitle && <p style={{
        fontSize: 15, lineHeight: 1.7, color: "rgba(200,210,255,0.6)",
        maxWidth: 540, margin: "16px auto 0",
      }}>{subtitle}</p>}
    </div>
  );
}

/* ── Languages (code = gTTS voice_id) + browser preview locale ── */
const LANGS = [
  { code: "en", label: "English",    speech: "en-US", sample: "Here's your latest audio briefing from ScoutlyAI." },
  { code: "es", label: "Español",    speech: "es-ES", sample: "Aquí tienes tu resumen de noticias más reciente de ScoutlyAI." },
  { code: "hi", label: "हिन्दी",      speech: "hi-IN", sample: "यह ScoutlyAI की आपकी ताज़ा ऑडियो ब्रीफ़िंग है।" },
  { code: "fr", label: "Français",   speech: "fr-FR", sample: "Voici votre dernier briefing audio de ScoutlyAI." },
  { code: "de", label: "Deutsch",    speech: "de-DE", sample: "Hier ist dein aktuelles Audio-Briefing von ScoutlyAI." },
  { code: "pt", label: "Português",  speech: "pt-BR", sample: "Aqui está o seu briefing de áudio mais recente da ScoutlyAI." },
  { code: "ar", label: "العربية",    speech: "ar-SA", sample: "إليك أحدث ملخص صوتي من سكاوتلي إيه آي." },
  { code: "ja", label: "日本語",      speech: "ja-JP", sample: "ScoutlyAIからの最新の音声ブリーフィングです。" },
];

/* ── Voice tones → map to browser preview prosody (rate/pitch) ── */
const TONES = [
  { name: "Professional", icon: "💼", rate: 1.0,  pitch: 1.0  },
  { name: "Casual",       icon: "😎", rate: 1.05, pitch: 1.06 },
  { name: "Energetic",    icon: "⚡", rate: 1.18, pitch: 1.22 },
  { name: "Calm",         icon: "🌙", rate: 0.9,  pitch: 0.95 },
];

type Step = 0 | 1 | 2 | 3 | 4;
const STEP_LABELS: Record<number, string> = {
  1: "Fetching latest articles…",
  2: "Summarizing with AI…",
  3: "Generating audio briefing…",
  4: "Done!",
};

export default function TestScoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [topic, setTopic]         = useState("");
  const [step, setStep]           = useState<Step>(0);
  const [audioUrl, setAudioUrl]   = useState<string | null>(null);
  const [audioName, setAudioName] = useState("news_audio.mp3");
  const [error, setError]         = useState<string | null>(null);
  const audioRef                  = useRef<HTMLAudioElement>(null);

  /* ── Language + voice tone ── */
  const [lang, setLang]           = useState("en");
  const [tone, setTone]           = useState("Professional");
  const [voiceTesting, setVoiceTesting] = useState(false);

  /* ── Telegram (send only — connection is managed on the dashboard) ── */
  const [tgConnected, setTgConnected] = useState(false);
  const [tgSending, setTgSending]     = useState(false);
  const [tgSent, setTgSent]           = useState(false);
  const [tgError, setTgError]         = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/signin");
  }, [status, router]);

  /* ── Check Telegram connection on mount ── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/telegram-auth");
        if (res.ok) {
          const data = await res.json();
          if (data.connected) setTgConnected(true);
        }
      } catch { /* silent */ }
    })();
  }, []);

  const isLoading = step > 0 && step < 4;

  const handleGenerate = async () => {
    const q = topic.trim();
    if (!q || isLoading) return;
    setStep(1); setAudioUrl(null); setError(null);

    try {
      const t1 = setTimeout(() => setStep(2), 3000);
      const t2 = setTimeout(() => setStep(3), 8000);
      const res = await fetch("/api/news-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: q, limit: 5, voice_id: lang, model_id: "", tone }),
      });
      clearTimeout(t1); clearTimeout(t2);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        setError(err.error ?? "Audio generation failed. Please try again.");
        setStep(0); return;
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const disp = res.headers.get("Content-Disposition") ?? "";
      const match = disp.match(/filename="?([^"]+)"?/);
      setAudioUrl(url);
      setAudioName(match ? match[1] : `${q.replace(/\s+/g, "_")}_news.mp3`);
      setStep(4);
    } catch (e: any) {
      setError(e.message ?? "Network error."); setStep(0);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    Object.assign(document.createElement("a"), { href: audioUrl, download: audioName }).click();
  };

  /* ── Send audio to Telegram ── */
  const handleSendTelegram = async () => {
    if (!audioUrl || tgSending) return;
    setTgSending(true);
    setTgError(null);
    setTgSent(false);
    try {
      const audioBlob = await fetch(audioUrl).then(r => r.blob());
      const formData = new FormData();
      formData.append("audio", audioBlob, audioName);
      formData.append("topic", topic);

      const res = await fetch("/api/send-telegram", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to send" }));
        setTgError(err.error ?? "Failed to send audio to Telegram");
      } else {
        setTgSent(true);
        setTimeout(() => setTgSent(false), 4000);
      }
    } catch (e: any) {
      setTgError(e.message ?? "Network error");
    } finally {
      setTgSending(false);
    }
  };

  /* ── Live in-browser voice preview (Web Speech API) ── */
  const testVoice = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (voiceTesting) { window.speechSynthesis.cancel(); setVoiceTesting(false); return; }

    const langDef = LANGS.find(l => l.code === lang) ?? LANGS[0];
    const toneDef = TONES.find(t => t.name === tone) ?? TONES[0];

    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(langDef.sample);
    u.lang  = langDef.speech;
    u.rate  = toneDef.rate;
    u.pitch = toneDef.pitch;

    const match = window.speechSynthesis
      .getVoices()
      .find(v => v.lang?.toLowerCase().startsWith(langDef.speech.slice(0, 2).toLowerCase()));
    if (match) u.voice = match;

    u.onend   = () => setVoiceTesting(false);
    u.onerror = () => setVoiceTesting(false);
    setVoiceTesting(true);
    window.speechSynthesis.speak(u);
  };

  const progressWidth =
    step === 1 ? "25%" : step === 2 ? "58%" : step === 3 ? "84%" : "100%";

  // Loading / auth check screen
  if (status === "loading" || status === "unauthenticated") {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#070a12",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          border: "3px solid rgba(77,127,255,0.2)", borderTopColor: "#4d7fff",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(77,127,255,0.13) 0%, transparent 70%), #070a12",
      fontFamily: "'Inter', sans-serif",
    }}>

      {/* ══ NAVBAR ══ */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        borderBottom: "1px solid rgba(255,255,255,0.055)",
        backdropFilter: "blur(18px)",
        background: "rgba(7,7,17,0.75)",
        padding: "0 32px",
      }}>
        <div style={{
          maxWidth: 960, margin: "0 auto", height: 62,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Logo */}
          <Link href="/home" style={{
            display: "flex", alignItems: "center", gap: 10, textDecoration: "none",
            fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 800,
            letterSpacing: "-0.02em", color: "#f0f2ff",
          }}>
            <span style={{
              width: 9, height: 9, borderRadius: "50%", display: "inline-block",
              background: "linear-gradient(135deg, #4d7fff, #8b5cf6)",
              boxShadow: "0 0 12px rgba(77,127,255,0.7)",
              animation: "pulse 2.5s ease-in-out infinite",
            }} />
            ScoutlyAI
          </Link>

          {/* Center nav links */}
          <nav className="home-nav-links" style={{ display: "flex", alignItems: "center", gap: 28 }}>
            {[
              { href: "/test-scout", label: "Test a Scout", active: true },
              { href: "/home#delivery", label: "Delivery" },
              { href: "/home#scouts", label: "My Scouts" },
              { href: "/home#how-it-works", label: "How it works" },
            ].map(l => (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  fontSize: 13.5, fontWeight: l.active ? 700 : 500,
                  color: l.active ? "#cdd8ff" : "rgba(200,210,255,0.65)",
                  textDecoration: "none", whiteSpace: "nowrap", letterSpacing: "0.01em",
                  transition: "color 0.2s",
                }}
              >{l.label}</Link>
            ))}
          </nav>

          {/* Right side: User info + sign out */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {session?.user?.image && (
              <img
                src={session.user.image}
                alt={session.user.name ?? "User"}
                referrerPolicy="no-referrer"
                style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(77,127,255,0.5)", objectFit: "cover" }}
              />
            )}
            <span style={{ fontSize: 13, color: "rgba(200,210,255,0.7)", fontWeight: 500 }}>
              {session?.user?.name}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              style={{
                height: 34, padding: "0 16px", borderRadius: 10,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(200,210,255,0.7)", fontSize: 12.5, fontWeight: 600,
                cursor: "pointer", fontFamily: "'Inter', sans-serif",
              }}
            >Sign out</button>
          </div>
        </div>
      </header>

      {/* ══ MAIN ══ */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 20px 90px" }}>

        {/* Back link */}
        <div style={{ width: "100%", maxWidth: 680, marginBottom: 22 }}>
          <Link href="/home" style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            fontSize: 13, fontWeight: 600, color: "rgba(200,210,255,0.6)", textDecoration: "none",
          }}>← Back to dashboard</Link>
        </div>

        {/* ══ SECTION: TEST A SCOUT ══ */}
        <div style={{ width: "100%", maxWidth: 680, animation: "floatUp 0.6s cubic-bezier(0.16,1,0.3,1) both" }}>
          <SectionHeader
            eyebrow="Test a scout · Live web"
            title="Test a"
            highlight="new scout"
            subtitle="Enter any topic, choose a language and voice tone, then generate an instant audio briefing — exactly what your scout will deliver on autopilot."
          />
        </div>

        {/* ── Generator Card ── */}
        <div style={{
          width: "100%", maxWidth: 680,
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 24, padding: "36px 36px 32px",
          boxShadow: "0 0 80px rgba(77,127,255,0.08), 0 32px 64px rgba(0,0,0,0.35)",
          backdropFilter: "blur(20px)",
          animation: "floatUp 0.75s 0.1s cubic-bezier(0.16,1,0.3,1) both",
        }}>
          {/* Input row */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <input
              id="topic-input"
              type="text"
              placeholder="e.g.  Artificial Intelligence, Climate Change, Crypto…"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleGenerate()}
              disabled={isLoading}
              style={{
                flex: 1, height: 52, borderRadius: 14,
                background: "rgba(255,255,255,0.045)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#f0f2ff", fontSize: 15, padding: "0 20px",
                outline: "none", fontFamily: "'Inter', sans-serif",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
              onFocus={e => {
                e.target.style.borderColor = "rgba(77,127,255,0.5)";
                e.target.style.boxShadow = "0 0 0 3px rgba(77,127,255,0.1)";
              }}
              onBlur={e => {
                e.target.style.borderColor = "rgba(255,255,255,0.1)";
                e.target.style.boxShadow = "none";
              }}
            />
            <button
              id="generate-btn"
              onClick={handleGenerate}
              disabled={isLoading || !topic.trim()}
              style={{
                height: 52, padding: "0 28px", borderRadius: 14,
                background: isLoading || !topic.trim()
                  ? "rgba(77,127,255,0.25)"
                  : "linear-gradient(135deg, #4d7fff, #8b5cf6)",
                border: "none", color: "#fff",
                fontSize: 14.5, fontWeight: 700,
                cursor: isLoading || !topic.trim() ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 9,
                whiteSpace: "nowrap", fontFamily: "'Inter', sans-serif",
                boxShadow: isLoading || !topic.trim() ? "none" : "0 0 28px rgba(77,127,255,0.4), 0 4px 16px rgba(0,0,0,0.3)",
                transition: "all 0.2s",
              }}
            >
              {isLoading ? <><Spinner /> Generating…</> : "🎙 Generate Audio"}
            </button>
          </div>

          {/* ── Language & voice-tone pickers ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 24 }}>
            {/* Language */}
            <div>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                color: "rgba(160,175,220,0.55)", marginBottom: 10,
              }}>🌐 Language</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {LANGS.map(l => {
                  const on = lang === l.code;
                  return (
                    <button
                      key={l.code} type="button" onClick={() => setLang(l.code)} disabled={isLoading}
                      style={{
                        padding: "7px 15px", borderRadius: 999, fontSize: 12.5, fontWeight: 600,
                        cursor: isLoading ? "not-allowed" : "pointer", fontFamily: "'Inter', sans-serif",
                        background: on ? "rgba(77,127,255,0.16)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${on ? "rgba(77,127,255,0.5)" : "rgba(255,255,255,0.1)"}`,
                        color: on ? "#cdd8ff" : "rgba(200,210,255,0.6)",
                        boxShadow: on ? "0 0 14px rgba(77,127,255,0.18)" : "none",
                        transition: "all 0.18s",
                      }}
                    >{l.label}</button>
                  );
                })}
              </div>
            </div>

            {/* Voice tone + live test */}
            <div>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 12, flexWrap: "wrap", marginBottom: 10,
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                  color: "rgba(160,175,220,0.55)",
                }}>🎙️ Voice tone</div>
                <button
                  type="button" onClick={testVoice}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 7,
                    padding: "6px 14px", borderRadius: 999,
                    background: voiceTesting ? "rgba(246,183,60,0.18)" : "rgba(246,183,60,0.10)",
                    border: "1px solid rgba(246,183,60,0.32)", color: "#fcd581",
                    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif",
                    transition: "all 0.18s",
                  }}
                >{voiceTesting ? "◼ Stop" : "🔊 Test voice"}</button>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {TONES.map(t => {
                  const on = tone === t.name;
                  return (
                    <button
                      key={t.name} type="button" onClick={() => setTone(t.name)} disabled={isLoading}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "7px 15px", borderRadius: 999, fontSize: 12.5, fontWeight: 600,
                        cursor: isLoading ? "not-allowed" : "pointer", fontFamily: "'Inter', sans-serif",
                        background: on ? "rgba(139,92,246,0.16)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${on ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.1)"}`,
                        color: on ? "#d9ccff" : "rgba(200,210,255,0.6)",
                        boxShadow: on ? "0 0 14px rgba(139,92,246,0.18)" : "none",
                        transition: "all 0.18s",
                      }}
                    ><span>{t.icon}</span> {t.name}</button>
                  );
                })}
              </div>
              <div style={{ fontSize: 11, color: "rgba(160,175,220,0.4)", marginTop: 9 }}>
                Tap “Test voice” to preview the selected language &amp; tone in your browser before generating.
              </div>
            </div>
          </div>

          {/* Progress */}
          {(isLoading || step === 4) && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[{ n: 1, label: "Fetch" }, { n: 2, label: "Summarize" }, { n: 3, label: "Audio" }].map(({ n, label }) => {
                  const done = step > n; const active = step === n;
                  return (
                    <div key={n} style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "5px 13px", borderRadius: 999, fontSize: 11.5, fontWeight: 600,
                      background: done ? "rgba(52,211,153,0.12)" : active ? "rgba(77,127,255,0.15)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${done ? "rgba(52,211,153,0.3)" : active ? "rgba(77,127,255,0.35)" : "rgba(255,255,255,0.07)"}`,
                      color: done ? "#34d399" : active ? "#4d7fff" : "rgba(160,175,220,0.5)",
                      transition: "all 0.3s",
                    }}>
                      {done ? "✓" : active ? <Spinner /> : n} {label}
                    </div>
                  );
                })}
              </div>
              <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 99,
                  background: "linear-gradient(90deg, #4d7fff, #8b5cf6)",
                  width: progressWidth, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                  boxShadow: "0 0 10px rgba(77,127,255,0.5)",
                }} />
              </div>
              <span style={{ fontSize: 12, color: "rgba(160,175,220,0.5)" }}>{STEP_LABELS[step]}</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: "rgba(255,70,70,0.07)", border: "1px solid rgba(255,70,70,0.2)",
              borderRadius: 14, padding: "14px 18px", marginBottom: 20,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#ff7070", marginBottom: 4 }}>⚠ Generation failed</div>
              <div style={{ fontSize: 13, color: "rgba(200,210,255,0.65)" }}>{error}</div>
            </div>
          )}

          {/* Audio result */}
          {audioUrl && step === 4 && (
            <div style={{
              background: "rgba(77,127,255,0.06)", border: "1px solid rgba(77,127,255,0.18)",
              borderRadius: 18, padding: "22px 24px",
              display: "flex", flexDirection: "column", gap: 18,
              animation: "floatUp 0.5s cubic-bezier(0.16,1,0.3,1) both",
            }}>
              {/* Player header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: "linear-gradient(135deg, rgba(77,127,255,0.25), rgba(139,92,246,0.2))",
                  border: "1px solid rgba(77,127,255,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, flexShrink: 0,
                }}>🎙️</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#4d7fff" }}>Audio Briefing Ready</div>
                  <div style={{ fontSize: 12, color: "rgba(160,175,220,0.5)", marginTop: 2 }}>{audioName}</div>
                </div>
                <div style={{
                  marginLeft: "auto", background: "rgba(52,211,153,0.1)",
                  border: "1px solid rgba(52,211,153,0.3)", borderRadius: 999,
                  padding: "4px 12px", fontSize: 11, fontWeight: 600, color: "#34d399",
                }}>✓ Ready</div>
              </div>

              <Waveform active />
              <audio ref={audioRef} src={audioUrl} controls style={{ width: "100%", accentColor: "#4d7fff" }} />

              {/* Action buttons row */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  id="download-btn"
                  onClick={handleDownload}
                  style={{
                    flex: 1, height: 48, borderRadius: 12,
                    background: "linear-gradient(135deg, #4d7fff, #8b5cf6)",
                    border: "none", color: "#fff",
                    fontSize: 14.5, fontWeight: 700, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    fontFamily: "'Inter', sans-serif",
                    boxShadow: "0 0 24px rgba(77,127,255,0.35), 0 4px 16px rgba(0,0,0,0.3)",
                  }}
                >⬇ Download MP3</button>

                {/* Send to Telegram — only if connected */}
                {tgConnected && (
                  <button
                    id="send-telegram-btn"
                    onClick={handleSendTelegram}
                    disabled={tgSending}
                    style={{
                      flex: 1, height: 48, borderRadius: 12,
                      background: tgSent
                        ? "linear-gradient(135deg, #34d399, #10b981)"
                        : tgSending
                        ? "rgba(42,171,238,0.25)"
                        : "linear-gradient(135deg, #2AABEE, #229ED9)",
                      border: "none", color: "#fff",
                      fontSize: 14.5, fontWeight: 700,
                      cursor: tgSending ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      fontFamily: "'Inter', sans-serif",
                      boxShadow: tgSending ? "none" : "0 0 24px rgba(42,171,238,0.35), 0 4px 16px rgba(0,0,0,0.3)",
                      transition: "all 0.25s ease",
                    }}
                  >
                    {tgSent ? <>✓ Sent!</> : tgSending ? <><Spinner /> Sending…</> : <><TelegramIcon size={16} /> Send to Telegram</>}
                  </button>
                )}
              </div>

              {/* Telegram send error */}
              {tgError && (
                <div style={{
                  background: "rgba(255,70,70,0.07)", border: "1px solid rgba(255,70,70,0.2)",
                  borderRadius: 10, padding: "10px 14px", fontSize: 12.5, color: "#ff7070",
                }}>⚠ {tgError}</div>
              )}

              {/* Not connected → point to dashboard delivery section */}
              {!tgConnected && (
                <Link
                  href="/home#delivery"
                  style={{
                    width: "100%", height: 40, borderRadius: 10,
                    background: "rgba(42,171,238,0.06)",
                    border: "1px dashed rgba(42,171,238,0.25)",
                    color: "rgba(42,171,238,0.8)",
                    fontSize: 12.5, fontWeight: 600, textDecoration: "none",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  }}
                >
                  <TelegramIcon size={14} color="currentColor" />
                  Connect Telegram on your dashboard to send audio directly
                </Link>
              )}
            </div>
          )}

          {step === 0 && !error && (
            <p style={{ margin: 0, fontSize: 12.5, color: "rgba(160,175,220,0.45)", textAlign: "center" }}>
              Typical generation takes 15–45 seconds · Powered by LangChain + Tavily + Neural TTS
            </p>
          )}
        </div>
      </main>

      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.055)", padding: "20px 32px",
        textAlign: "center", fontSize: 12, color: "rgba(160,175,220,0.4)",
      }}>
        © {new Date().getFullYear()} ScoutlyAI · Personal AI scouts for the entire web
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
        @keyframes floatUp {
          from { opacity: 0; transform: translateY(22px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes wave-bar {
          from { opacity: 0.6; transform: scaleY(0.4); }
          to { opacity: 1; transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}
