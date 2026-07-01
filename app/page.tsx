"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import ThemeToggle from "@/components/ThemeToggle";

/* ───────────────────────── Icons (single outline family) ───────────────── */
const I = {
  arrow: (p = {}) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>,
  radar: (p = {}) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M19.07 4.93A10 10 0 1 0 22 12" /><path d="M12 12l6-3" /><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" /><path d="M15.5 8.5A5 5 0 1 0 17 12" opacity=".5" /></svg>,
  bolt: (p = {}) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></svg>,
  layers: (p = {}) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 2l9 5-9 5-9-5 9-5z" /><path d="M3 12l9 5 9-5M3 17l9 5 9-5" /></svg>,
  filter: (p = {}) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>,
  clock: (p = {}) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  globe: (p = {}) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></svg>,
  check: (p = {}) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 6L9 17l-5-5" /></svg>,
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
const AGENT_STATES = ["Scanning sources", "Reading 24 articles", "Cross-checking claims", "Detecting a trend", "Summarizing", "Drafting your brief"];
function AgentTicker() {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI(v => (v + 1) % AGENT_STATES.length), 2200); return () => clearInterval(t); }, []);
  return (
    <span className="row" style={{ gap: 8 }}>
      <span className="dot dot-live" />
      <span className="thinking" style={{ fontSize: "0.82rem", fontWeight: 500 }}>{AGENT_STATES[i]}…</span>
    </span>
  );
}

