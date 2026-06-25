"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

/* ── Animated waveform ── */
function Waveform() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "3px", height: 72 }}>
      {Array.from({ length: 64 }).map((_, i) => (
        <div
          key={i}
          className="waveform-bar"
          style={{
            animationDelay: `${(i * 0.04) % 1.4}s`,
            height: `${Math.floor(Math.random() * 52 + 10)}px`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Waitlist email capture (wired to /api/waitlist) ── */
function WaitlistForm({ source, variant = "card" }: { source: string; variant?: "card" | "footer" }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "loading") return;
    setState("loading");
    setMessage("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setState("done");
        setMessage(data.message ?? "You're on the list!");
        setEmail("");
      } else {
        setState("error");
        setMessage(data.error ?? "Something went wrong. Try again.");
      }
    } catch {
      setState("error");
      setMessage("Network error. Please try again.");
    }
  };

  if (variant === "footer") {
    return (
      <>
        <form className="footer-subscribe" onSubmit={submit}>
          <input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <button type="submit" aria-label="Join waitlist">{state === "loading" ? "…" : "→"}</button>
        </form>
        <p style={{ fontSize: 12, color: state === "error" ? "#fb7185" : "var(--text-muted)", margin: "8px 0 0", lineHeight: 1.6 }}>
          {message || "Be first to deploy your scouts. Early access + product updates."}
        </p>
      </>
    );
  }

  return (
    <form className="waitlist-form" onSubmit={submit}>
      <input
        type="email"
        placeholder="you@email.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <button type="submit" className="btn-outline" disabled={state === "loading"}>
        {state === "loading" ? "Joining…" : state === "done" ? "Joined ✓" : "Join the Waitlist"}
      </button>
      {message && (
        <span className="waitlist-msg" style={{ color: state === "error" ? "#fb7185" : "var(--emerald)" }}>
          {message}
        </span>
      )}
    </form>
  );
}

const stats = [
  { value: "24/7", label: "Continuous monitoring" },
  { value: "∞", label: "Topics to scout" },
  { value: "20+", label: "Languages & voices" },
  { value: "< 2s", label: "Briefing delivery" },
];

/* Life aspects your scouts cover */
const domains = ["Finance", "Jobs", "Law", "Business", "Tech", "Health", "Real Estate", "Sports", "Crypto", "Politics"];

const scouts = [
  { icon: "💹", title: "Finance & Markets", desc: "Stocks, crypto, earnings and macro moves — the moment they break.", accent: "#34d399" },
  { icon: "💼", title: "Jobs & Careers", desc: "Fresh roles, hiring trends and openings matched to your profile.", accent: "#4d7fff" },
  { icon: "⚖️", title: "Law & Policy", desc: "Regulations, rulings and legal shifts that actually affect you.", accent: "#8b5cf6" },
  { icon: "🏢", title: "Business & Startups", desc: "Funding rounds, competitors, deals and industry movements.", accent: "#38bdf8" },
  { icon: "🧬", title: "Tech & Science", desc: "Product launches, research breakthroughs and the next big thing.", accent: "#f472b6" },
  { icon: "🏥", title: "Health & Wellness", desc: "Studies, advisories and trends for a smarter, healthier you.", accent: "#fb923c" },
  { icon: "🏡", title: "Real Estate", desc: "Listings, mortgage rates and market moves in your area.", accent: "#facc15" },
  { icon: "⚽", title: "Sports & Culture", desc: "Scores, transfers and the stories you genuinely care about.", accent: "#22d3ee" },
];

const features = [
  { icon: "🛰️", title: "Build Your Own Scouts", desc: "Spin up a scout for any topic, source or question. It watches the web around the clock so you never have to.", accent: "#4d7fff" },
  { icon: "⚡", title: "Real-Time Monitoring", desc: "Scouts track thousands of sources continuously and surface what's new the instant it matters.", accent: "#8b5cf6" },
  { icon: "💬", title: "Delivered Where You Are", desc: "Audio briefings land natively in Telegram & WhatsApp — no new app to install, no extra tab.", accent: "#38bdf8" },
  { icon: "🌍", title: "Your Language, 20+ Options", desc: "Get briefed in your language with ultra-realistic neural text-to-speech voices.", accent: "#34d399" },
  { icon: "🎙️", title: "Custom Voice Tones", desc: "Professional, casual, energetic or calm — pick the voice and tone that fits your vibe.", accent: "#f472b6" },
  { icon: "⏱️", title: "On Your Schedule", desc: "Real-time, hourly, twice-daily or a custom rhythm. You decide how often your scouts report in.", accent: "#fb923c" },
];

const languages = ["English", "Español", "हिन्दी", "Français", "Deutsch", "العربية", "中文", "Português"];
const tones = ["Professional", "Casual", "Energetic", "Calm", "Concise"];
const frequencies = ["Real-time", "Hourly", "Twice daily", "Daily", "Weekly", "Custom"];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [activeFreq, setActiveFreq] = useState("Daily");
  const { data: session, status } = useSession();
  useEffect(() => setMounted(true), []);

  const handleSignIn = () => signIn("google", { callbackUrl: "/home" });

  return (
    <div className="landing-root">

      {/* ══ NAVBAR ══ */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <span className="logo-dot" />
            ScoutlyAI
          </div>

          <nav className="landing-nav-links">
            <a href="#scouts">Scouts</a>
            <a href="#delivery">Delivery</a>
            <a href="#schedule">Schedule</a>
            <a href="#how-it-works">How it works</a>
          </nav>

          <div className="landing-nav-actions">
            {status === "loading" ? null : session ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {session.user?.image && (
                    <img
                      src={session.user.image}
                      alt={session.user.name ?? "User"}
                      referrerPolicy="no-referrer"
                      style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(77,127,255,0.55)", objectFit: "cover" }}
                    />
                  )}
                  <span style={{ fontSize: "0.84rem", color: "rgba(200,210,255,0.75)", fontWeight: 500 }}>
                    {session.user?.name}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="nav-login"
                    style={{ cursor: "pointer", background: "none", border: "none", color: "inherit" }}
                  >
                    Sign out
                  </button>
                </div>
                <Link href="/home" className="nav-cta">Open App →</Link>
              </>
            ) : (
              <>
                <Link href="/signin" className="nav-login">Log In</Link>
                <button
                  id="google-signup-btn"
                  onClick={handleSignIn}
                  className="nav-cta"
                  style={{ cursor: "pointer" }}
                >
                  Deploy a Scout →
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ══ HERO ══ */}
      <section className="hero-section">
        <div className="hero-badge">
          <span className="badge-dot" />
          Personal AI intelligence for every aspect of life
        </div>

        <h1 className="hero-title">
          Deploy AI Scouts to<br />
          <span className="hero-highlight">Monitor the Entire Web.</span>
        </h1>

        <p className="hero-sub">
          ScoutlyAI is your personal virtual assistant for everything that matters —
          finance, jobs, law, business and beyond. Create custom scouts that watch the web 24/7
          and keep you updated with the most current intel as crisp audio briefings.
        </p>

        <div className="hero-actions">
          {session ? (
            <Link href="/home" className="btn-primary">Open App →</Link>
          ) : (
            <button
              id="hero-google-signin-btn"
              onClick={handleSignIn}
              className="btn-primary"
              style={{ cursor: "pointer" }}
            >
              Deploy Your First Scout →
            </button>
          )}
          <a href="#how-it-works" className="btn-secondary">See How It Works</a>
        </div>

        {/* Stats strip */}
        <div style={{
          display: "flex", gap: 40, flexWrap: "wrap", justifyContent: "center",
          padding: "28px 0 8px", borderTop: "1px solid rgba(255,255,255,0.06)", width: "100%", marginTop: 8
        }}>
          {stats.map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{
                fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800,
                letterSpacing: "-0.03em",
                background: "linear-gradient(135deg, #4d7fff, #8b5cf6)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Waveform player */}
        <div className="hero-player">
          <div className="player-glow" />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "linear-gradient(135deg, #4d7fff, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, boxShadow: "0 0 16px rgba(77,127,255,0.5)"
            }}>🛰️</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                Finance Scout — Morning Briefing
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                Generated 2 min ago · 3:42 · English · Professional tone
              </div>
            </div>
            <div style={{
              marginLeft: "auto", background: "rgba(52,211,153,0.1)",
              border: "1px solid rgba(52,211,153,0.3)", borderRadius: "999px",
              padding: "4px 12px", fontSize: 11, fontWeight: 600, color: "var(--emerald)"
            }}>● LIVE</div>
          </div>

          {mounted && <Waveform />}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20 }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>0:00</span>
            <div className="play-btn-wrap" style={{ margin: 0 }}>
              <button className="play-btn" aria-label="Play demo">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>3:42</span>
          </div>
        </div>
      </section>

      {/* ══ DOMAIN MARQUEE ══ */}
      <div className="domain-bar">
        <div className="domain-track">
          {[...domains, ...domains].map((d, i) => (
            <span key={i} className="domain-chip">
              <span className="domain-dot" />
              {d}
            </span>
          ))}
        </div>
      </div>

      {/* ══ SCOUTS / CATEGORIES ══ */}
      <section id="scouts" className="features-section">
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{
            display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "var(--accent)", marginBottom: 14,
            padding: "5px 16px", background: "var(--accent-dim)", border: "1px solid var(--accent-border)",
            borderRadius: "999px"
          }}>One scout for every part of your life</div>
          <h2 style={{
            fontFamily: "var(--font-display)", fontSize: "clamp(28px,4vw,44px)",
            fontWeight: 800, letterSpacing: "-0.035em", margin: 0, lineHeight: 1.15
          }}>Personal intelligence,<br /><span className="hero-highlight">across everything you care about.</span></h2>
          <p style={{ maxWidth: 560, margin: "18px auto 0", fontSize: 15, lineHeight: 1.7, color: "var(--text-secondary)" }}>
            Deploy as many scouts as you want. Each one keeps watch over a slice of your world and
            briefs you with the latest, most relevant updates — in audio.
          </p>
        </div>

        <div className="scout-grid">
          {scouts.map(s => (
            <div className="scout-card" key={s.title}>
              <div className="scout-icon" style={{ background: `${s.accent}18`, border: `1px solid ${s.accent}30` }}>{s.icon}</div>
              <h3 className="feature-title">{s.title}</h3>
              <p className="feature-desc">{s.desc}</p>
              <span className="scout-tag" style={{ color: s.accent }}>● Scout active</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section id="features" className="features-section" style={{ paddingTop: 0 }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{
            display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "var(--violet)", marginBottom: 14,
            padding: "5px 16px", background: "var(--violet-dim)", border: "1px solid rgba(139,92,246,0.22)",
            borderRadius: "999px"
          }}>What makes ScoutlyAI different</div>
          <h2 style={{
            fontFamily: "var(--font-display)", fontSize: "clamp(28px,4vw,44px)",
            fontWeight: 800, letterSpacing: "-0.035em", margin: 0, lineHeight: 1.15
          }}>Intelligence built for<br /><span className="hero-highlight">how you actually live.</span></h2>
        </div>

        <div className="features-grid">
          {features.map(f => (
            <div className="feature-pill" key={f.title}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, marginBottom: 18,
                background: `${f.accent}18`, border: `1px solid ${f.accent}30`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22
              }}>{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ DELIVERY / INTEGRATION ══ */}
      <section id="delivery" className="briefing-section">
        <div className="briefing-text">
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            color: "var(--cyan)", marginBottom: 18,
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "5px 14px", background: "var(--cyan-dim)",
            border: "1px solid var(--cyan-border)", borderRadius: "999px"
          }}>Connect your scouts</div>
          <h2 className="briefing-title">
            Your scouts speak your language —<br />
            <span className="hero-highlight">on the chat app you already use.</span>
          </h2>
          <p className="briefing-desc">
            Link your scouts to <strong style={{ color: "var(--text-primary)" }}>Telegram</strong> and{" "}
            <strong style={{ color: "var(--text-primary)" }}>WhatsApp</strong> and receive studio-quality
            audio briefings right in your threads. Tune every detail to your preferences — the language
            you think in and the voice tone that suits the moment.
          </p>

          <div className="channel-badges">
            <span className="channel-chip"><span className="channel-ic">✈️</span> Telegram</span>
            <span className="channel-chip"><span className="channel-ic">💬</span> WhatsApp</span>
          </div>

          <div className="pref-block">
            <div className="pref-label">Languages</div>
            <div className="pref-chips">
              {languages.map(l => <span key={l} className="pref-chip">{l}</span>)}
            </div>
          </div>

          <div className="pref-block">
            <div className="pref-label">Voice tones</div>
            <div className="pref-chips">
              {tones.map(t => <span key={t} className="pref-chip pref-chip--tone">{t}</span>)}
            </div>
          </div>
        </div>

        <div className="briefing-mock">
          <div className="mock-card">
            <div className="mock-header">
              <div className="mock-avatar" />
              <div>
                <div className="mock-name">ScoutlyAI · Finance Scout</div>
                <div className="mock-status">● Online</div>
              </div>
              <div style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)" }}>9:00 AM</div>
            </div>
            <div className="mock-body">
              <div className="mock-bubble">
                <div className="mock-bubble-title">
                  🛰️ Good morning! Your Finance Scout spotted 3 market-moving updates overnight.
                </div>
              </div>
              <div className="mock-audio-pill">
                <div className="pill-play">▶</div>
                <div className="pill-wave">
                  {Array.from({ length: 22 }).map((_, i) => (
                    <div key={i} className="pill-bar" style={{ height: `${Math.floor(Math.random() * 18 + 4)}px` }} />
                  ))}
                </div>
                <div className="pill-time">0:45 / 3:12</div>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", paddingLeft: 4 }}>
                🌐 English · 🎙️ Professional tone · ✈️ via Telegram
              </div>
              <div className="mock-input-row">
                <div className="mock-input">Ask your scout for more detail…</div>
                <div className="mock-mic">🎤</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SCHEDULE ══ */}
      <section id="schedule" className="briefing-section" style={{ direction: "rtl" }}>
        <div className="briefing-text" style={{ direction: "ltr" }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            color: "var(--emerald)", marginBottom: 18,
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "5px 14px", background: "var(--emerald-dim)",
            border: "1px solid rgba(52,211,153,0.24)", borderRadius: "999px"
          }}>Your rhythm, your rules</div>
          <h2 className="briefing-title">
            You set the cadence.<br />
            <span className="hero-highlight">Your scouts keep the time.</span>
          </h2>
          <p className="briefing-desc">
            Want a briefing the second something breaks? Or a calm summary once a day with your coffee?
            Pick exactly how often each scout reports in — and set the times that fit your schedule.
            ScoutlyAI handles the rest, automatically.
          </p>

          <div className="freq-pills">
            {frequencies.map(f => (
              <button
                key={f}
                className={`freq-pill${activeFreq === f ? " freq-pill--active" : ""}`}
                onClick={() => setActiveFreq(f)}
                type="button"
              >
                {f}
              </button>
            ))}
          </div>

          <ul className="briefing-list" style={{ listStyle: "none", padding: 0, marginTop: 26 }}>
            {[
              "Per-scout delivery frequency",
              "Pick your exact preferred times",
              "Quiet hours — no pings while you sleep",
              "Instant on-demand briefings anytime",
            ].map(item => (
              <li key={item} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14.5, color: "var(--text-secondary)" }}>
                <span style={{
                  width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, #34d399, #4d7fff)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10
                }}>✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="briefing-mock" style={{ direction: "ltr" }}>
          <div className="schedule-card">
            <div className="schedule-head">
              <span style={{ fontSize: 18 }}>⏱️</span>
              <div>
                <div className="mock-name">Delivery Schedule</div>
                <div className="mock-status" style={{ color: "var(--accent)" }}>● {activeFreq}</div>
              </div>
            </div>
            <div className="schedule-rows">
              {[
                { scout: "💹 Finance Scout", time: "8:00 AM · 6:00 PM", freq: "Twice daily" },
                { scout: "💼 Jobs Scout", time: "9:00 AM", freq: "Daily" },
                { scout: "⚖️ Law & Policy", time: "Mon · 7:30 AM", freq: "Weekly" },
                { scout: "🏢 Business Scout", time: "As it happens", freq: "Real-time" },
              ].map(r => (
                <div className="schedule-row" key={r.scout}>
                  <div>
                    <div className="schedule-scout">{r.scout}</div>
                    <div className="schedule-time">{r.time}</div>
                  </div>
                  <span className="schedule-freq">{r.freq}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section id="how-it-works" className="steps-section">
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{
            display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "var(--accent)", marginBottom: 14,
            padding: "5px 16px", background: "var(--accent-dim)", border: "1px solid var(--accent-border)",
            borderRadius: "999px"
          }}>How it works</div>
          <h2 style={{
            fontFamily: "var(--font-display)", fontSize: "clamp(28px,4vw,44px)",
            fontWeight: 800, letterSpacing: "-0.035em", margin: 0, lineHeight: 1.15
          }}>From idea to audio briefing<br /><span className="hero-highlight">in three quick steps.</span></h2>
        </div>

        <div className="steps-grid">
          {[
            { n: "01", icon: "🛰️", title: "Create a scout", desc: "Tell ScoutlyAI what to watch — a market, a job board, a legal beat or any topic on your mind." },
            { n: "02", icon: "🎛️", title: "Set your preferences", desc: "Choose language, voice tone, delivery channel (Telegram or WhatsApp) and how often you want updates." },
            { n: "03", icon: "🎧", title: "Get audio briefings", desc: "Sit back. Your scouts monitor the web 24/7 and send concise audio briefings right on schedule." },
          ].map(s => (
            <div className="step-card" key={s.n}>
              <div className="step-num">{s.n}</div>
              <div className="step-icon">{s.icon}</div>
              <h3 className="feature-title">{s.title}</h3>
              <p className="feature-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section id="pricing" className="cta-section">
        <div className="cta-card">
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            color: "var(--emerald)", background: "var(--emerald-dim)",
            border: "1px solid rgba(52,211,153,0.24)", borderRadius: "999px",
            padding: "5px 16px", marginBottom: 24
          }}>
            Free to start — no card required
          </div>
          <h2 className="cta-title">Deploy your first scout today.</h2>
          <p className="cta-sub">
            Stop scrolling endless feeds. Let your personal AI scouts watch the web and brief you on
            everything that matters — in your language, your voice and your schedule.
          </p>
          <div className="cta-actions">
            {session ? (
              <Link href="/home" className="btn-primary">Open Your Dashboard →</Link>
            ) : (
              <button
                id="cta-signin-btn"
                onClick={handleSignIn}
                className="btn-primary"
                style={{ cursor: "pointer" }}
              >
                Continue with Google →
              </button>
            )}
          </div>
          <div style={{ marginTop: 28 }}>
            <WaitlistForm source="landing-cta" />
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="landing-logo">
              <span className="logo-dot" />
              ScoutlyAI
            </div>
            <p>Your personal AI scouts, monitoring the entire web — turning the latest intel across every aspect of your life into on-demand audio briefings.</p>
            <div className="footer-social">
              <a href="#">Twitter/X</a>
              <a href="#">LinkedIn</a>
              <a href="#">GitHub</a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Product</h4>
            <a href="#scouts">Scouts</a>
            <a href="#delivery">Delivery</a>
            <a href="#schedule">Schedule</a>
            <a href="#how-it-works">How it works</a>
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            <a href="#">About Us</a>
            <a href="#">Our Blog</a>
            <a href="#">Careers</a>
            <a href="#">Press</a>
          </div>

          <div className="footer-col">
            <h4>Join the waitlist</h4>
            <WaitlistForm source="footer" variant="footer" />
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} ScoutlyAI. All rights reserved.</span>
          <span>
            <a href="#">Privacy Policy</a>
            {" · "}
            <a href="#">Terms of Service</a>
            {" · "}
            <a href="#">Cookie Policy</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
