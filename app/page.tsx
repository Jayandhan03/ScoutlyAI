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

const stats = [
  { value: "50k+", label: "Daily listeners" },
  { value: "120+", label: "News sources" },
  { value: "20+", label: "Languages" },
  { value: "< 2s", label: "Delivery speed" },
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
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
            YourNews
          </div>

          <nav className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#pricing">Pricing</a>
          </nav>

          <div className="landing-nav-actions">
            {status === "loading" ? null : session ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {session.user?.image && (
                    <img
                      src={session.user.image}
                      alt={session.user.name ?? "User"}
                      style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(108,143,255,0.55)", objectFit: "cover" }}
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
                  Get Started →
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
          AI-powered audio news platform
        </div>

        <h1 className="hero-title">
          Your Daily News,<br />
          <span className="hero-highlight">Delivered as Audio.</span>
        </h1>

        <p className="hero-sub">
          Receive personalized AI-curated news briefings directly to WhatsApp or Telegram.
          Listen while you commute, exercise, or start your morning ritual.
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
              Get Started Free →
            </button>
          )}
          <a href="#how-it-works" className="btn-secondary">View Demo</a>
        </div>

        {/* Stats strip */}
        <div style={{
          display: "flex", gap: 40, flexWrap: "wrap", justifyContent: "center",
          padding: "28px 0 8px", borderTop: "1px solid rgba(255,255,255,0.06)", width: "100%", marginTop: 8
        }}>
          {stats.map(s => (
            <div key={s.value} style={{ textAlign: "center" }}>
              <div style={{
                fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800,
                letterSpacing: "-0.03em",
                background: "linear-gradient(135deg, #6c8fff, #a78bfa)",
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
              background: "linear-gradient(135deg, #6c8fff, #a78bfa)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, boxShadow: "0 0 16px rgba(108,143,255,0.5)"
            }}>📡</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                Morning Briefing — AI Edition
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                Generated 2 min ago · 3:42 duration
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

      {/* ══ TECH BAR ══ */}
      <div style={{
        background: "rgba(108,143,255,0.04)",
        borderTop: "1px solid var(--border-subtle)",
        borderBottom: "1px solid var(--border-subtle)",
        padding: "20px 28px",
        position: "relative", zIndex: 1,
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 48, flexWrap: "wrap"
        }}>
          {["Powered by LangChain + Tavily", "Neural TTS via Google Cloud", "WhatsApp & Telegram native", "Zero-latency audio pipeline"].map(t => (
            <span key={t} style={{
              fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)",
              display: "flex", alignItems: "center", gap: 8, letterSpacing: "0.01em"
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: "50%",
                background: "var(--accent)", display: "inline-block",
                boxShadow: "0 0 6px var(--accent)"
              }} />
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* ══ FEATURES ══ */}
      <section id="features" className="features-section">
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{
            display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "var(--accent)", marginBottom: 14,
            padding: "5px 16px", background: "var(--accent-dim)", border: "1px solid var(--accent-border)",
            borderRadius: "999px"
          }}>What makes us different</div>
          <h2 style={{
            fontFamily: "var(--font-display)", fontSize: "clamp(28px,4vw,44px)",
            fontWeight: 800, letterSpacing: "-0.035em", margin: 0, lineHeight: 1.15
          }}>Intelligence built for<br /><span className="hero-highlight">how you actually live.</span></h2>
        </div>

        <div className="features-grid">
          {[
            { icon: "🎛️", title: "Deep Customization", desc: "Select your favorite topics, trusted sources and use AI to tailor a news feed that matches your morning routine perfectly.", accent: "#6c8fff" },
            { icon: "⚡", title: "Instant Delivery", desc: "No delays. Our AI processes and generates your audio briefing in real-time, delivered the moment it's ready.", accent: "#a78bfa" },
            { icon: "💬", title: "Native Chat Experience", desc: "No new apps. Works natively in WhatsApp or Telegram with interactive voice chat controls right in your thread.", accent: "#38bdf8" },
            { icon: "🧠", title: "Adaptive Intelligence", desc: "The more you listen, the smarter your briefing becomes. Our AI learns your preferences and optimizes your feed.", accent: "#34d399" },
            { icon: "🌍", title: "20+ Languages", desc: "Receive your briefings in any of 20+ supported languages with ultra-realistic neural text-to-speech voices.", accent: "#f472b6" },
            { icon: "📊", title: "Source Analytics", desc: "Full transparency on your news sources. Track reliability scores, publication history, and bias ratings.", accent: "#fb923c" },
          ].map(f => (
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

      {/* ══ HOW IT WORKS ══ */}
      <section id="how-it-works" className="briefing-section">
        <div className="briefing-text">
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            color: "var(--violet)", marginBottom: 18,
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "5px 14px", background: "var(--violet-dim)",
            border: "1px solid rgba(167,139,250,0.22)", borderRadius: "999px"
          }}>How it works</div>
          <h2 className="briefing-title">
            The briefing you&apos;ll<br />
            <span className="hero-highlight">actually look forward to.</span>
          </h2>
          <p className="briefing-desc">
            Seamlessly integrated into your existing chat threads. YourNews AI sends you a clean,
            studio-quality audio file every morning — or whenever you request an update.
          </p>
          <ul className="briefing-list" style={{ listStyle: "none", padding: 0 }}>
            {[
              "High-fidelity neural text-to-speech",
              "Supports 20+ global languages",
              "Variable playback speeds",
              "Instant on-demand regeneration",
            ].map(item => (
              <li key={item} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14.5, color: "var(--text-secondary)" }}>
                <span style={{
                  width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, #6c8fff, #a78bfa)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10
                }}>✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="briefing-mock">
          <div className="mock-card">
            <div className="mock-header">
              <div className="mock-avatar" />
              <div>
                <div className="mock-name">YourNews AI</div>
                <div className="mock-status">● Online</div>
              </div>
              <div style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)" }}>9:00 AM</div>
            </div>
            <div className="mock-body">
              <div className="mock-bubble">
                <div className="mock-bubble-title">
                  🌅 Good morning! Here is your personalized briefing for today
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
                3 articles · AI, Climate, Finance
              </div>
              <div className="mock-input-row">
                <div className="mock-input">Ask for more on any topic…</div>
                <div className="mock-mic">🎤</div>
              </div>
            </div>
          </div>
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
            Free forever — no card required
          </div>
          <h2 className="cta-title">Start Listening Today.</h2>
          <p className="cta-sub">
            Stop scrolling. Start listening. Join 50,000+ professionals who stay informed
            through our audio-first, AI-powered news platform.
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
            <a href="#" className="btn-outline">Join the Waitlist</a>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="landing-logo">
              <span className="logo-dot" />
              YourNews
            </div>
            <p>Transforming how we consume information through cutting-edge AI audio generation and real-time personalized intelligence.</p>
            <div className="footer-social">
              <a href="#">Twitter/X</a>
              <a href="#">LinkedIn</a>
              <a href="#">GitHub</a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#how-it-works">Voice Link</a>
            <a href="#">Integrations</a>
            <a href="#">Changelog</a>
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            <a href="#">About Us</a>
            <a href="#">Our Blog</a>
            <a href="#">Careers</a>
            <a href="#">Press</a>
          </div>

          <div className="footer-col">
            <h4>Stay in the loop</h4>
            <div className="footer-subscribe">
              <input type="email" placeholder="Your email address" />
              <button>→</button>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
              Weekly digest of product updates and new features.
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} YourNews AI. All rights reserved.</span>
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
