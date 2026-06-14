"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

type TelegramUser = {
  id: number;
  first_name: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

declare global {
  interface Window {
    onTelegramAuth: (user: TelegramUser) => void;
  }
}

/* ── Animated waveform bars ── */
function Waveform({ active }: { active: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, height: 40 }}>
      {Array.from({ length: 32 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 3, borderRadius: 99,
            background: "linear-gradient(180deg, #6c8fff, #a78bfa)",
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

type Step = 0 | 1 | 2 | 3 | 4;
const STEP_LABELS: Record<number, string> = {
  1: "Fetching latest articles…",
  2: "Summarizing with AI…",
  3: "Generating audio briefing…",
  4: "Done!",
};

const TELEGRAM_BOT_USERNAME = "UrnewsAI_bot";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [topic, setTopic]         = useState("");
  const [step, setStep]           = useState<Step>(0);
  const [audioUrl, setAudioUrl]   = useState<string | null>(null);
  const [audioName, setAudioName] = useState("news_audio.mp3");
  const [error, setError]         = useState<string | null>(null);
  const audioRef                  = useRef<HTMLAudioElement>(null);

  /* ── Telegram state ── */
  const [showTgModal, setShowTgModal] = useState(false);
  const [tgConnected, setTgConnected] = useState(false);
  const [tgUsername, setTgUsername]   = useState<string | null>(null);
  const [tgSending, setTgSending]     = useState(false);
  const [tgSent, setTgSent]           = useState(false);
  const [tgError, setTgError]         = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/signin");
  }, [status, router]);

  /* ── Check Telegram connection on mount (via session email) ── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/telegram-auth");
        if (res.ok) {
          const data = await res.json();
          if (data.connected) {
            setTgConnected(true);
            setTgUsername(data.username ?? data.first_name ?? null);
          }
        }
      } catch { /* silent */ }
    })();
  }, []);

  /* ── Inject Telegram Login Widget when modal opens ── */
  useEffect(() => {
    if (!showTgModal || tgConnected) return;

    window.onTelegramAuth = async (user: TelegramUser) => {
      console.log("[TelegramAuth] callback fired:", user);
      try {
        const res = await fetch("/api/telegram-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        });
        const data = await res.json();
        console.log("[TelegramAuth] server response:", data);
        if (data.success) {
          setTgConnected(true);
          setTgUsername(user.username ?? user.first_name ?? null);
        } else {
          setTgError(data.error ?? "Telegram auth failed");
        }
      } catch (e: any) {
        console.error("[TelegramAuth] error:", e);
        setTgError("Connection error — please try again");
      }
    };

    const container = document.getElementById("tg-widget-container");
    if (!container) return;
    container.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", TELEGRAM_BOT_USERNAME);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    // No data-request-access — keeps it as simple login only (one confirmation step)
    script.async = true;
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
      // @ts-ignore
      delete window.onTelegramAuth;
    };
  }, [showTgModal, tgConnected]);

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

      const res = await fetch("/api/send-telegram", {
        method: "POST",
        body: formData,
      });

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
        body: JSON.stringify({ topic: q, limit: 5, voice_id: "en", model_id: "" }),
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

  const progressWidth =
    step === 1 ? "25%" : step === 2 ? "58%" : step === 3 ? "84%" : "100%";

  // Loading / auth check screen
  if (status === "loading" || status === "unauthenticated") {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#070711",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          border: "3px solid rgba(108,143,255,0.2)", borderTopColor: "#6c8fff",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(108,143,255,0.13) 0%, transparent 70%), #070711",
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
          <a href="/" style={{
            display: "flex", alignItems: "center", gap: 10, textDecoration: "none",
            fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 800,
            letterSpacing: "-0.02em", color: "#f0f2ff",
          }}>
            <span style={{
              width: 9, height: 9, borderRadius: "50%", display: "inline-block",
              background: "linear-gradient(135deg, #6c8fff, #a78bfa)",
              boxShadow: "0 0 12px rgba(108,143,255,0.7)",
              animation: "pulse 2.5s ease-in-out infinite",
            }} />
            YourNews
          </a>

          {/* Right side: User info + sign out */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* User info */}
            {session?.user?.image && (
              <img
                src={session.user.image}
                alt={session.user.name ?? "User"}
                style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(108,143,255,0.5)", objectFit: "cover" }}
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
                transition: "all 0.2s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)";
                (e.currentTarget as HTMLButtonElement).style.color = "#f0f2ff";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(200,210,255,0.7)";
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ══ MAIN ══ */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px" }}>

        {/* Welcome greeting */}
        <div style={{
          textAlign: "center", maxWidth: 700,
          animation: "floatUp 0.65s cubic-bezier(0.16,1,0.3,1) both",
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "#34d399",
            background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.22)",
            borderRadius: 999, padding: "5px 16px", marginBottom: 28,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%", display: "inline-block",
              background: "#34d399", boxShadow: "0 0 8px #34d399",
              animation: "pulse 2s ease-in-out infinite",
            }} />
            Welcome back, {session?.user?.name?.split(" ")[0]}!
          </div>

          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(34px, 5vw, 54px)", fontWeight: 800,
            letterSpacing: "-0.04em", lineHeight: 1.07, margin: "0 0 20px",
          }}>
            Turn Any Topic Into<br />
            <span style={{
              background: "linear-gradient(135deg, #6c8fff 0%, #a78bfa 55%, #38bdf8 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              an Audio Briefing.
            </span>
          </h1>

          <p style={{
            fontSize: 16.5, lineHeight: 1.75, color: "rgba(200,210,255,0.65)",
            margin: "0 auto 44px", maxWidth: 520,
          }}>
            Enter a topic — AI fetches the latest news, writes a broadcast-style script,
            and converts it to an MP3 you can download instantly.
          </p>
        </div>

        {/* ── Generator Card ── */}
        <div style={{
          width: "100%", maxWidth: 680,
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 24, padding: "36px 36px 32px",
          boxShadow: "0 0 80px rgba(108,143,255,0.08), 0 32px 64px rgba(0,0,0,0.35)",
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
                e.target.style.borderColor = "rgba(108,143,255,0.5)";
                e.target.style.boxShadow = "0 0 0 3px rgba(108,143,255,0.1)";
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
                  ? "rgba(108,143,255,0.25)"
                  : "linear-gradient(135deg, #6c8fff, #a78bfa)",
                border: "none", color: "#fff",
                fontSize: 14.5, fontWeight: 700,
                cursor: isLoading || !topic.trim() ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 9,
                whiteSpace: "nowrap", fontFamily: "'Inter', sans-serif",
                boxShadow: isLoading || !topic.trim() ? "none" : "0 0 28px rgba(108,143,255,0.4), 0 4px 16px rgba(0,0,0,0.3)",
                transition: "all 0.2s",
              }}
            >
              {isLoading ? <><Spinner /> Generating…</> : "🎙 Generate Audio"}
            </button>
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
                      background: done ? "rgba(52,211,153,0.12)" : active ? "rgba(108,143,255,0.15)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${done ? "rgba(52,211,153,0.3)" : active ? "rgba(108,143,255,0.35)" : "rgba(255,255,255,0.07)"}`,
                      color: done ? "#34d399" : active ? "#6c8fff" : "rgba(160,175,220,0.5)",
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
                  background: "linear-gradient(90deg, #6c8fff, #a78bfa)",
                  width: progressWidth, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                  boxShadow: "0 0 10px rgba(108,143,255,0.5)",
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
              background: "rgba(108,143,255,0.06)", border: "1px solid rgba(108,143,255,0.18)",
              borderRadius: 18, padding: "22px 24px",
              display: "flex", flexDirection: "column", gap: 18,
              animation: "floatUp 0.5s cubic-bezier(0.16,1,0.3,1) both",
            }}>
              {/* Player header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: "linear-gradient(135deg, rgba(108,143,255,0.25), rgba(167,139,250,0.2))",
                  border: "1px solid rgba(108,143,255,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, flexShrink: 0,
                }}>🎙️</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#6c8fff" }}>Audio Briefing Ready</div>
                  <div style={{ fontSize: 12, color: "rgba(160,175,220,0.5)", marginTop: 2 }}>{audioName}</div>
                </div>
                <div style={{
                  marginLeft: "auto", background: "rgba(52,211,153,0.1)",
                  border: "1px solid rgba(52,211,153,0.3)", borderRadius: 999,
                  padding: "4px 12px", fontSize: 11, fontWeight: 600, color: "#34d399",
                }}>✓ Ready</div>
              </div>

              <Waveform active />
              <audio ref={audioRef} src={audioUrl} controls style={{ width: "100%", accentColor: "#6c8fff" }} />

              {/* Action buttons row */}
              <div style={{ display: "flex", gap: 10 }}>
                {/* Download button */}
                <button
                  id="download-btn"
                  onClick={handleDownload}
                  style={{
                    flex: 1, height: 48, borderRadius: 12,
                    background: "linear-gradient(135deg, #6c8fff, #a78bfa)",
                    border: "none", color: "#fff",
                    fontSize: 14.5, fontWeight: 700, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    fontFamily: "'Inter', sans-serif",
                    boxShadow: "0 0 24px rgba(108,143,255,0.35), 0 4px 16px rgba(0,0,0,0.3)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 40px rgba(108,143,255,0.55), 0 8px 20px rgba(0,0,0,0.3)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 24px rgba(108,143,255,0.35), 0 4px 16px rgba(0,0,0,0.3)";
                  }}
                >
                  ⬇ Download MP3
                </button>

                {/* Send to Telegram button — only if connected */}
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
                      boxShadow: tgSending
                        ? "none"
                        : "0 0 24px rgba(42,171,238,0.35), 0 4px 16px rgba(0,0,0,0.3)",
                      transition: "all 0.25s ease",
                    }}
                    onMouseEnter={e => {
                      if (!tgSending) {
                        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px rgba(42,171,238,0.55), 0 8px 20px rgba(0,0,0,0.3)";
                      }
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                      if (!tgSending) {
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 0 24px rgba(42,171,238,0.35), 0 4px 16px rgba(0,0,0,0.3)";
                      }
                    }}
                  >
                    {tgSent ? (
                      <>✓ Sent!</>
                    ) : tgSending ? (
                      <><Spinner /> Sending…</>
                    ) : (
                      <><TelegramIcon size={16} /> Send to Telegram</>
                    )}
                  </button>
                )}
              </div>

              {/* Telegram send error */}
              {tgError && (
                <div style={{
                  background: "rgba(255,70,70,0.07)",
                  border: "1px solid rgba(255,70,70,0.2)",
                  borderRadius: 10, padding: "10px 14px",
                  fontSize: 12.5, color: "#ff7070",
                }}>
                  ⚠ {tgError}
                </div>
              )}

              {/* Telegram not connected hint — shown inside audio result card */}
              {!tgConnected && (
                <button
                  onClick={() => setShowTgModal(true)}
                  style={{
                    width: "100%", height: 40, borderRadius: 10,
                    background: "rgba(42,171,238,0.06)",
                    border: "1px dashed rgba(42,171,238,0.25)",
                    color: "rgba(42,171,238,0.7)",
                    fontSize: 12.5, fontWeight: 600,
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    fontFamily: "'Inter', sans-serif",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(42,171,238,0.1)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(42,171,238,0.4)";
                    (e.currentTarget as HTMLElement).style.color = "#2AABEE";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(42,171,238,0.06)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(42,171,238,0.25)";
                    (e.currentTarget as HTMLElement).style.color = "rgba(42,171,238,0.7)";
                  }}
                >
                  <TelegramIcon size={14} color="currentColor" />
                  Connect Telegram to send audio directly
                </button>
              )}
            </div>
          )}

          {step === 0 && !error && (
            <p style={{ margin: 0, fontSize: 12.5, color: "rgba(160,175,220,0.45)", textAlign: "center" }}>
              Typical generation takes 15–45 seconds · Powered by LangChain + Tavily + Neural TTS
            </p>
          )}
        </div>

        {/* ── Telegram Integration Section ── */}
        <div style={{
          width: "100%", maxWidth: 680, marginTop: 40,
          background: "rgba(42,171,238,0.04)",
          border: "1px solid rgba(42,171,238,0.12)",
          borderRadius: 22, padding: "36px 32px",
          backdropFilter: "blur(16px)",
          animation: "floatUp 0.85s 0.15s cubic-bezier(0.16,1,0.3,1) both",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Subtle glow accent */}
          <div style={{
            position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)",
            width: 300, height: 120, borderRadius: "50%",
            background: "rgba(42,171,238,0.08)", filter: "blur(50px)",
            pointerEvents: "none",
          }} />

          {/* Telegram icon badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 56, height: 56, borderRadius: 18,
            background: "linear-gradient(135deg, #2AABEE, #229ED9)",
            boxShadow: "0 0 32px rgba(42,171,238,0.35), 0 4px 16px rgba(0,0,0,0.2)",
            marginBottom: 20, position: "relative",
          }}>
            <TelegramIcon size={28} color="#fff" />
          </div>

          {/* Heading */}
          <h2 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(20px, 3.5vw, 26px)", fontWeight: 800,
            letterSpacing: "-0.03em", lineHeight: 1.2,
            margin: "0 0 10px", color: "#f0f2ff",
          }}>
            Get Audio News Directly{" "}
            <span style={{
              background: "linear-gradient(135deg, #2AABEE, #38bdf8)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>on Telegram</span>
          </h2>

          {/* Description */}
          <p style={{
            fontSize: 14.5, lineHeight: 1.7, color: "rgba(200,210,255,0.6)",
            margin: "0 auto 24px", maxWidth: 480,
          }}>
            Receive your AI-curated audio briefings with preferred timely updates —
            delivered straight to your Telegram chat. No extra apps, just tap and listen.
          </p>

          {/* Feature pills */}
          <div style={{
            display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap",
            marginBottom: 26,
          }}>
            {[
              { icon: "⏰", text: "Scheduled updates" },
              { icon: "🎧", text: "Instant delivery" },
              { icon: "🔔", text: "Custom alerts" },
            ].map(({ icon, text }) => (
              <div key={text} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: 999,
                background: "rgba(42,171,238,0.08)",
                border: "1px solid rgba(42,171,238,0.18)",
                fontSize: 12, fontWeight: 600, color: "rgba(42,171,238,0.85)",
              }}>
                <span>{icon}</span> {text}
              </div>
            ))}
          </div>

          {/* Connect / Status button */}
          {tgConnected ? (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "14px 28px", borderRadius: 16,
              background: "rgba(52,211,153,0.08)",
              border: "1px solid rgba(52,211,153,0.25)",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: "rgba(52,211,153,0.15)",
                border: "1px solid rgba(52,211,153,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16,
              }}>✓</div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#34d399" }}>
                  Telegram Connected
                </div>
                <div style={{ fontSize: 12, color: "rgba(200,210,255,0.55)", marginTop: 1 }}>
                  {tgUsername ? `@${tgUsername}` : "Your account is linked"} · Audio will be sent after generation
                </div>
              </div>
            </div>
          ) : (
            <button
              id="telegram-connect-section-btn"
              onClick={() => setShowTgModal(true)}
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
                height: 52, padding: "0 32px", borderRadius: 14,
                background: "linear-gradient(135deg, #2AABEE, #229ED9)",
                border: "none", color: "#fff",
                fontSize: 15, fontWeight: 700,
                fontFamily: "'Inter', sans-serif",
                cursor: "pointer",
                boxShadow: "0 0 30px rgba(42,171,238,0.4), 0 4px 16px rgba(0,0,0,0.3)",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 44px rgba(42,171,238,0.55), 0 8px 20px rgba(0,0,0,0.3)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px rgba(42,171,238,0.4), 0 4px 16px rgba(0,0,0,0.3)";
              }}
            >
              <TelegramIcon size={18} color="#fff" />
              Connect with Telegram
            </button>
          )}

          {/* Privacy note */}
          <p style={{
            margin: "18px 0 0", fontSize: 11.5, color: "rgba(160,175,220,0.35)",
          }}>
            🔒 We only access your chat ID — never your messages or contacts.
          </p>
        </div>

        {/* How it works strip */}
        <div style={{
          marginTop: 52, display: "flex", gap: 32, flexWrap: "wrap",
          justifyContent: "center", maxWidth: 680,
          animation: "floatUp 0.8s 0.2s cubic-bezier(0.16,1,0.3,1) both",
        }}>
          {[
            { icon: "🔍", label: "Fetch", desc: "Latest articles via Tavily" },
            { icon: "🧠", label: "Summarize", desc: "Broadcast script via AI" },
            { icon: "🔊", label: "Synthesize", desc: "Neural TTS audio" },
            { icon: "⬇", label: "Download", desc: "MP3 straight to you" },
          ].map(({ icon, label, desc }) => (
            <div key={label} style={{ textAlign: "center", flex: "0 0 120px" }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: "rgba(108,143,255,0.08)", border: "1px solid rgba(108,143,255,0.18)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, margin: "0 auto 10px",
              }}>{icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f2ff", marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 11.5, color: "rgba(160,175,220,0.5)" }}>{desc}</div>
            </div>
          ))}
        </div>
      </main>

      {/* ══ TELEGRAM CONNECT MODAL ══ */}
      {showTgModal && (
        <div
          id="telegram-modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) setShowTgModal(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
            animation: "fadeIn 0.25s ease both",
          }}
        >
          <div
            id="telegram-modal"
            style={{
              width: "100%", maxWidth: 480,
              background: "rgba(18,18,35,0.95)",
              border: "1px solid rgba(42,171,238,0.2)",
              borderRadius: 24, padding: "32px 30px 28px",
              boxShadow: "0 0 80px rgba(42,171,238,0.12), 0 32px 64px rgba(0,0,0,0.5)",
              animation: "modalSlideUp 0.35s cubic-bezier(0.16,1,0.3,1) both",
              position: "relative",
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setShowTgModal(false)}
              style={{
                position: "absolute", top: 16, right: 16,
                width: 32, height: 32, borderRadius: "50%",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(160,175,220,0.5)", fontSize: 16,
                cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)";
                (e.currentTarget as HTMLElement).style.color = "#fff";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                (e.currentTarget as HTMLElement).style.color = "rgba(160,175,220,0.5)";
              }}
            >✕</button>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: "linear-gradient(135deg, #2AABEE, #229ED9)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 30px rgba(42,171,238,0.3)",
                flexShrink: 0,
              }}>
                <TelegramIcon size={28} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Syne', sans-serif", letterSpacing: "-0.02em" }}>
                  Connect Telegram
                </div>
                <div style={{ fontSize: 13, color: "rgba(200,210,255,0.65)", marginTop: 2 }}>
                  Get audio briefings sent directly to you
                </div>
              </div>
            </div>

            {/* Connection status */}
            {tgConnected ? (
              <div style={{
                background: "rgba(52,211,153,0.08)",
                border: "1px solid rgba(52,211,153,0.25)",
                borderRadius: 16, padding: "20px 22px",
                marginBottom: 20,
                animation: "floatUp 0.4s cubic-bezier(0.16,1,0.3,1) both",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 12,
                    background: "rgba(52,211,153,0.15)",
                    border: "1px solid rgba(52,211,153,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18,
                  }}>✓</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#34d399" }}>
                      Connected!
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(200,210,255,0.65)" }}>
                      {tgUsername ? `@${tgUsername}` : "Your Telegram account"}
                    </div>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(200,210,255,0.65)", lineHeight: 1.6 }}>
                  You can now send generated audio briefings directly to your Telegram.
                  Use the &quot;Send to Telegram&quot; button after generating audio.
                </p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 13.5, color: "rgba(200,210,255,0.6)", lineHeight: 1.65, marginBottom: 20 }}>
                  Click the button below and confirm in Telegram. No extra steps required.
                </p>
                {/* Telegram Login Widget injects here */}
                <div
                  id="tg-widget-container"
                  style={{ display: "flex", justifyContent: "center", minHeight: 52, marginBottom: 8 }}
                />
              </>
            )}

            {/* Footer note */}
            <div style={{
              marginTop: 20, paddingTop: 16,
              borderTop: "1px solid rgba(255,255,255,0.06)",
              fontSize: 11.5, color: "rgba(160,175,220,0.4)",
              textAlign: "center", lineHeight: 1.6,
            }}>
              🔒 We only receive your Telegram chat ID — no access to your messages or contacts.
            </div>
          </div>
        </div>
      )}

      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.055)", padding: "20px 32px",
        textAlign: "center", fontSize: 12, color: "rgba(160,175,220,0.4)",
      }}>
        © {new Date().getFullYear()} YourNews AI · AI-powered audio news
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');
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
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        input::placeholder { color: rgba(160,175,220,0.35); }
      `}</style>
    </div>
  );
}
