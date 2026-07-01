"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import ThemeToggle from "@/components/ThemeToggle";

/* ───────────────────────── Icons (single outline family) ───────────────── */
const I = {
  arrow: (p = {}) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>,
  play: (p = {}) => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M8 5v14l11-7z" /></svg>,
  mic: (p = {}) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0M12 17v5" /></svg>,
  sliders: (p = {}) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" /></svg>,
  globe: (p = {}) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></svg>,
  clock: (p = {}) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  check: (p = {}) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 6L9 17l-5-5" /></svg>,
  tg: (p = {}) => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.787l3.019-14.228c.309-1.239-.473-1.8-1.282-1.432z" /></svg>,
  wa: (p = {}) => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12.05 0C5.5 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413A11.815 11.815 0 0012.05 0zm6.98 16.813c-.297.833-1.72 1.593-2.363 1.69-.604.09-1.368.128-2.208-.14-.51-.161-1.163-.377-2-.738-3.52-1.52-5.82-5.062-5.996-5.296-.173-.235-1.43-1.9-1.43-3.625s.905-2.573 1.226-2.925c.32-.352.7-.44.934-.44.234 0 .467.002.672.012.215.01.504-.082.788.602.297.703 1.008 2.428 1.096 2.604.09.176.148.383.03.618-.117.235-.176.383-.352.588-.176.204-.37.457-.53.614-.176.176-.36.367-.155.72.205.351.912 1.503 1.958 2.436 1.345 1.2 2.48 1.57 2.832 1.746.352.176.557.147.762-.088.205-.235.878-1.026 1.113-1.378.234-.352.469-.293.792-.176.323.117 2.048.966 2.4 1.142.352.176.586.264.674.41.088.147.088.851-.209 1.684z" /></svg>,
  app: (p = {}) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="4" y="3" width="16" height="18" rx="3" /><path d="M9 7h6" /></svg>,
};

/* ───────────────────────── Waitlist (wired to /api/waitlist) ───────────── */
function WaitlistForm({ source }: { source: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "loading") return;
    setState("loading"); setMsg("");
    try {
      const res = await fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, source }) });
      const data = await res.json();
      if (res.ok && data.success) { setState("done"); setMsg(data.message ?? "You're on the list."); setEmail(""); }
      else { setState("error"); setMsg(data.error ?? "Something went wrong."); }
    } catch { setState("error"); setMsg("Network error. Try again."); }
  };
  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 420 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input className="input" type="email" required placeholder="you@work.com" value={email} onChange={e => setEmail(e.target.value)} />
        <button type="submit" className="btn btn-primary" disabled={state === "loading"} style={{ flexShrink: 0 }}>
          {state === "loading" ? "…" : state === "done" ? "Joined" : "Get early access"}
        </button>
      </div>
      {msg && <span style={{ fontSize: "0.78rem", color: state === "error" ? "var(--danger)" : "var(--accent-ink)" }}>{msg}</span>}
    </form>
  );
}

/* ───────────────────────── Live agent ticker ──────────────────────────── */
const WORK = ["Scanning sources", "Reading 24 articles", "Cross-checking", "Detecting a trend", "Recording your voice note"];
function AgentTicker() {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI(v => (v + 1) % WORK.length), 2200); return () => clearInterval(t); }, []);
  return <span className="row" style={{ gap: 8 }}><span className="dot dot-live" /><span className="thinking" style={{ fontSize: "0.82rem", fontWeight: 500 }}>{WORK[i]}…</span></span>;
}

/* ───────────────────────── Product preview: a voice note arriving ──────── */
function VoiceBars({ n = 26, playedTo = 9 }: { n?: number; playedTo?: number }) {
  const hs = [6, 12, 18, 9, 15, 20, 11, 7, 16, 13, 19, 8, 14, 10, 17, 6, 12, 18, 9, 15, 11, 7, 16, 13, 8, 14];
  return (
    <div className="row" style={{ gap: 2, height: 22, flex: 1 }}>
      {Array.from({ length: n }).map((_, i) => <span key={i} style={{ width: 2.5, borderRadius: 2, background: i < playedTo ? "var(--accent)" : "var(--line-3)", height: `${hs[i % hs.length]}px` }} />)}
    </div>
  );
}

