"use client";

import { useState, useRef } from "react";

/* ─── Design tokens ─── */
const C = {
    accent: "var(--accent)",
    accent2: "var(--accent-2)",
    violet: "var(--violet)",
    cyan: "var(--cyan)",
    emerald: "var(--emerald)",
    accentDim: "var(--accent-dim)",
    accentBorder: "var(--accent-border)",
    cardBg: "var(--bg-card)",
    cardBorder: "var(--border-subtle)",
    textPrimary: "var(--text-primary)",
    textSecondary: "var(--text-secondary)",
    textMuted: "var(--text-muted)",
} as const;

/* ─── Shared button styles ─── */
const gradBtn: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "14px 30px", borderRadius: 999,
    background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
    color: "#fff", fontSize: 14.5, fontWeight: 700,
    border: "none", cursor: "pointer", whiteSpace: "nowrap",
    boxShadow: "0 0 28px rgba(108,143,255,0.35), 0 4px 16px rgba(0,0,0,0.3)",
    transition: "transform 0.2s, box-shadow 0.2s",
    minWidth: 160, justifyContent: "center",
    fontFamily: "var(--font-body)", letterSpacing: "0.01em",
};
const ghostBtn: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "14px 28px", borderRadius: 999,
    background: "rgba(255,255,255,0.04)", backdropFilter: "blur(8px)",
    border: "1px solid var(--border-mid)",
    color: "var(--text-secondary)", fontSize: 14.5, fontWeight: 600,
    cursor: "pointer", fontFamily: "var(--font-body)",
    transition: "background 0.2s, border-color 0.2s, color 0.2s, transform 0.2s",
};

/* ─── API response types ─── */
interface GenerateNewsRes {
    success: boolean;
    news?: string;
    error?: string;
}
interface SummarizeRes {
    success: boolean;
    topic?: string;
    article_count?: number;
    summary?: string;
    error?: string;
}

type PipelineStep = 0 | 1 | 2 | 3 | 4;

function parseBullets(text: string): string[] {
    const lines = text.split("\n");
    const out: string[] = [];
    let cur = "";
    for (const line of lines) {
        const t = line.trim();
        if (!t) continue;
        const isBullet = /^[-•*▶►]\s/.test(t) || /^\d+[.)]\s/.test(t);
        if (isBullet) {
            if (cur) out.push(cur.trim());
            cur = t.replace(/^[-•*▶►]\s*/, "").replace(/^\d+[.)]\s*/, "");
        } else {
            cur += (cur ? " " : "") + t;
        }
    }
    if (cur) out.push(cur.trim());
    return out.filter(b => b.length > 10);
}

/* ─── Spinner ─── */
function Spinner({ light = false }: { light?: boolean }) {
    return (
        <span style={{
            display: "inline-block", width: 15, height: 15, borderRadius: "50%",
            border: `2px solid ${light ? "rgba(255,255,255,0.2)" : "rgba(108,143,255,0.2)"}`,
            borderTopColor: light ? "#fff" : "var(--accent)",
            animation: "spin 0.7s linear infinite", flexShrink: 0,
        }} />
    );
}

/* ─── Module cards config ─── */
const MODULES = [
    { icon: "🎛️", title: "Agent Studio", desc: "Customize your AI news agent — voice, personality, avatar, tone, and briefing style.", accent: "var(--accent)" },
    { icon: "📡", title: "Feed Engine", desc: "Select categories, control summary depth, and define your signal filters.", accent: "var(--violet)" },
    { icon: "🎙️", title: "Voice Delivery", desc: "Receive daily AI-generated voice briefings with your personalized news agent.", accent: "var(--cyan)" },
    { icon: "💬", title: "Channels", desc: "Deliver briefings via WhatsApp, Email, and future integrations.", accent: "var(--emerald)" },
    { icon: "📊", title: "Analytics", desc: "Track reading patterns, engagement, and content preferences over time.", accent: "#fb923c" },
    { icon: "⚙️", title: "Settings", desc: "Manage account preferences, notification timing, and system controls.", accent: "#f472b6" },
];

