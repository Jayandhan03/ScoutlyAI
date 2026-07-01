"use client";

import { useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

export default function SignIn() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => { if (status === "authenticated") router.replace("/dashboard"); }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return <div className="row center" style={{ minHeight: "100vh" }}><span className="spinner" /></div>;
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr", position: "relative", background: "var(--bg)" }}>
      {/* top bar */}
      <div className="row between container" style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", height: 64, width: "100%" }}>
        <a href="/" className="row" style={{ gap: 10 }}><span className="mark">S</span><span style={{ fontWeight: 600, letterSpacing: "-0.02em" }}>Scoutly</span></a>
        <ThemeToggle />
      </div>

      <div className="row center" style={{ padding: 24 }}>
        <div className="rise" style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div className="badge badge-accent" style={{ marginBottom: 20 }}><span className="dot dot-live" /> Your AI agents</div>
            <h1 className="t-h2" style={{ marginBottom: 10 }}>Welcome back</h1>
            <p className="t-2" style={{ fontSize: "0.92rem" }}>Sign in to your agents and today&apos;s voice notes.</p>
          </div>

          <div className="card" style={{ padding: 28 }}>
            <button
              id="google-signin-btn"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="btn btn-lg"
              style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--line-2)", color: "var(--ink)", boxShadow: "var(--shadow-xs)" }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              Continue with Google
            </button>

            <div className="row center" style={{ gap: 12, margin: "20px 0" }}>
              <span className="hairline grow" /><span className="t-muted" style={{ fontSize: "0.72rem" }}>PRIVATE & SECURE</span><span className="hairline grow" />
            </div>

            <div className="col" style={{ gap: 10 }}>
              {["We never sell your data or post on your behalf", "Encrypted in transit and at rest", "Delete your agents and data anytime"].map(t => (
                <div key={t} className="row" style={{ gap: 9 }}>
                  <span className="row center" style={{ width: 16, height: 16, borderRadius: "50%", background: "var(--accent-soft)", color: "var(--accent)", flexShrink: 0 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "var(--ink-2)" }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="t-muted" style={{ textAlign: "center", fontSize: "0.75rem", marginTop: 20, lineHeight: 1.6 }}>
            By continuing you agree to our <a href="#" style={{ color: "var(--ink-2)", textDecoration: "underline" }}>Terms</a> and <a href="#" style={{ color: "var(--ink-2)", textDecoration: "underline" }}>Privacy Policy</a>.
          </p>
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <a href="/" className="nav-link" style={{ fontSize: "0.82rem" }}>← Back to home</a>
          </div>
        </div>
      </div>
    </div>
  );
}
