"use client";

import { useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // If already signed in, redirect to home
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/home");
    }
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(108,143,255,0.13) 0%, transparent 70%), #070711",
      }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(108,143,255,0.2)", borderTopColor: "#6c8fff", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(108,143,255,0.15) 0%, transparent 70%), #070711",
      fontFamily: "'Inter', sans-serif",
      padding: "20px",
    }}>

      {/* Ambient glow blobs */}
      <div style={{
        position: "fixed", top: "20%", left: "15%", width: 400, height: 400,
        borderRadius: "50%", background: "rgba(108,143,255,0.06)",
        filter: "blur(80px)", pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", bottom: "20%", right: "15%", width: 350, height: 350,
        borderRadius: "50%", background: "rgba(167,139,250,0.07)",
        filter: "blur(80px)", pointerEvents: "none",
      }} />

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 440,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 28,
        padding: "48px 40px 44px",
        backdropFilter: "blur(24px)",
        boxShadow: "0 0 80px rgba(108,143,255,0.1), 0 32px 64px rgba(0,0,0,0.4)",
        animation: "floatUp 0.6s cubic-bezier(0.16,1,0.3,1) both",
        position: "relative",
        zIndex: 1,
      }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800,
            letterSpacing: "-0.03em", color: "#f0f2ff", marginBottom: 12,
          }}>
            <span style={{
              width: 11, height: 11, borderRadius: "50%",
              background: "linear-gradient(135deg, #6c8fff, #a78bfa)",
              boxShadow: "0 0 16px rgba(108,143,255,0.7), 0 0 32px rgba(108,143,255,0.3)",
              display: "inline-block",
              animation: "pulse 2.5s ease-in-out infinite",
            }} />
            YourNews
          </div>
          <p style={{
            margin: 0, fontSize: 14.5, color: "rgba(160,175,220,0.65)",
            lineHeight: 1.6,
          }}>
            AI-powered audio news, personalized for you
          </p>
        </div>

        {/* Divider */}
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.07)", marginBottom: 32,
        }} />

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{
            margin: "0 0 8px",
            fontFamily: "'Syne', sans-serif",
            fontSize: 22, fontWeight: 800,
            letterSpacing: "-0.025em", color: "#f0f2ff",
          }}>
            Welcome back
          </h1>
          <p style={{ margin: 0, fontSize: 13.5, color: "rgba(160,175,220,0.6)" }}>
            Sign in to access your personalized feed
          </p>
        </div>

        {/* Google Sign In Button */}
        <button
          id="google-signin-btn"
          onClick={() => signIn("google", { callbackUrl: "/home" })}
          style={{
            width: "100%", height: 54, borderRadius: 14,
            background: "#ffffff",
            border: "none",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            cursor: "pointer",
            fontSize: 15, fontWeight: 600,
            color: "#1a1a2e",
            fontFamily: "'Inter', sans-serif",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3), 0 1px 4px rgba(0,0,0,0.2)",
            transition: "transform 0.2s, box-shadow 0.2s",
            marginBottom: 16,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 28px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.2)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.3), 0 1px 4px rgba(0,0,0,0.2)";
          }}
        >
          {/* Google SVG icon */}
          <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          Continue with Google
        </button>

        {/* Terms note */}
        <p style={{
          margin: "20px 0 0",
          textAlign: "center",
          fontSize: 11.5,
          color: "rgba(160,175,220,0.42)",
          lineHeight: 1.6,
        }}>
          By signing in, you agree to our{" "}
          <a href="#" style={{ color: "rgba(108,143,255,0.7)", textDecoration: "none" }}>Terms of Service</a>
          {" "}and{" "}
          <a href="#" style={{ color: "rgba(108,143,255,0.7)", textDecoration: "none" }}>Privacy Policy</a>
        </p>
      </div>

      {/* Back to home */}
      <a
        href="/"
        style={{
          marginTop: 24, fontSize: 13.5, color: "rgba(160,175,220,0.55)",
          textDecoration: "none", display: "flex", alignItems: "center", gap: 6,
          transition: "color 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = "rgba(108,143,255,0.9)"}
        onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = "rgba(160,175,220,0.55)"}
      >
        ← Back to home
      </a>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
        @keyframes floatUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
