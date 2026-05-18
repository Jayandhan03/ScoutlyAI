"use client";

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

type Step = 0 | 1 | 2 | 3 | 4;
const STEP_LABELS: Record<number, string> = {
  1: "Fetching latest articles…",
  2: "Summarizing with AI…",
  3: "Generating audio briefing…",
  4: "Done!",
};

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [topic, setTopic]         = useState("");
  const [step, setStep]           = useState<Step>(0);
  const [audioUrl, setAudioUrl]   = useState<string | null>(null);
  const [audioName, setAudioName] = useState("news_audio.mp3");
  const [error, setError]         = useState<string | null>(null);
  const audioRef                  = useRef<HTMLAudioElement>(null);

  // Auth guard — redirect to sign-in if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/signin");
    }
  }, [status, router]);

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

          {/* User info + sign out */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
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
              <button
                id="download-btn"
                onClick={handleDownload}
                style={{
                  width: "100%", height: 48, borderRadius: 12,
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
            </div>
          )}

          {step === 0 && !error && (
            <p style={{ margin: 0, fontSize: 12.5, color: "rgba(160,175,220,0.45)", textAlign: "center" }}>
              Typical generation takes 15–45 seconds · Powered by LangChain + Tavily + Neural TTS
            </p>
          )}
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
        input::placeholder { color: rgba(160,175,220,0.35); }
      `}</style>
    </div>
  );
}