/* ─── Main component ─── */
export default function HomePage() {
    const [topic, setTopic] = useState("");
    const [step, setStep] = useState<PipelineStep>(0);
    const [genRes, setGenRes] = useState<GenerateNewsRes | null>(null);
    const [sumRes, setSumRes] = useState<SummarizeRes | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [audioName, setAudioName] = useState("news_audio.mp3");
    const [audioErr, setAudioErr] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    const handleGenerate = async () => {
        if (!topic.trim()) return;
        const q = topic.trim();

        setStep(1); setGenRes(null); setSumRes(null);
        setAudioUrl(null); setAudioErr(null);

        let gen: GenerateNewsRes;
        try {
            const r = await fetch("/api/generate-news", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic: q }),
            });
            gen = await r.json();
        } catch (e: any) {
            setGenRes({ success: false, error: e.message ?? "Network error" });
            setStep(0); return;
        }
        setGenRes(gen);
        if (!gen.success) { setStep(0); return; }

        setStep(2);
        let sum: SummarizeRes;
        try {
            const r = await fetch("/api/summarize-news", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic: q, limit: 5 }),
            });
            sum = await r.json();
        } catch (e: any) {
            sum = { success: false, error: e.message ?? "Summarize failed" };
        }
        setSumRes(sum);

        setStep(3);
        try {
            const r = await fetch("/api/news-audio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic: q, limit: 5, voice_id: "en", model_id: "" }),
            });
            if (r.ok) {
                const blob = await r.blob();
                const url = URL.createObjectURL(blob);
                const disp = r.headers.get("Content-Disposition") ?? "";
                const match = disp.match(/filename="?([^"]+)"?/);
                setAudioUrl(url);
                setAudioName(match ? match[1] : `${q.replace(/\s+/g, "_")}_news.mp3`);
                const articleCountHeader = r.headers.get("X-Article-Count");
                if (articleCountHeader) {
                    const newArticleCount = parseInt(articleCountHeader, 10);
                    setSumRes(prev =>
                        prev ? { ...prev, article_count: newArticleCount } : { success: true, article_count: newArticleCount }
                    );
                }
            } else {
                const err = await r.json().catch(() => ({ error: "Audio failed" }));
                setAudioErr(err.error ?? "Audio generation failed.");
            }
        } catch (e: any) {
            setAudioErr("Could not reach audio service.");
        }

        setStep(4);
    };

    const handleDownload = () => {
        if (!audioUrl) return;
        Object.assign(document.createElement("a"), { href: audioUrl, download: audioName }).click();
    };

    const isLoading = step > 0 && step < 4;
    const bullets = genRes?.news ? parseBullets(genRes.news) : [];
    const rawGenText = genRes?.news ?? "";

    const progressWidth = step === 1 ? "25%" : step === 2 ? "55%" : step === 3 ? "82%" : "100%";
    const progressLabel =
        step === 1 ? "Running news agent…"
            : step === 2 ? "Summarizing articles…"
                : step === 3 ? "Generating audio briefing…"
                    : "Complete";

    return (
        <div style={{
            maxWidth: 1100, margin: "0 auto", padding: "72px 28px 96px",
            display: "flex", flexDirection: "column", gap: 80,
        }}>

            {/* ★ HERO */}
            <section style={{
                textAlign: "center", display: "flex", flexDirection: "column",
                alignItems: "center", gap: 24,
                animation: "float-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
            }}>
                {/* Badge */}
                <div style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--emerald)", background: "var(--emerald-dim)",
                    border: "1px solid rgba(52,211,153,0.25)", borderRadius: 999, padding: "6px 16px",
                }}>
                    <span style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: "var(--emerald)", boxShadow: "0 0 8px var(--emerald)",
                        display: "inline-block", animation: "pulse-ring 2s ease-in-out infinite",
                    }} />
                    Personalized AI News Platform
                </div>

                {/* Title */}
                <h1 style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(40px, 6.5vw, 66px)", fontWeight: 800,
                    lineHeight: 1.06, letterSpacing: "-0.04em", margin: 0,
                    color: "var(--text-primary)",
                }}>
                    Your intelligence.<br />
                    <span style={{
                        background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 55%, var(--cyan) 100%)",
                        backgroundSize: "200% auto",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        animation: "shimmer 4s linear infinite",
                    }}>Your signal.</span>
                </h1>

                {/* Subtitle */}
                <p style={{
                    fontSize: 17, lineHeight: 1.72, color: C.textSecondary,
                    maxWidth: 560, margin: 0,
                }}>
                    YOUR News is a fully customizable AI-powered news layer. Build your own
                    news agent, define its voice and personality, and receive curated insights
                    across every channel you use daily.
                </p>

                {/* CTAs */}
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
                    <button style={gradBtn}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 44px rgba(108,143,255,0.6), 0 8px 20px rgba(0,0,0,0.3)";
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 28px rgba(108,143,255,0.35), 0 4px 16px rgba(0,0,0,0.3)";
                        }}
                    >Customize Your Agent</button>
                    <button style={ghostBtn}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)";
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.18)";
                            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-mid)";
                            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                        }}
                    >Explore Demo →</button>
                </div>

                <p style={{ fontSize: 12, color: C.textMuted, margin: 0, letterSpacing: "0.02em" }}>
                    Designed for founders, operators, and focused thinkers.
                </p>
            </section>

            {/* ★ GENERATE CARD */}
            <section style={{ display: "flex", flexDirection: "column", gap: 32, alignItems: "center" }}>
                <div className="home-generate-card">

                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                            width: 42, height: 42, borderRadius: 14,
                            background: "linear-gradient(135deg, rgba(108,143,255,0.2), rgba(167,139,250,0.15))",
                            border: "1px solid rgba(108,143,255,0.3)",
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
                        }}>⚡</div>
                        <div>
                            <h2 style={{
                                fontSize: 19, fontWeight: 700, margin: 0,
                                letterSpacing: "-0.02em", color: C.textPrimary
                            }}>
                                Generate My Latest News
                            </h2>
                            <p style={{ fontSize: 13, color: C.textMuted, margin: "3px 0 0" }}>
                                Powered by LangChain + Tavily + Grok
                            </p>
                        </div>
                    </div>

                    {/* Input + button */}
                    <div className="home-input-row">
                        <input
                            type="text"
                            className="home-input"
                            placeholder="Enter a topic (e.g. AI, Climate, Crypto)…"
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && !isLoading && handleGenerate()}
                            disabled={isLoading}
                        />
                        <button
                            className="home-gen-btn"
                            onClick={handleGenerate}
                            disabled={isLoading || !topic.trim()}
                        >
                            {isLoading ? (
                                <>
                                    <Spinner light />
                                    {step === 1 ? "Generating…" : step === 2 ? "Summarizing…" : "Audio…"}
                                </>
                            ) : "Generate News"}
                        </button>
                    </div>

                    {/* Pipeline progress */}
                    {(isLoading || step === 4) && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {/* Step pills */}
                            <div className="step-pills">
                                {[
                                    { n: 1, label: "Generate" },
                                    { n: 2, label: "Summarize" },
                                    { n: 3, label: "Audio" },
                                ].map(({ n, label }) => {
                                    const done = step > n;
                                    const active = step === n;
                                    const cls = done ? "step-pill--done" : active ? "step-pill--active" : "step-pill--idle";
                                    return (
                                        <div key={n} className={`step-pill ${cls}`}>
                                            {done ? "✓" : active ? <Spinner /> : n}
                                            {" "}{label}
                                        </div>
                                    );
                                })}
                            </div>
                            {/* Bar */}
                            <div className="home-progress-track">
                                <div className="home-progress-bar" style={{ width: progressWidth }} />
                            </div>
                            <span className="home-progress-label">{progressLabel}</span>
                        </div>
                    )}

                    {/* Error */}
                    {genRes && !genRes.success && (
                        <div style={{
                            background: "rgba(255,70,70,0.06)",
                            border: "1px solid rgba(255,70,70,0.22)", borderRadius: 14,
                            padding: "16px 20px"
                        }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#ff7070", marginBottom: 5 }}>
                                ⚠ Generation failed
                            </div>
                            <div style={{ fontSize: 13, color: C.textSecondary }}>{genRes.error}</div>
                        </div>
                    )}
                </div>

                {/* ★ RESULTS */}
                {(genRes?.success || sumRes?.success) && (
                    <div style={{ width: "100%", maxWidth: 880, display: "flex", flexDirection: "column", gap: 32 }}>

                        {/* Meta row */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                            <div style={{
                                display: "inline-flex", alignItems: "center", gap: 8,
                                padding: "6px 16px", borderRadius: 999,
                                background: C.accentDim, border: `1px solid ${C.accentBorder}`,
                                fontSize: 12.5, fontWeight: 600, color: C.accent
                            }}>
                                🗞 {sumRes?.topic ?? topic}
                            </div>
                            {(sumRes?.article_count ?? 0) > 0 && (
                                <span style={{
                                    fontSize: 12, color: C.textMuted,
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid var(--border-subtle)",
                                    padding: "4px 12px", borderRadius: 999
                                }}>
                                    {sumRes!.article_count} articles analysed
                                </span>
                            )}
                            <span style={{ fontSize: 12, color: C.textMuted, marginLeft: "auto" }}>
                                {new Date().toLocaleDateString("en-US", {
                                    weekday: "short", year: "numeric", month: "short", day: "numeric"
                                })}
                            </span>
                        </div>

                        {/* ── Agent News Feed ── */}
                        {genRes?.success && rawGenText && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div className="section-stripe" style={{
                                        background: "linear-gradient(180deg, var(--accent), var(--accent-2))"
                                    }} />
                                    <span style={{ fontSize: 13.5, fontWeight: 700, color: C.textPrimary, letterSpacing: "0.01em" }}>
                                        📰 Agent News Feed
                                    </span>
                                    <span style={{
                                        fontSize: 11, color: C.textMuted, marginLeft: 4,
                                        background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)",
                                        padding: "3px 10px", borderRadius: 999
                                    }}>
                                        via LangChain + Tavily + Grok
                                    </span>
                                </div>

                                {bullets.length > 1 ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                        {bullets.map((item, i) => (
                                            <div key={i} className="news-bullet-card">
                                                <div className="news-bullet-num">{i + 1}</div>
                                                <p style={{
                                                    margin: 0, fontSize: 14, lineHeight: 1.75,
                                                    color: "rgba(200,210,255,0.82)"
                                                }}>{item}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="home-news-output">{rawGenText}</div>
                                )}
                            </div>
                        )}

                        {/* ── Summary ── */}
                        {sumRes !== null && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                <hr className="section-divider" />

                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div className="section-stripe" style={{
                                        background: "linear-gradient(180deg, var(--violet), #f472b6)"
                                    }} />
                                    <span style={{ fontSize: 13.5, fontWeight: 700, color: C.textPrimary, letterSpacing: "0.01em" }}>
                                        🎙 YourNews Summary
                                    </span>
                                    <span style={{
                                        fontSize: 11, color: C.textMuted, marginLeft: 4,
                                        background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)",
                                        padding: "3px 10px", borderRadius: 999
                                    }}>
                                        broadcast-style · ready for audio
                                    </span>
                                </div>

                                {sumRes.success && sumRes.summary ? (
                                    <div className="summary-card">
                                        <span style={{
                                            position: "absolute", top: 18, right: 22,
                                            fontSize: 26, opacity: 0.12
                                        }}>🎙</span>
                                        <p style={{
                                            margin: 0, fontSize: 15, lineHeight: 1.88,
                                            color: "rgba(200,210,255,0.85)", fontStyle: "normal",
                                            letterSpacing: "0.01em",
                                        }}>
                                            {sumRes.summary}
                                        </p>
                                    </div>
                                ) : (
                                    <div style={{
                                        background: "rgba(251,146,60,0.06)",
                                        border: "1px solid rgba(251,146,60,0.2)", borderRadius: 14,
                                        padding: "14px 20px", fontSize: 13, color: "rgba(251,146,60,0.85)"
                                    }}>
                                        ⚠ Summarize step failed: {sumRes.error ?? "Unknown error"}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Audio error ── */}
                        {audioErr && (
                            <div style={{
                                background: "rgba(251,146,60,0.06)",
                                border: "1px solid rgba(251,146,60,0.2)", borderRadius: 14,
                                padding: "14px 20px", fontSize: 13.5, color: "rgba(251,146,60,0.85)"
                            }}>
                                🔇 Audio unavailable — {audioErr}
                            </div>
                        )}

                        {/* ── Audio player ── */}
                        {audioUrl && (
                            <div className="home-audio-row">
                                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "0 0 auto" }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 12,
                                        background: "linear-gradient(135deg, rgba(108,143,255,0.25), rgba(167,139,250,0.2))",
                                        border: "1px solid rgba(108,143,255,0.3)",
                                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
                                    }}>🎙️</div>
                                    <div>
                                        <div style={{ fontSize: 13.5, fontWeight: 700, color: C.accent }}>
                                            Audio Briefing
                                        </div>
                                        <div style={{ fontSize: 11, color: C.textMuted }}>MP3 · Neural TTS</div>
                                    </div>
                                </div>
                                <audio ref={audioRef} src={audioUrl} controls className="home-audio"
                                    style={{ accentColor: "var(--accent)" }} />
                                <button onClick={handleDownload} className="home-download-btn">
                                    ⬇ Download MP3
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* ★ PLATFORM MODULES */}
            <section className="home-modules">
                <div className="home-section-label">Platform Modules</div>
                <div className="home-modules-grid">
                    {MODULES.map(({ icon, title, desc, accent }) => (
                        <button key={title} className="app-card"
                            onMouseEnter={e => {
                                const el = e.currentTarget as HTMLElement;
                                el.style.borderColor = "rgba(108,143,255,0.28)";
                                el.style.transform = "translateY(-4px)";
                                el.style.background = "rgba(108,143,255,0.04)";
                                el.style.boxShadow = "0 8px 40px rgba(108,143,255,0.10)";
                            }}
                            onMouseLeave={e => {
                                const el = e.currentTarget as HTMLElement;
                                el.style.borderColor = "var(--border-subtle)";
                                el.style.transform = "translateY(0)";
                                el.style.background = "var(--bg-card)";
                                el.style.boxShadow = "none";
                            }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: 14,
                                background: `${accent}18`,
                                border: `1px solid ${accent}30`,
                                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22
                            }}>
                                {icon}
                            </div>
                            <h3 className="app-card-title">{title}</h3>
                            <p className="app-card-desc">{desc}</p>
                        </button>
                    ))}
                </div>
            </section>

            {/* ★ COMING SOON PLACEHOLDER */}
            <section className="home-preview">
                <div style={{
                    width: 56, height: 56, borderRadius: 18, opacity: 0.18,
                    background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26
                }}>📡</div>
                <span className="home-preview-text">Live feed preview coming soon</span>
                <span style={{
                    fontSize: 11, color: "var(--text-muted)", opacity: 0.6,
                    background: "rgba(108,143,255,0.06)", border: "1px solid var(--accent-border)",
                    borderRadius: 999, padding: "4px 14px"
                }}>Q2 2026</span>
            </section>

            <style>{`
              @keyframes spin { to { transform: rotate(360deg); } }
              @keyframes pulse-ring {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.45; transform: scale(1.35); }  
              }
              @keyframes float-up {
                from { opacity: 0; transform: translateY(24px); }
                to { opacity: 1; transform: translateY(0); }
              }
              @keyframes shimmer {
                0% { background-position: -200% center; }
                100% { background-position: 200% center; }
              }
              @keyframes progress-glow {
                0%, 100% { box-shadow: 0 0 8px rgba(108,143,255,0.35); }
                50% { box-shadow: 0 0 20px rgba(108,143,255,0.7), 0 0 40px rgba(167,139,250,0.35); }
              }
            `}</style>
        </div>
    );
}
