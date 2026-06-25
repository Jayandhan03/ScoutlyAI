"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PersonalizedDelivery from "@/components/PersonalizedDelivery";

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

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  /* ── Telegram connection status (managed on /delivery) ── */
  const [tgConnected, setTgConnected] = useState(false);
  const [tgUsername, setTgUsername]   = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/signin");
  }, [status, router]);

  /* ── Check Telegram connection on mount (drives the delivery card + scout scheduler) ── */
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
          <a href="/" style={{
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
          </a>

          {/* Center nav links */}
          <nav className="home-nav-links" style={{ display: "flex", alignItems: "center", gap: 28 }}>
            {[
              { href: "/test-scout", label: "Test a Scout" },
              { href: "#delivery", label: "Delivery" },
              { href: "#scouts", label: "My Scouts" },
              { href: "#how-it-works", label: "How it works" },
            ].map(l => (
              <a
                key={l.href}
                href={l.href}
                style={{
                  fontSize: 13.5, fontWeight: 500, color: "rgba(200,210,255,0.65)",
                  textDecoration: "none", whiteSpace: "nowrap", letterSpacing: "0.01em",
                  transition: "color 0.2s",
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = "#f0f2ff")}
                onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(200,210,255,0.65)")}
              >{l.label}</a>
            ))}
          </nav>

          {/* Right side: User info + sign out */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* User info */}
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

        {/* ══ HERO — marketing for Test a Scout ══ */}
        <div style={{
          textAlign: "center", maxWidth: 720,
          animation: "floatUp 0.6s cubic-bezier(0.16,1,0.3,1) both",
          marginBottom: 22,
        }}>
          {/* Welcome badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "#34d399",
            background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.22)",
            borderRadius: 999, padding: "5px 16px", marginBottom: 26,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%", display: "inline-block",
              background: "#34d399", boxShadow: "0 0 8px #34d399",
              animation: "pulse 2s ease-in-out infinite",
            }} />
            Welcome back, {session?.user?.name?.split(" ")[0]}!
          </div>

          <h1 style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: "clamp(34px, 5.2vw, 56px)", fontWeight: 800,
            letterSpacing: "-0.04em", lineHeight: 1.06, margin: "0 0 20px",
          }}>
            See your scouts<br />
            <span style={{
              background: "linear-gradient(135deg, #4d7fff 0%, #8b5cf6 55%, #38bdf8 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>in action.</span>
          </h1>

          <p style={{
            fontSize: 16.5, lineHeight: 1.75, color: "rgba(200,210,255,0.65)",
            margin: "0 auto", maxWidth: 560,
          }}>
            Before a scout monitors the web for you around the clock, take it for a spin.
            <strong style={{ color: "#cdd8ff", fontWeight: 700 }}> Test a Scout </strong>
            pulls the very latest on any topic and turns it into a studio-style audio briefing —
            in your language and voice — in seconds. It&apos;s the fastest way to see exactly what
            ScoutlyAI will deliver, every single day.
          </p>

          {/* CTA buttons */}
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginTop: 34 }}>
            <Link href="/test-scout" style={{
              display: "inline-flex", alignItems: "center", gap: 9, height: 52, padding: "0 30px",
              borderRadius: 14, background: "linear-gradient(135deg, #4d7fff, #8b5cf6)",
              color: "#fff", fontSize: 15, fontWeight: 700, textDecoration: "none",
              boxShadow: "0 0 30px rgba(77,127,255,0.4), 0 0 24px rgba(246,183,60,0.12), 0 4px 16px rgba(0,0,0,0.3)",
            }}>🛰️ Test a Scout →</Link>
            <a href="#scouts" style={{
              display: "inline-flex", alignItems: "center", gap: 8, height: 52, padding: "0 28px",
              borderRadius: 14, background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.12)", color: "rgba(200,210,255,0.8)",
              fontSize: 14.5, fontWeight: 600, textDecoration: "none",
            }}>Set up auto-briefings</a>
          </div>
        </div>

        {/* Marketing highlight cards */}
        <div style={{
          display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center",
          width: "100%", maxWidth: 720, marginBottom: 72,
          animation: "floatUp 0.7s 0.1s cubic-bezier(0.16,1,0.3,1) both",
        }}>
          {[
            { icon: "🌐", title: "Live web pull", desc: "Fresh results gathered in real time — never stale, never cached." },
            { icon: "🗣️", title: "Your language & voice", desc: "20+ languages with selectable voice tones to match your vibe." },
            { icon: "⚡", title: "Audio in seconds", desc: "From a topic to a downloadable, broadcast-style MP3 instantly." },
          ].map(c => (
            <div key={c.title} style={{
              flex: "1 1 200px", minWidth: 200,
              background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 18, padding: "22px 22px",
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12, marginBottom: 14,
                background: "rgba(77,127,255,0.1)", border: "1px solid rgba(77,127,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
              }}>{c.icon}</div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: "#f0f2ff", marginBottom: 6 }}>{c.title}</div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: "rgba(160,175,220,0.55)" }}>{c.desc}</div>
            </div>
          ))}
        </div>

        {/* ══ SECTION: DELIVERY (marketing) ══ */}
        <div id="delivery" style={{
          width: "100%", maxWidth: 680, marginTop: 76, scrollMarginTop: 84,
          background: "rgba(42,171,238,0.04)", border: "1px solid rgba(42,171,238,0.14)",
          borderRadius: 22, padding: "40px 36px", backdropFilter: "blur(16px)",
          textAlign: "center", position: "relative", overflow: "hidden",
          animation: "floatUp 0.85s 0.15s cubic-bezier(0.16,1,0.3,1) both",
        }}>
          <div style={{
            position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)",
            width: 300, height: 120, borderRadius: "50%",
            background: "rgba(42,171,238,0.10)", filter: "blur(50px)", pointerEvents: "none",
          }} />

          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 56, height: 56, borderRadius: 18, marginBottom: 18,
            background: "linear-gradient(135deg, #2AABEE, #229ED9)",
            boxShadow: "0 0 32px rgba(42,171,238,0.35)",
          }}>
            <TelegramIcon size={28} color="#fff" />
          </div>

          <div style={{
            display: "block", margin: "0 auto 14px", width: "fit-content",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            color: "#2AABEE", background: "rgba(42,171,238,0.1)", border: "1px solid rgba(42,171,238,0.28)",
            borderRadius: 999, padding: "5px 16px",
          }}>Delivery channel</div>

          <h2 style={{
            fontFamily: "'Sora', sans-serif", fontSize: "clamp(22px, 3.6vw, 30px)", fontWeight: 800,
            letterSpacing: "-0.03em", lineHeight: 1.18, margin: "0 0 12px", color: "#f0f2ff",
          }}>
            Your briefings, delivered to{" "}
            <span style={{
              background: "linear-gradient(135deg, #2AABEE, #38bdf8)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>Telegram</span>
          </h2>

          <p style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(200,210,255,0.62)", margin: "0 auto 22px", maxWidth: 500 }}>
            Connect Telegram once and your scouts deliver studio-quality audio briefings straight to your
            chat — on schedule or on demand. No new apps, no copy-paste. Just tap and listen.
          </p>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 }}>
            {[
              { i: "⏰", t: "Scheduled updates" },
              { i: "🎧", t: "Instant delivery" },
              { i: "🌍", t: "Any language" },
              { i: "🔔", t: "Custom alerts" },
            ].map(f => (
              <div key={f.t} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 999,
                background: "rgba(42,171,238,0.08)", border: "1px solid rgba(42,171,238,0.18)",
                fontSize: 12, fontWeight: 600, color: "rgba(42,171,238,0.85)",
              }}><span>{f.i}</span> {f.t}</div>
            ))}
          </div>

          {tgConnected ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 9, padding: "9px 18px", borderRadius: 14,
                background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.25)",
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px #34d399" }} />
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "#34d399" }}>
                  Connected{tgUsername ? ` · @${tgUsername}` : ""}
                </span>
              </div>
              <Link href="/delivery" style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, height: 50, padding: "0 30px",
                borderRadius: 14, background: "linear-gradient(135deg, #2AABEE, #229ED9)", color: "#fff",
                fontSize: 15, fontWeight: 700, textDecoration: "none",
                boxShadow: "0 0 30px rgba(42,171,238,0.4), 0 4px 16px rgba(0,0,0,0.3)",
              }}>Manage delivery →</Link>
            </div>
          ) : (
            <Link href="/delivery" style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10, height: 52, padding: "0 32px",
              borderRadius: 14, background: "linear-gradient(135deg, #2AABEE, #229ED9)", color: "#fff",
              fontSize: 15, fontWeight: 700, textDecoration: "none",
              boxShadow: "0 0 30px rgba(42,171,238,0.4), 0 4px 16px rgba(0,0,0,0.3)",
            }}>
              <TelegramIcon size={18} color="#fff" /> Set up Telegram delivery →
            </Link>
          )}

          <p style={{ margin: "18px 0 0", fontSize: 11.5, color: "rgba(160,175,220,0.35)" }}>
            🔒 We only access your chat ID — never your messages or contacts.
          </p>
        </div>

        {/* ── Personalized briefings: preferences chatbot + delivery schedule ── */}
        <div id="scouts" style={{ width: "100%", display: "flex", justifyContent: "center", scrollMarginTop: 84 }}>
          <PersonalizedDelivery tgConnected={tgConnected} />
        </div>

        {/* ══ SECTION: HOW IT WORKS ══ */}
        <div id="how-it-works" style={{ width: "100%", maxWidth: 680, marginTop: 76, scrollMarginTop: 84 }}>
          <SectionHeader
            eyebrow="How it works"
            title="From topic to"
            highlight="audio in seconds"
            subtitle="Every quick briefing runs the same four-step pipeline your scouts use behind the scenes."
          />
        </div>

        {/* How it works strip */}
        <div style={{
          marginTop: 4, display: "flex", gap: 32, flexWrap: "wrap",
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
                background: "rgba(77,127,255,0.08)", border: "1px solid rgba(77,127,255,0.18)",
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