function DeliveryPreview() {
  return (
    <div className="card" style={{ overflow: "hidden", boxShadow: "var(--shadow-xl)", borderRadius: "var(--r-xl)" }}>
      <div className="row between" style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)", background: "var(--surface-2)" }}>
        <div className="row" style={{ gap: 7 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--line-3)" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--line-2)" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--line-2)" }} />
        </div>
        <AgentTicker />
        <span className="badge badge-muted" style={{ height: 22 }}>4 agents live</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr" }}>
        {/* chat with voice notes */}
        <div style={{ padding: 18, borderRight: "1px solid var(--line)" }}>
          <div className="row between" style={{ marginBottom: 14 }}>
            <div className="row" style={{ gap: 9 }}>
              <span className="row center" style={{ width: 28, height: 28, borderRadius: "50%", background: "#229ED9", color: "#fff" }}>{I.tg()}</span>
              <div><div style={{ fontSize: "0.82rem", fontWeight: 600 }}>Finance agent</div><div style={{ fontSize: "0.68rem", color: "var(--accent-ink)" }}>via Telegram · 8:00 AM</div></div>
            </div>
          </div>
          {/* text intro */}
          <div style={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: "12px 12px 12px 4px", padding: "10px 12px", marginBottom: 10, maxWidth: "92%" }}>
            <div style={{ fontSize: "0.8rem", lineHeight: 1.5 }}>Good morning. Three market-moving updates overnight — here&apos;s your 2-minute brief.</div>
          </div>
          {/* voice note bubble */}
          <div className="row" style={{ gap: 11, background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 12, padding: "11px 12px", maxWidth: "92%" }}>
            <span className="row center" style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--accent)", color: "#fff", flexShrink: 0 }}>{I.play()}</span>
            <VoiceBars />
            <span className="mono" style={{ fontSize: "0.68rem", color: "var(--ink-3)" }}>2:04</span>
          </div>
          <div style={{ fontSize: "0.68rem", color: "var(--ink-4)", marginTop: 8, paddingLeft: 2 }}>English · Analytical voice · your 8 AM slot</div>
        </div>

        {/* agents */}
        <div style={{ padding: 18, background: "var(--surface-2)" }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Your agents</div>
          {[
            { n: "Finance", s: "Recording", d: true },
            { n: "AI & Tech", s: "Reading", d: true },
            { n: "My competitor", s: "Watching", d: true },
            { n: "Health", s: "Next · 6 PM", d: false },
          ].map((a, k) => (
            <div key={k} className="row between" style={{ padding: "9px 0", borderTop: k ? "1px solid var(--line)" : "none" }}>
              <div className="row" style={{ gap: 9 }}><span className="dot" style={{ background: a.d ? "var(--accent)" : "var(--ink-4)" }} /><span style={{ fontSize: "0.82rem", fontWeight: 500 }}>{a.n}</span></div>
              <span style={{ fontSize: "0.72rem", color: a.d ? "var(--accent-ink)" : "var(--ink-3)" }}>{a.s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Data ───────────────────────────────────────── */
const TOPICS = ["AI", "Startups", "Finance", "Stocks", "Crypto", "Your competitors", "Sports", "Health", "Research", "Gaming", "Politics", "Travel", "Product launches", "Any custom topic"];

const CHANNELS = [
  { icon: I.app, name: "In the app", note: "Web now · mobile soon" },
  { icon: I.tg, name: "Telegram", note: "Live" },
  { icon: I.wa, name: "WhatsApp", note: "Coming soon" },
];

const CONFIG = [
  { label: "Topic", value: "Anything — a market, a rival, your team, a hobby" },
  { label: "Language", value: "20+ languages, including yours" },
  { label: "Voice & tone", value: "Pick the voice and the vibe" },
  { label: "Frequency", value: "Real-time, hourly, daily — you decide" },
  { label: "Channel", value: "App, Telegram or WhatsApp" },
];

const HOW = [
  { icon: I.sliders, t: "Design your agent", d: "Pick the topic, then set the voice, language, tone and how often you want to hear from it. Takes about a minute." },
  { icon: I.globe, t: "It monitors 24/7", d: "Your agent reads across the open web continuously — comparing sources and deciding what actually deserves your attention." },
  { icon: I.mic, t: "You get a voice note", d: "A concise audio update lands in your app, Telegram or WhatsApp. Press play — you're caught up, hands-free." },
];

const FEATURES = [
  { icon: I.mic, t: "Listen, don't read", d: "Every update is a natural voice note. Catch up on the commute, between meetings, at the gym — without opening a single tab." },
  { icon: I.globe, t: "Your voice, your language", d: "Choose the language, the voice and the tone. Each agent sounds exactly the way you want to be briefed." },
  { icon: I.clock, t: "On your cadence", d: "Real-time when it breaks, or a calm morning summary. Every agent reports on the rhythm you set — quiet hours respected." },
];

const USECASES = [
  { t: "Investors", d: "Earnings, filings and macro moves — as a voice note before the market opens." },
  { t: "Founders & operators", d: "Competitor launches, pricing and hiring signals, whispered to you the moment they move." },
  { t: "Executives", d: "The one thing that changed in your industry today, briefed between meetings." },
  { t: "Anyone busy", d: "Your teams, your shows, your hobbies — the good parts, hands-free." },
];

const PRICING = [
  { name: "Personal", price: "Free", note: "To start", feats: ["3 agents", "Daily voice-note brief", "In-app & Telegram delivery"], cta: "Start free", primary: false },
  { name: "Pro", price: "$18", note: "/ month", feats: ["Unlimited agents", "Real-time voice alerts", "Custom voice, language & cadence", "WhatsApp delivery"], cta: "Start Pro", primary: true },
  { name: "Team", price: "Let's talk", note: "", feats: ["Shared agents", "Competitor monitoring suite", "Workspace & SSO", "Priority support"], cta: "Contact sales", primary: false },
];

const FAQ = [
  { q: "What exactly does Scoutly send me?", a: "A voice note. Your agent reads the web on your topic, writes a concise brief, and delivers it as natural audio — so you can listen instead of read, wherever you are." },
  { q: "Where do the updates arrive?", a: "Three places: inside the Scoutly app (web today, mobile soon), in Telegram, and in WhatsApp (coming soon). You choose per agent." },
  { q: "How much can I customize an agent?", a: "Fully. The topic, the language, the voice and tone, how often it reports, and which channel it uses — every agent is yours to design." },
  { q: "How is this different from a news app or feed?", a: "Feeds hand you links to read. Scoutly reads for you and talks back — a personal briefing in audio, tuned to you, built for people too busy to scroll." },
];

/* ───────────────────────── Page ───────────────────────────────────────── */
export default function Landing() {
  const { data: session } = useSession();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const go = () => signIn("google", { callbackUrl: "/dashboard" });

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* ══ NAV ══ */}
      <header className="glass" style={{ position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid var(--line)" }}>
        <div className="container row between" style={{ height: "var(--nav-h)" }}>
          <a href="#top" className="row" style={{ gap: 10 }}><span className="mark">S</span><span style={{ fontWeight: 600, fontSize: "0.98rem", letterSpacing: "-0.02em" }}>Scoutly</span></a>
          <nav className="home-nav-links row" style={{ gap: 6, position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
            {[["#how", "How it works"], ["#design", "Your agents"], ["#pricing", "Pricing"], ["#faq", "FAQ"]].map(([h, l]) => (
              <a key={h} href={h} className="nav-link" style={{ padding: "7px 12px", borderRadius: "var(--r-sm)" }}>{l}</a>
            ))}
          </nav>
          <div className="row" style={{ gap: 10 }}>
            <ThemeToggle />
            {session ? <Link href="/dashboard" className="btn btn-primary btn-sm">Open dashboard {I.arrow()}</Link> : (
              <><Link href="/signin" className="nav-link" style={{ padding: "0 6px" }}>Sign in</Link><button onClick={go} className="btn btn-primary btn-sm">Deploy an agent</button></>
            )}
          </div>
        </div>
      </header>

      <main id="top">
        {/* ══ HERO ══ */}
        <section style={{ position: "relative", overflow: "hidden" }}>
          <div className="field-grid" style={{ position: "absolute", inset: 0, opacity: 0.7, pointerEvents: "none" }} />
          <div className="container" style={{ position: "relative", padding: "clamp(60px, 10vh, 120px) 24px clamp(48px, 7vh, 80px)", textAlign: "center" }}>
            <div className="rise badge badge-accent" style={{ marginBottom: 26 }}><span className="dot dot-live" /> Personal AI agents · voice-note updates</div>

            <h1 className="t-display rise-1" style={{ maxWidth: 940, margin: "0 auto 22px" }}>
              Stay informed —<br /><span style={{ color: "var(--accent)" }}>without reading a thing.</span>
            </h1>

            <p className="t-lead rise-2" style={{ maxWidth: 620, margin: "0 auto 20px" }}>
              Scoutly deploys AI agents that monitor whatever you care about — markets, your competitors, your team, your hobbies — and send you <strong style={{ color: "var(--ink)" }}>voice-note updates</strong> in your language and voice, right inside Telegram, WhatsApp or the app.
            </p>

            <p className="rise-2 t-muted" style={{ fontSize: "0.85rem", marginBottom: 30 }}>Built for busy, high-performing people who need to stay ahead — hands-free.</p>

            <div className="rise-3 row center wrap" style={{ gap: 12, marginBottom: 16 }}>
              {session ? <Link href="/dashboard" className="btn btn-primary btn-lg">Open your dashboard {I.arrow()}</Link> : <button onClick={go} className="btn btn-primary btn-lg">Deploy your first agent {I.arrow()}</button>}
              <a href="#preview" className="btn btn-secondary btn-lg">Hear how it works</a>
            </div>
            <div className="rise-3 t-muted" style={{ fontSize: "0.8rem" }}>No credit card · Configure an agent in under a minute</div>

            <div id="preview" className="rise-4" style={{ maxWidth: 940, margin: "52px auto 0", scrollMarginTop: 90 }}><DeliveryPreview /></div>
          </div>
        </section>

        {/* ══ CHANNELS + TOPICS ══ */}
        <section style={{ borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", background: "var(--surface)" }}>
          <div className="container" style={{ padding: "26px 24px" }}>
            <div className="row center wrap" style={{ gap: 28, marginBottom: 20 }}>
              <span className="t-muted" style={{ fontSize: "0.78rem" }}>Delivered where you already are:</span>
              {CHANNELS.map(c => (
                <span key={c.name} className="row" style={{ gap: 8 }}>
                  <span style={{ color: "var(--ink-2)" }}>{c.icon()}</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 550 }}>{c.name}</span>
                  <span className="badge badge-muted" style={{ height: 20, fontSize: "0.64rem" }}>{c.note}</span>
                </span>
              ))}
            </div>
            <div className="hairline" style={{ marginBottom: 20 }} />
            <div className="row wrap center" style={{ gap: 9 }}>
              <span className="t-muted" style={{ fontSize: "0.78rem", marginRight: 4 }}>Watching, right now:</span>
              {TOPICS.map(t => <span key={t} className="chip">{t}</span>)}
            </div>
          </div>
        </section>

        {/* ══ PROBLEM ══ */}
        <section className="section container">
          <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
            <div className="eyebrow" style={{ justifyContent: "center", marginBottom: 16 }}>The problem</div>
            <h2 className="t-h2" style={{ marginBottom: 18 }}>You&apos;re too busy to read the internet.</h2>
            <p className="t-lead">Staying informed has become a second job — endless tabs, feeds engineered for outrage, and the quiet fear you missed the one thing that mattered. High-performers don&apos;t have the hours. You need the signal, spoken, on your schedule.</p>
          </div>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18, marginTop: 56 }}>
            {FEATURES.map((f, k) => (
              <div key={k} className="card card-pad card-interactive">
                <div className="row" style={{ width: 40, height: 40, borderRadius: "var(--r-md)", background: "var(--accent-soft)", color: "var(--accent)", marginBottom: 16, justifyContent: "center" }}>{f.icon()}</div>
                <div className="t-h3" style={{ fontSize: "1.05rem", marginBottom: 8 }}>{f.t}</div>
                <p style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "var(--ink-2)" }}>{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══ HOW IT WORKS ══ */}
        <section id="how" className="section" style={{ background: "var(--surface)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", scrollMarginTop: 64 }}>
          <div className="container">
            <div style={{ maxWidth: 620, marginBottom: 56 }}>
              <div className="eyebrow" style={{ marginBottom: 16 }}>How it works</div>
              <h2 className="t-h2" style={{ marginBottom: 16 }}>Design it once. Then just listen.</h2>
              <p className="t-lead">Set an agent up in a minute. It does the reading, the comparing and the deciding — you get the conclusion, spoken.</p>
            </div>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
              {HOW.map((s, k) => (
                <div key={k}>
                  <div className="row between" style={{ marginBottom: 16 }}>
                    <div className="row center" style={{ width: 44, height: 44, borderRadius: "var(--r-md)", background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--ink)" }}>{s.icon()}</div>
                    <span className="mono" style={{ fontSize: "0.8rem", color: "var(--ink-4)" }}>0{k + 1}</span>
                  </div>
                  <div className="t-h3" style={{ fontSize: "1.15rem", marginBottom: 8 }}>{s.t}</div>
                  <p style={{ fontSize: "0.92rem", lineHeight: 1.6, color: "var(--ink-2)" }}>{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ DESIGN YOUR AGENT ══ */}
        <section id="design" className="section container" style={{ scrollMarginTop: 64 }}>
          <div className="grid" style={{ gridTemplateColumns: "0.95fr 1.05fr", gap: 48, alignItems: "center" }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 16 }}>Your agents, your way</div>
              <h2 className="t-h2" style={{ marginBottom: 16 }}>Every agent is yours to design.</h2>
              <p className="t-lead" style={{ marginBottom: 24 }}>The whole product is the configuration: tell an agent what to watch, how to sound, and when to reach you. It adapts everything else.</p>
              {session ? <Link href="/dashboard" className="btn btn-primary">Design an agent {I.arrow()}</Link> : <button onClick={go} className="btn btn-primary">Design an agent {I.arrow()}</button>}
            </div>
            {/* config mock */}
            <div className="card" style={{ padding: 24 }}>
              <div className="row between" style={{ marginBottom: 16 }}>
                <div className="row" style={{ gap: 10 }}><span className="row center" style={{ width: 34, height: 34, borderRadius: "var(--r-sm)", background: "var(--surface-2)", border: "1px solid var(--line)", fontSize: 16 }}>📈</span><input className="input" defaultValue="Semiconductor supply chain" style={{ height: 36, width: 220 }} readOnly /></div>
                <span className="badge badge-accent"><span className="dot dot-live" /> Live</span>
              </div>
              {CONFIG.map((c, k) => (
                <div key={k} className="row between" style={{ padding: "11px 0", borderTop: "1px solid var(--line)" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--ink-3)" }}>{c.label}</span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 500, textAlign: "right", maxWidth: 260 }}>{c.value}</span>
                </div>
              ))}
              <div className="row" style={{ gap: 8, marginTop: 16 }}>
                <span className="chip" style={{ background: "var(--accent-soft)", borderColor: "var(--accent-line)", color: "var(--accent-ink)" }}>{I.tg()} Telegram</span>
                <span className="chip">{I.mic()} Analytical voice</span>
                <span className="chip">{I.clock()} 8:00 AM</span>
              </div>
            </div>
          </div>
        </section>

        {/* ══ USE CASES ══ */}
        <section className="section" style={{ background: "var(--surface)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
          <div className="container">
            <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 48px" }}>
              <div className="eyebrow" style={{ justifyContent: "center", marginBottom: 16 }}>Who it&apos;s for</div>
              <h2 className="t-h2">Made for people with no time to spare.</h2>
            </div>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
              {USECASES.map((u, k) => (
                <div key={k} className="card card-pad" style={{ padding: 22 }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 6 }}>{u.t}</div>
                  <p style={{ fontSize: "0.85rem", lineHeight: 1.55, color: "var(--ink-2)" }}>{u.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ TESTIMONIAL ══ */}
        <section className="section container">
          <div style={{ maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
            <div className="t-h2" style={{ fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.3 }}>
              “I get a two-minute voice note over my morning coffee and I&apos;m fully briefed on my market. <span style={{ color: "var(--accent)" }}>I haven&apos;t opened a news tab in weeks.</span>”
            </div>
            <div className="row center" style={{ gap: 12, marginTop: 32 }}>
              <span style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--surface-3)", border: "1px solid var(--line)" }} />
              <div style={{ textAlign: "left" }}><div style={{ fontSize: "0.88rem", fontWeight: 600 }}>Early access member</div><div style={{ fontSize: "0.78rem", color: "var(--ink-3)" }}>Founder · B2B SaaS</div></div>
            </div>
          </div>
        </section>

        {/* ══ PRICING ══ */}
        <section id="pricing" className="section" style={{ background: "var(--surface)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", scrollMarginTop: 64 }}>
          <div className="container">
            <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 56px" }}>
              <div className="eyebrow" style={{ justifyContent: "center", marginBottom: 16 }}>Pricing</div>
              <h2 className="t-h2" style={{ marginBottom: 14 }}>Start free. Upgrade when it&apos;s indispensable.</h2>
              <p className="t-lead">Honest pricing. No lock-in, cancel anytime.</p>
            </div>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18, maxWidth: 960, margin: "0 auto" }}>
              {PRICING.map((p) => (
                <div key={p.name} className="card" style={{ padding: 28, position: "relative", borderColor: p.primary ? "var(--accent-line)" : "var(--line)", boxShadow: p.primary ? "var(--shadow-lg)" : "var(--shadow-sm)" }}>
                  {p.primary && <span className="badge badge-accent" style={{ position: "absolute", top: 20, right: 20 }}>Most popular</span>}
                  <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--ink-2)" }}>{p.name}</div>
                  <div className="row" style={{ gap: 6, alignItems: "baseline", margin: "10px 0 20px" }}>
                    <span style={{ fontSize: "2.4rem", fontWeight: 600, letterSpacing: "-0.03em" }}>{p.price}</span>
                    <span className="t-muted" style={{ fontSize: "0.85rem" }}>{p.note}</span>
                  </div>
                  <div className="col" style={{ gap: 11, marginBottom: 24 }}>
                    {p.feats.map(f => (
                      <div key={f} className="row" style={{ gap: 9 }}>
                        <span className="row center" style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--accent-soft)", color: "var(--accent)", flexShrink: 0 }}>{I.check()}</span>
                        <span style={{ fontSize: "0.87rem", color: "var(--ink-2)" }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={go} className={`btn ${p.primary ? "btn-primary" : "btn-secondary"}`} style={{ width: "100%" }}>{p.cta}</button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FAQ ══ */}
        <section id="faq" className="section container" style={{ scrollMarginTop: 64 }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div className="eyebrow" style={{ justifyContent: "center", marginBottom: 16 }}>Questions</div>
              <h2 className="t-h2">Good to know.</h2>
            </div>
            <div className="card" style={{ overflow: "hidden" }}>
              {FAQ.map((f, k) => (
                <div key={k} style={{ borderTop: k ? "1px solid var(--line)" : "none" }}>
                  <button onClick={() => setOpenFaq(openFaq === k ? null : k)} className="row between" style={{ width: "100%", padding: "20px 24px", background: "none", border: "none", cursor: "pointer", textAlign: "left", color: "var(--ink)" }}>
                    <span style={{ fontSize: "0.98rem", fontWeight: 550, letterSpacing: "-0.01em" }}>{f.q}</span>
                    <span style={{ transform: openFaq === k ? "rotate(45deg)" : "none", transition: "transform 0.2s var(--ease)", fontSize: "1.3rem", color: "var(--ink-3)", flexShrink: 0, lineHeight: 1 }}>+</span>
                  </button>
                  {openFaq === k && <p style={{ padding: "0 24px 22px", fontSize: "0.92rem", lineHeight: 1.65, color: "var(--ink-2)", maxWidth: 620, animation: "fade 0.2s ease both" }}>{f.a}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ CTA ══ */}
        <section className="section container">
          <div className="card" style={{ padding: "clamp(40px, 6vw, 72px)", textAlign: "center", position: "relative", overflow: "hidden", background: "var(--surface)" }}>
            <div className="field-grid" style={{ position: "absolute", inset: 0, opacity: 0.6, pointerEvents: "none" }} />
            <div style={{ position: "relative" }}>
              <h2 className="t-h1" style={{ maxWidth: 640, margin: "0 auto 16px" }}>Deploy an agent. Get your first voice note by morning.</h2>
              <p className="t-lead" style={{ maxWidth: 500, margin: "0 auto 32px" }}>Free to start. Design your agent in a minute and never open a news tab again.</p>
              <div className="row center wrap" style={{ gap: 12, marginBottom: 28 }}>
                {session ? <Link href="/dashboard" className="btn btn-primary btn-lg">Open your dashboard {I.arrow()}</Link> : <button onClick={go} className="btn btn-primary btn-lg">Continue with Google {I.arrow()}</button>}
              </div>
              <div className="col center" style={{ gap: 8 }}>
                <span className="t-muted" style={{ fontSize: "0.78rem" }}>Or join the early-access list</span>
                <WaitlistForm source="landing-cta" />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ══ FOOTER ══ */}
      <footer style={{ borderTop: "1px solid var(--line)", background: "var(--surface)" }}>
        <div className="container" style={{ padding: "48px 24px 32px" }}>
          <div className="row between wrap" style={{ gap: 24, alignItems: "flex-start" }}>
            <div style={{ maxWidth: 320 }}>
              <div className="row" style={{ gap: 10, marginBottom: 12 }}><span className="mark">S</span><span style={{ fontWeight: 600, letterSpacing: "-0.02em" }}>Scoutly</span></div>
              <p style={{ fontSize: "0.85rem", color: "var(--ink-3)", lineHeight: 1.6 }}>Deploy AI agents that monitor what matters and brief you by voice — in your app, Telegram or WhatsApp. Made for busy minds.</p>
            </div>
            <div className="row wrap" style={{ gap: 56, alignItems: "flex-start" }}>
              {[
                { h: "Product", links: ["How it works", "Your agents", "Pricing", "FAQ"] },
                { h: "Company", links: ["About", "Blog", "Careers", "Contact"] },
                { h: "Legal", links: ["Privacy", "Terms", "Security"] },
              ].map(col => (
                <div key={col.h} className="col" style={{ gap: 10 }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--ink)", marginBottom: 2 }}>{col.h}</div>
                  {col.links.map(l => <a key={l} href="#" style={{ fontSize: "0.84rem", color: "var(--ink-3)" }} className="nav-link">{l}</a>)}
                </div>
              ))}
            </div>
          </div>
          <div className="hairline" style={{ margin: "32px 0 20px" }} />
          <div className="row between wrap" style={{ gap: 12 }}>
            <span style={{ fontSize: "0.8rem", color: "var(--ink-4)" }}>© {new Date().getFullYear()} Scoutly. All rights reserved.</span>
            <span style={{ fontSize: "0.8rem", color: "var(--ink-4)" }}>Listen, don&apos;t scroll.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
