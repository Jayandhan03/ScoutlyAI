"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size, borderRadius: "50%",
      border: "2px solid rgba(255,255,255,0.25)", borderTopColor: "#fff",
      animation: "spin 0.7s linear infinite", flexShrink: 0,
    }} />
  );
}

function TelegramIcon({ size = 18, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.787l3.019-14.228c.309-1.239-.473-1.8-1.282-1.432z" fill={color}/>
    </svg>
  );
}

function SectionHeader({
  eyebrow, title, highlight, subtitle,
  color = "#2AABEE", dim = "rgba(42,171,238,0.1)", border = "rgba(42,171,238,0.28)",
}: {
  eyebrow: string; title: string; highlight?: string; subtitle?: string;
  color?: string; dim?: string; border?: string;
}) {
  return (
    <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 44px" }}>
      <div style={{
        display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase", color, marginBottom: 16,
        padding: "5px 16px", background: dim, border: `1px solid ${border}`, borderRadius: 999,
      }}>{eyebrow}</div>
      <h1 style={{
        fontFamily: "'Sora', sans-serif", fontSize: "clamp(28px, 4.4vw, 46px)",
        fontWeight: 800, letterSpacing: "-0.038em", margin: 0, lineHeight: 1.1, color: "#f0f2ff",
      }}>
        {title}
        {highlight && <>{" "}<span style={{
          background: "linear-gradient(135deg, #2AABEE 0%, #38bdf8 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        }}>{highlight}</span></>}
      </h1>
      {subtitle && <p style={{
        fontSize: 16, lineHeight: 1.7, color: "rgba(200,210,255,0.62)",
        maxWidth: 560, margin: "18px auto 0",
      }}>{subtitle}</p>}
    </div>
  );
}

const STEPS = [
  { title: "Tap “Connect”", desc: "We open a private chat with the ScoutlyAI bot in Telegram." },
  { title: "Press START in Telegram", desc: "That single tap securely links your account — no codes, no phone number." },
  { title: "You're all set", desc: "Audio briefings now arrive straight in your Telegram chat." },
];

export default function DeliveryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tgConnected, setTgConnected] = useState(false);
  const [tgUsername, setTgUsername]   = useState<string | null>(null);
  const [tgConnecting, setTgConnecting] = useState(false);
  const [tgTesting, setTgTesting]     = useState(false);
  const [tgTestSent, setTgTestSent]   = useState(false);
  const [tgError, setTgError]         = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/signin");
  }, [status, router]);

  // Check connection on mount
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

  // Poll while waiting for the user to press START
  useEffect(() => {
    if (!tgConnecting || tgConnected) return;
    const startedAt = Date.now();
    const id = setInterval(async () => {
      if (Date.now() - startedAt > 180_000) {
        clearInterval(id);
        setTgConnecting(false);
        setTgError("Timed out waiting for Telegram. Tap Connect to try again.");
        return;
      }
      try {
        const res = await fetch("/api/telegram-auth");
        if (res.ok) {
          const data = await res.json();
          if (data.connected) {
            clearInterval(id);
            setTgConnecting(false);
            setTgConnected(true);
            setTgUsername(data.username ?? data.first_name ?? null);
          }
        }
      } catch { /* keep polling */ }
    }, 2500);
    return () => clearInterval(id);
  }, [tgConnecting, tgConnected]);

  const handleConnect = async () => {
    setTgError(null);
    setTgConnecting(true);
    try {
      const res = await fetch("/api/telegram-auth", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.deepLink) {
        setTgConnecting(false);
        setTgError(data.error ?? "Could not start Telegram connection.");
        return;
      }
      window.open(data.deepLink, "_blank", "noopener,noreferrer");
    } catch {
      setTgConnecting(false);
      setTgError("Network error — please try again.");
    }
  };

  const handleDisconnect = async () => {
    setTgError(null);
    try { await fetch("/api/telegram-auth", { method: "DELETE" }); } catch { /* ignore */ }
    setTgConnected(false);
    setTgUsername(null);
    setTgConnecting(false);
    setTgTestSent(false);
  };

  const handleTest = async () => {
    if (tgTesting) return;
    setTgTesting(true);
    setTgError(null);
    setTgTestSent(false);
    try {
      const res = await fetch("/api/telegram-test", { method: "POST" });
      if (res.ok) {
        setTgTestSent(true);
        setTimeout(() => setTgTestSent(false), 4000);
      } else {
        const err = await res.json().catch(() => ({}));
        setTgError(err.error ?? "Test message failed.");
      }
    } catch {
      setTgError("Network error — please try again.");
    } finally {
      setTgTesting(false);
    }
  };

  // Stepper state
  const doneUpTo = tgConnected ? 3 : tgConnecting ? 1 : 0;
  const activeStep = tgConnected ? 0 : tgConnecting ? 2 : 1;

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#070a12" }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          border: "3px solid rgba(42,171,238,0.2)", borderTopColor: "#2AABEE",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(42,171,238,0.12) 0%, transparent 70%), #070a12",
      fontFamily: "'Inter', sans-serif",
    }}>

      {/* ══ NAVBAR ══ */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        borderBottom: "1px solid rgba(255,255,255,0.055)",
        backdropFilter: "blur(18px)", background: "rgba(7,7,17,0.75)", padding: "0 32px",
      }}>
        <div style={{ maxWidth: 1040, margin: "0 auto", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/home" style={{
            display: "flex", alignItems: "center", gap: 10, textDecoration: "none",
            fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", color: "#f0f2ff",
          }}>
            <span style={{
              width: 9, height: 9, borderRadius: "50%", display: "inline-block",
              background: "linear-gradient(135deg, #4d7fff, #8b5cf6)", boxShadow: "0 0 12px rgba(77,127,255,0.7)",
              animation: "pulse 2.5s ease-in-out infinite",
            }} />
            ScoutlyAI
          </Link>

          <nav className="home-nav-links" style={{ display: "flex", alignItems: "center", gap: 28 }}>
            {[
              { href: "/test-scout", label: "Test a Scout" },
              { href: "/delivery", label: "Delivery", active: true },
              { href: "/home#scouts", label: "My Scouts" },
              { href: "/home#how-it-works", label: "How it works" },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{
                fontSize: 13.5, fontWeight: l.active ? 700 : 500,
                color: l.active ? "#9fd8f5" : "rgba(200,210,255,0.65)",
                textDecoration: "none", whiteSpace: "nowrap", letterSpacing: "0.01em",
              }}>{l.label}</Link>
            ))}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {session?.user?.image && (
              <img src={session.user.image} alt={session.user.name ?? "User"} referrerPolicy="no-referrer"
                style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(42,171,238,0.5)", objectFit: "cover" }} />
            )}
            <span style={{ fontSize: 13, color: "rgba(200,210,255,0.7)", fontWeight: 500 }}>{session?.user?.name}</span>
            <button onClick={() => signOut({ callbackUrl: "/" })} style={{
              height: 34, padding: "0 16px", borderRadius: 10, background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)", color: "rgba(200,210,255,0.7)",
              fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif",
            }}>Sign out</button>
          </div>
        </div>
      </header>

      {/* ══ MAIN ══ */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 20px 90px" }}>

        {/* Back link */}
        <div style={{ width: "100%", maxWidth: 1000, marginBottom: 26 }}>
          <Link href="/home" style={{
            display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600,
            color: "rgba(200,210,255,0.6)", textDecoration: "none",
          }}>← Back to dashboard</Link>
        </div>

        <SectionHeader
          eyebrow="Delivery channel"
          title="Connect"
          highlight="Telegram"
          subtitle="Link your account once and your scouts deliver studio-quality audio briefings straight to your chat — scheduled or on demand. It takes about 15 seconds."
        />

        {/* Two-column: setup (left) + preview (right) */}
        <div className="delivery-grid" style={{ width: "100%", maxWidth: 1000 }}>

          {/* ── LEFT: Setup card ── */}
          <div style={{
            background: "rgba(255,255,255,0.025)", border: "1px solid rgba(42,171,238,0.18)",
            borderRadius: 24, padding: "34px 32px", backdropFilter: "blur(20px)",
            boxShadow: "0 0 80px rgba(42,171,238,0.07), 0 32px 64px rgba(0,0,0,0.35)",
            animation: "floatUp 0.7s cubic-bezier(0.16,1,0.3,1) both",
          }}>
            {/* Brand header */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                background: "linear-gradient(135deg, #2AABEE, #229ED9)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 28px rgba(42,171,238,0.4)",
              }}>
                <TelegramIcon size={28} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 800, fontFamily: "'Sora', sans-serif", letterSpacing: "-0.02em", color: "#f0f2ff" }}>
                  Telegram
                </div>
                <div style={{ fontSize: 12.5, color: "rgba(160,175,220,0.55)", marginTop: 2 }}>
                  Audio briefings, right in your chat
                </div>
              </div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 13px", borderRadius: 999,
                background: tgConnected ? "rgba(52,211,153,0.1)" : "rgba(160,175,220,0.08)",
                border: `1px solid ${tgConnected ? "rgba(52,211,153,0.3)" : "rgba(160,175,220,0.18)"}`,
                fontSize: 11, fontWeight: 700, color: tgConnected ? "#34d399" : "rgba(160,175,220,0.7)",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: tgConnected ? "#34d399" : "rgba(160,175,220,0.6)", boxShadow: tgConnected ? "0 0 8px #34d399" : "none" }} />
                {tgConnected ? "Connected" : tgConnecting ? "Connecting…" : "Not connected"}
              </div>
            </div>

            {/* Stepper */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 26 }}>
              {STEPS.map((s, i) => {
                const n = i + 1;
                const done = n <= doneUpTo;
                const active = n === activeStep;
                const isLast = i === STEPS.length - 1;
                return (
                  <div key={n} style={{ display: "flex", gap: 14 }}>
                    {/* Badge + connector */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 800,
                        background: done ? "linear-gradient(135deg, #2AABEE, #229ED9)" : active ? "rgba(42,171,238,0.15)" : "rgba(255,255,255,0.05)",
                        border: done ? "none" : active ? "1px solid rgba(42,171,238,0.5)" : "1px solid rgba(255,255,255,0.1)",
                        color: done ? "#fff" : active ? "#2AABEE" : "rgba(160,175,220,0.5)",
                        boxShadow: active && !done ? "0 0 14px rgba(42,171,238,0.25)" : "none",
                        transition: "all 0.3s",
                      }}>
                        {done ? "✓" : n}
                      </div>
                      {!isLast && <div style={{ width: 2, flex: 1, minHeight: 26, background: done ? "rgba(42,171,238,0.4)" : "rgba(255,255,255,0.08)", marginTop: 2, marginBottom: 2 }} />}
                    </div>
                    {/* Text */}
                    <div style={{ paddingBottom: isLast ? 0 : 16 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: active || done ? "#f0f2ff" : "rgba(200,210,255,0.7)" }}>{s.title}</div>
                      <div style={{ fontSize: 12.5, color: "rgba(160,175,220,0.55)", marginTop: 3, lineHeight: 1.55 }}>{s.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Action area ── */}
            {tgConnected ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderRadius: 16,
                  background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.25)",
                }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✓</div>
                  <div>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: "#34d399" }}>You're connected!</div>
                    <div style={{ fontSize: 12.5, color: "rgba(200,210,255,0.6)", marginTop: 1 }}>
                      {tgUsername ? `@${tgUsername}` : "Your Telegram account is linked"}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button onClick={handleTest} disabled={tgTesting} style={{
                    flex: 1, minWidth: 160, height: 46, borderRadius: 12,
                    background: tgTestSent ? "rgba(52,211,153,0.15)" : "rgba(42,171,238,0.12)",
                    border: `1px solid ${tgTestSent ? "rgba(52,211,153,0.4)" : "rgba(42,171,238,0.35)"}`,
                    color: tgTestSent ? "#34d399" : "#2AABEE", fontSize: 13.5, fontWeight: 700,
                    cursor: tgTesting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    fontFamily: "'Inter', sans-serif", transition: "all 0.2s",
                  }}>
                    {tgTestSent ? "✓ Test sent — check Telegram" : tgTesting ? <><Spinner /> Sending…</> : "Send test message"}
                  </button>
                  <button onClick={handleDisconnect} style={{
                    height: 46, padding: "0 20px", borderRadius: 12, background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,70,70,0.25)", color: "rgba(255,120,120,0.9)",
                    fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif",
                  }}>Disconnect</button>
                </div>
                <Link href="/home#scouts" style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 12,
                  background: "linear-gradient(135deg, #4d7fff, #8b5cf6)", color: "#fff", fontSize: 14, fontWeight: 700,
                  textDecoration: "none", boxShadow: "0 0 24px rgba(77,127,255,0.3)",
                }}>Set up auto-briefing schedule →</Link>
              </div>
            ) : tgConnecting ? (
              <div style={{
                background: "rgba(42,171,238,0.06)", border: "1px solid rgba(42,171,238,0.2)",
                borderRadius: 16, padding: "22px 20px", textAlign: "center",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12 }}>
                  <Spinner /><span style={{ fontSize: 14.5, fontWeight: 700, color: "#2AABEE" }}>Waiting for Telegram…</span>
                </div>
                <p style={{ margin: "0 0 16px", fontSize: 13, color: "rgba(200,210,255,0.65)", lineHeight: 1.65 }}>
                  A chat with our bot just opened. Press <strong style={{ color: "#fff" }}>START</strong> there — this page updates automatically the moment you do.
                </p>
                <button onClick={handleConnect} style={{
                  height: 40, padding: "0 18px", borderRadius: 10, background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(42,171,238,0.3)", color: "#2AABEE", fontSize: 12.5, fontWeight: 600,
                  cursor: "pointer", fontFamily: "'Inter', sans-serif",
                }}>Didn&apos;t open? Reopen Telegram</button>
              </div>
            ) : (
              <button onClick={handleConnect} style={{
                width: "100%", height: 54, borderRadius: 14, background: "linear-gradient(135deg, #2AABEE, #229ED9)",
                border: "none", color: "#fff", fontSize: 15.5, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer",
                fontFamily: "'Inter', sans-serif", boxShadow: "0 0 30px rgba(42,171,238,0.4), 0 4px 16px rgba(0,0,0,0.3)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 44px rgba(42,171,238,0.55), 0 8px 20px rgba(0,0,0,0.3)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px rgba(42,171,238,0.4), 0 4px 16px rgba(0,0,0,0.3)"; }}
              >
                <TelegramIcon size={20} color="#fff" /> Open Telegram &amp; Connect
              </button>
            )}

            {tgError && (
              <div style={{
                marginTop: 14, background: "rgba(255,70,70,0.07)", border: "1px solid rgba(255,70,70,0.2)",
                borderRadius: 10, padding: "10px 14px", fontSize: 12.5, color: "#ff7070",
              }}>⚠ {tgError}</div>
            )}

            <p style={{ margin: "20px 0 0", paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 11.5, color: "rgba(160,175,220,0.4)", textAlign: "center", lineHeight: 1.6 }}>
              🔒 We only receive your Telegram chat ID — never your messages, contacts, or phone number.
            </p>
          </div>

          {/* ── RIGHT: Chat preview + features ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18, animation: "floatUp 0.8s 0.1s cubic-bezier(0.16,1,0.3,1) both" }}>
            {/* Telegram-style chat mock */}
            <div style={{
              borderRadius: 22, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 24px 70px rgba(0,0,0,0.5)", background: "#0e1621",
            }}>
              {/* Chat header */}
              <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "14px 16px", background: "#17212b", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #2AABEE, #229ED9)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <TelegramIcon size={20} color="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>ScoutlyAI Bot</div>
                  <div style={{ fontSize: 11, color: "#5eb5e8" }}>bot</div>
                </div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 18 }}>⋮</div>
              </div>
              {/* Chat body */}
              <div style={{
                padding: "20px 16px 22px", display: "flex", flexDirection: "column", gap: 10, minHeight: 230,
                background: "linear-gradient(180deg, #0e1621, #0b1119)",
              }}>
                <div style={{ alignSelf: "flex-start", maxWidth: "85%", background: "#182533", borderRadius: "14px 14px 14px 4px", padding: "10px 13px" }}>
                  <div style={{ fontSize: 12.5, color: "#e7f0f7", lineHeight: 1.5 }}>
                    🛰️ Good morning! Your Finance Scout found 3 market-moving updates overnight.
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textAlign: "right", marginTop: 3 }}>8:00 AM</div>
                </div>
                {/* Voice message bubble */}
                <div style={{ alignSelf: "flex-start", maxWidth: "85%", background: "#182533", borderRadius: 14, padding: "11px 13px", display: "flex", alignItems: "center", gap: 11 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#2AABEE", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 15, flexShrink: 0 }}>▶</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 2, height: 22 }}>
                      {Array.from({ length: 26 }).map((_, i) => (
                        <div key={i} style={{ width: 2.5, borderRadius: 2, background: i < 9 ? "#5eb5e8" : "rgba(255,255,255,0.25)", height: `${[6,12,18,9,15,20,11,7,16,13,19,8,14,10,17,6,12,18,9,15,11,7,16,13,8,14][i]}px` }} />
                      ))}
                    </div>
                    <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>3:12 · Finance_Briefing.mp3</div>
                  </div>
                </div>
                <div style={{ alignSelf: "flex-start", fontSize: 10.5, color: "rgba(255,255,255,0.3)", paddingLeft: 4 }}>🌐 English · 🎙️ Professional tone</div>
              </div>
            </div>

            {/* Feature highlights */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { icon: "⏰", title: "On your schedule", desc: "Hourly, daily or custom." },
                { icon: "🎧", title: "Instant delivery", desc: "Tap and listen anywhere." },
                { icon: "🌍", title: "20+ languages", desc: "In your voice & tone." },
                { icon: "🔔", title: "Custom alerts", desc: "Only what matters to you." },
              ].map(f => (
                <div key={f.title} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px" }}>
                  <div style={{ fontSize: 18, marginBottom: 6 }}>{f.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f2ff" }}>{f.title}</div>
                  <div style={{ fontSize: 11.5, color: "rgba(160,175,220,0.55)", marginTop: 2, lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.055)", padding: "20px 32px", textAlign: "center", fontSize: 12, color: "rgba(160,175,220,0.4)" }}>
        © {new Date().getFullYear()} ScoutlyAI · Personal AI scouts for the entire web
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.3); } }
        @keyframes floatUp { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }
        .delivery-grid { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 28px; align-items: start; }
        @media (max-width: 860px) { .delivery-grid { grid-template-columns: 1fr; gap: 22px; } }
      `}</style>
    </div>
  );
}