/* ───────────────────────── Product preview mock ───────────────────────── */
function DashboardPreview() {
  return (
    <div className="card" style={{ overflow: "hidden", boxShadow: "var(--shadow-xl)", borderRadius: "var(--r-xl)" }}>
      {/* window chrome */}
      <div className="row between" style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)", background: "var(--surface-2)" }}>
        <div className="row" style={{ gap: 7 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--line-3)" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--line-2)" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--line-2)" }} />
        </div>
        <AgentTicker />
        <span className="badge badge-muted" style={{ height: 22 }}>6 agents live</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 0 }}>
        {/* left: brief */}
        <div style={{ padding: 20, borderRight: "1px solid var(--line)" }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Morning Brief · 7:00 AM</div>
          <div className="t-h3" style={{ marginBottom: 6 }}>3 things worth your attention</div>
          {[
            { t: "Nvidia signals a data-center slowdown", s: "Finance · 4 sources agree", c: "var(--accent)" },
            { t: "New open-weight model tops the leaderboard", s: "AI · trending in 2 places", c: "var(--info)" },
            { t: "A regulation that touches your product", s: "Policy · flagged as important", c: "var(--warn)" },
          ].map((r, k) => (
            <div key={k} className="row" style={{ gap: 12, padding: "12px 0", borderTop: "1px solid var(--line)" }}>
              <span style={{ width: 3, height: 32, borderRadius: 3, background: r.c, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "0.86rem", fontWeight: 550, letterSpacing: "-0.01em" }}>{r.t}</div>
                <div style={{ fontSize: "0.74rem", color: "var(--ink-3)", marginTop: 2 }}>{r.s}</div>
              </div>
            </div>
          ))}
        </div>

        {/* right: agents */}
        <div style={{ padding: 20, background: "var(--surface-2)" }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Your analysts</div>
          {[
            { n: "Finance", s: "Analyzing", d: true },
            { n: "AI & Tech", s: "Reading", d: true },
            { n: "Health", s: "Idle · next 6pm", d: false },
            { n: "Competitors", s: "Watching", d: true },
          ].map((a, k) => (
            <div key={k} className="row between" style={{ padding: "10px 0", borderTop: k ? "1px solid var(--line)" : "none" }}>
              <div className="row" style={{ gap: 9 }}>
                <span className="dot" style={{ background: a.d ? "var(--accent)" : "var(--ink-4)" }} />
                <span style={{ fontSize: "0.84rem", fontWeight: 500 }}>{a.n}</span>
              </div>
              <span style={{ fontSize: "0.74rem", color: a.d ? "var(--accent-ink)" : "var(--ink-3)" }}>{a.s}</span>
            </div>
          ))}
          <div className="skeleton" style={{ height: 8, marginTop: 18, width: "70%" }} />
          <div className="skeleton" style={{ height: 8, marginTop: 8, width: "90%" }} />
          <div className="skeleton" style={{ height: 8, marginTop: 8, width: "55%" }} />
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Data ───────────────────────────────────────── */
const TOPICS = ["AI", "Startups", "Finance", "Stocks", "Crypto", "Movies", "Sports", "Health", "Research", "Gaming", "Politics", "Travel", "Product launches", "Competitors"];

const HOW = [
  { icon: I.radar, t: "Name what matters", d: "Describe a topic in plain words — “Series-A fintech raises” or “anything about my competitor.” No feeds to configure." },
  { icon: I.layers, t: "An analyst deploys", d: "Scoutly assigns an AI analyst that reads across the open web continuously — comparing sources, not just collecting links." },
  { icon: I.filter, t: "You get the signal", d: "It filters the noise and delivers one calm briefing — the few things that changed, why they matter, and what to do." },
];

const USECASES = [
  { t: "Investors", d: "Earnings, filings and macro moves — reconciled across sources before the market opens." },
  { t: "Founders & operators", d: "Competitor launches, pricing changes and hiring signals, watched around the clock." },
  { t: "Researchers", d: "New papers and citations in your field, summarized with the method and the result." },
  { t: "Curious minds", d: "Your teams, your shows, your hobbies — the good parts, without the scroll." },
];

const FEATURES = [
  { icon: I.globe, t: "Reads the whole open web", d: "Not a fixed feed. Analysts range across news, blogs, filings and forums — wherever the story actually is." },
  { icon: I.bolt, t: "Judgment, not aggregation", d: "Claims are cross-checked and ranked by importance, so you read three things instead of three hundred." },
  { icon: I.clock, t: "On your rhythm", d: "A morning brief, an hourly pulse, or the instant something breaks. You set the cadence per topic." },
];

const PRICING = [
  { name: "Personal", price: "Free", note: "To start", feats: ["3 active analysts", "Daily morning brief", "Email or Telegram delivery"], cta: "Start free", primary: false },
  { name: "Pro", price: "$18", note: "/ month", feats: ["Unlimited analysts", "Real-time alerts", "Custom cadence & sources", "Voice briefings"], cta: "Start Pro", primary: true },
  { name: "Team", price: "Let's talk", note: "", feats: ["Shared analysts", "Competitor monitoring suite", "Workspace & SSO", "Priority support"], cta: "Contact sales", primary: false },
];

const FAQ = [
  { q: "How is this different from Google News or an RSS reader?", a: "Those hand you a list of links to read yourself. Scoutly reads them for you — comparing sources, discarding noise, and delivering only what changed and why it matters." },
  { q: "Where does it get information?", a: "Analysts range across the open web — news, blogs, filings, forums and more — rather than a fixed set of feeds. You can also narrow a topic to specific sources." },
  { q: "How often will I hear from it?", a: "You decide, per topic. A calm morning brief, an hourly pulse, or an instant alert when something important breaks. Quiet hours are respected." },
  { q: "Can I trust the summaries?", a: "Every briefing links back to its sources, and claims corroborated by multiple outlets are marked. You stay one click from the original." },
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
          <a href="#top" className="row" style={{ gap: 10 }}>
            <span className="mark">S</span>
            <span style={{ fontWeight: 600, fontSize: "0.98rem", letterSpacing: "-0.02em" }}>Scoutly</span>
          </a>
          <nav className="home-nav-links row" style={{ gap: 6, position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
            {[["#how", "How it works"], ["#use-cases", "Use cases"], ["#pricing", "Pricing"], ["#faq", "FAQ"]].map(([h, l]) => (
              <a key={h} href={h} className="nav-link" style={{ padding: "7px 12px", borderRadius: "var(--r-sm)" }}>{l}</a>
            ))}
          </nav>
          <div className="row" style={{ gap: 10 }}>
            <ThemeToggle />
            {session ? (
              <Link href="/dashboard" className="btn btn-primary btn-sm">Open dashboard {I.arrow()}</Link>
            ) : (
              <>
                <Link href="/signin" className="nav-link" style={{ padding: "0 6px" }}>Sign in</Link>
                <button onClick={go} className="btn btn-primary btn-sm">Start free</button>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="top">
        {/* ══ HERO ══ */}
        <section style={{ position: "relative", overflow: "hidden" }}>
          <div className="field-grid" style={{ position: "absolute", inset: 0, opacity: 0.7, pointerEvents: "none" }} />
          <div className="container" style={{ position: "relative", padding: "clamp(64px, 11vh, 128px) 24px clamp(48px, 7vh, 88px)", textAlign: "center" }}>
            <div className="rise badge badge-accent" style={{ marginBottom: 26 }}>
              <span className="dot dot-live" /> Personal intelligence, on autopilot
            </div>

            <h1 className="t-display rise-1" style={{ maxWidth: 900, margin: "0 auto 22px" }}>
              A team of analysts that<br />reads the internet <span style={{ color: "var(--accent)" }}>for you.</span>
            </h1>

            <p className="t-lead rise-2" style={{ maxWidth: 600, margin: "0 auto 34px" }}>
              Scoutly deploys AI analysts that monitor the web around the clock — across finance, tech, sports, health and any topic you name — then hand you one calm briefing of what actually matters.
            </p>

            <div className="rise-3 row center wrap" style={{ gap: 12, marginBottom: 18 }}>
              {session ? (
                <Link href="/dashboard" className="btn btn-primary btn-lg">Open your dashboard {I.arrow()}</Link>
              ) : (
                <button onClick={go} className="btn btn-primary btn-lg">Start free {I.arrow()}</button>
              )}
              <a href="#preview" className="btn btn-secondary btn-lg">See it in action</a>
            </div>
            <div className="rise-3 t-muted" style={{ fontSize: "0.8rem" }}>No credit card · Your first analyst in under a minute</div>

            {/* preview */}
            <div id="preview" className="rise-4" style={{ maxWidth: 960, margin: "56px auto 0", scrollMarginTop: 90 }}>
              <DashboardPreview />
            </div>
          </div>
        </section>

        {/* ══ TOPIC MARQUEE ══ */}
        <section style={{ borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", background: "var(--surface)" }}>
          <div className="container" style={{ padding: "22px 24px" }}>
            <div className="row wrap center" style={{ gap: 10 }}>
              <span className="t-muted" style={{ fontSize: "0.78rem", marginRight: 6 }}>Watching, right now:</span>
              {TOPICS.map(t => <span key={t} className="chip">{t}</span>)}
            </div>
          </div>
        </section>

        {/* ══ PROBLEM → SOLUTION ══ */}
        <section className="section container">
          <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
            <div className="eyebrow" style={{ justifyContent: "center", marginBottom: 16 }}>The problem</div>
            <h2 className="t-h2" style={{ marginBottom: 18 }}>The internet moves faster than anyone can read.</h2>
            <p className="t-lead">
              Staying informed has become a second job — endless tabs, feeds engineered for outrage, and the quiet fear you missed the one thing that mattered. More sources didn&apos;t make us wiser. They made us tired.
            </p>
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
              <h2 className="t-h2" style={{ marginBottom: 16 }}>Three steps. Then it disappears into the background.</h2>
              <p className="t-lead">Set it once. Your analysts do the reading, the comparing and the deciding — you just get the conclusion.</p>
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

        {/* ══ USE CASES ══ */}
        <section id="use-cases" className="section container" style={{ scrollMarginTop: 64 }}>
          <div className="grid" style={{ gridTemplateColumns: "0.9fr 1.1fr", gap: 48, alignItems: "center" }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 16 }}>Use cases</div>
              <h2 className="t-h2" style={{ marginBottom: 16 }}>One platform. Every corner of your life.</h2>
              <p className="t-lead" style={{ marginBottom: 24 }}>Give an analyst any beat — professional or personal. It adapts its depth and tone to the subject.</p>
              {session ? (
                <Link href="/dashboard" className="btn btn-primary">Deploy an analyst {I.arrow()}</Link>
              ) : (
                <button onClick={go} className="btn btn-primary">Deploy an analyst {I.arrow()}</button>
              )}
            </div>
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {USECASES.map((u, k) => (
                <div key={k} className="card card-pad" style={{ padding: 20 }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 6 }}>{u.t}</div>
                  <p style={{ fontSize: "0.85rem", lineHeight: 1.55, color: "var(--ink-2)" }}>{u.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ TESTIMONIAL ══ */}
        <section className="section" style={{ background: "var(--surface)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
          <div className="container" style={{ maxWidth: 820, textAlign: "center" }}>
            <div className="t-h2" style={{ fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.3 }}>
              “It feels like having a research desk on retainer. I open one briefing in the morning and I&apos;m genuinely caught up — <span style={{ color: "var(--accent)" }}>for the first time in years.</span>”
            </div>
            <div className="row center" style={{ gap: 12, marginTop: 32 }}>
              <span style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--surface-3)", border: "1px solid var(--line)" }} />
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "0.88rem", fontWeight: 600 }}>Early access member</div>
                <div style={{ fontSize: "0.78rem", color: "var(--ink-3)" }}>Product lead · fintech</div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ PRICING ══ */}
        <section id="pricing" className="section container" style={{ scrollMarginTop: 64 }}>
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
        </section>

        {/* ══ FAQ ══ */}
        <section id="faq" className="section" style={{ background: "var(--surface)", borderTop: "1px solid var(--line)", scrollMarginTop: 64 }}>
          <div className="container" style={{ maxWidth: 760 }}>
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
              <h2 className="t-h1" style={{ maxWidth: 640, margin: "0 auto 16px" }}>Stop reading the internet. Start understanding it.</h2>
              <p className="t-lead" style={{ maxWidth: 500, margin: "0 auto 32px" }}>Deploy your first analyst free. It will have something for you by morning.</p>
              <div className="row center wrap" style={{ gap: 12, marginBottom: 28 }}>
                {session ? (
                  <Link href="/dashboard" className="btn btn-primary btn-lg">Open your dashboard {I.arrow()}</Link>
                ) : (
                  <button onClick={go} className="btn btn-primary btn-lg">Continue with Google {I.arrow()}</button>
                )}
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
            <div style={{ maxWidth: 300 }}>
              <div className="row" style={{ gap: 10, marginBottom: 12 }}>
                <span className="mark">S</span>
                <span style={{ fontWeight: 600, letterSpacing: "-0.02em" }}>Scoutly</span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--ink-3)", lineHeight: 1.6 }}>Your personal intelligence platform. A team of AI analysts, working the web so you don&apos;t have to.</p>
            </div>
            <div className="row wrap" style={{ gap: 56, alignItems: "flex-start" }}>
              {[
                { h: "Product", links: ["How it works", "Use cases", "Pricing", "FAQ"] },
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
            <span style={{ fontSize: "0.8rem", color: "var(--ink-4)" }}>Made for calm, informed minds.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
