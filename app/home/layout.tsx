"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Redirect unauthenticated users to the landing page
    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/");
        }
    }, [status, router]);

    // Show a full-screen loading state while session resolves
    if (status === "loading") {
        return (
            <div style={{
                minHeight: "100vh",
                background: "#0d0d14",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 16,
            }}>
                <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: "3px solid rgba(77,184,255,0.2)",
                    borderTop: "3px solid #4db8ff",
                    animation: "spin 0.8s linear infinite",
                }} />
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Loading…</span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // Don't render home content for unauthenticated users (redirect is in progress)
    if (status === "unauthenticated") {
        return null;
    }

    return (
        <div style={{ minHeight: "100vh", background: "#0d0d14", color: "#fff", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", display: "flex", flexDirection: "column" }}>

            {/* NAVBAR */}
            <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(13,13,20,0.88)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>

                    {/* Logo */}
                    <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 600, color: "#4db8ff", textDecoration: "none", letterSpacing: "-0.01em" }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4db8ff", boxShadow: "0 0 8px #4db8ff", display: "inline-block", animation: "pulse-dot 2s ease-in-out infinite" }} />
                        Instant Audio News
                    </Link>

                    {/* Nav links */}
                    <nav style={{ display: "flex", alignItems: "center", gap: 32 }}>
                        {["Customization", "Settings", "Preferences"].map((item) => (
                            <a key={item} style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", textDecoration: "none", cursor: "pointer", transition: "color 0.2s" }}
                                onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}>
                                {item}
                            </a>
                        ))}
                    </nav>

                    {/* Right actions — signed-in user info */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {session?.user && (
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                {/* Avatar */}
                                {session.user.image ? (
                                    <img
                                        src={session.user.image}
                                        alt={session.user.name ?? "User"}
                                        style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: "50%",
                                            border: "2px solid rgba(77,184,255,0.5)",
                                            objectFit: "cover",
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: "50%",
                                        background: "linear-gradient(135deg, #4db8ff, #7c3aed)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 13,
                                        fontWeight: 700,
                                        color: "#fff",
                                    }}>
                                        {session.user.name?.[0]?.toUpperCase() ?? "U"}
                                    </div>
                                )}
                                {/* Name */}
                                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 500, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {session.user.name}
                                </span>
                                {/* Divider */}
                                <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 16 }}>|</span>
                            </div>
                        )}

                        {/* Sign Out button */}
                        <button
                            onClick={() => signOut({ callbackUrl: "/" })}
                            style={{
                                fontSize: 12,
                                fontWeight: 600,
                                padding: "7px 16px",
                                borderRadius: 999,
                                border: "1px solid rgba(255,80,80,0.3)",
                                background: "rgba(255,80,80,0.08)",
                                color: "#ff6b6b",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                transition: "background 0.2s, border-color 0.2s",
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,80,80,0.18)";
                                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,80,80,0.55)";
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,80,80,0.08)";
                                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,80,80,0.3)";
                            }}
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            {/* PAGE CONTENT */}
            <main style={{ flex: 1 }}>
                {children}
            </main>

            {/* FOOTER */}
            <footer style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "60px 24px 0" }}>
                <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.5fr", gap: 40, paddingBottom: 40 }}>

                    {/* Brand */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 600, color: "#4db8ff" }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4db8ff", display: "inline-block" }} />
                            Instant Audio News
                        </div>
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.65, margin: 0 }}>
                            AI-powered personalized news intelligence. Designed to eliminate noise and deliver structured signal.
                        </p>
                        <div style={{ display: "flex", gap: 16 }}>
                            {["Twitter", "LinkedIn", "GitHub"].map((s) => (
                                <a key={s} href="#" style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>{s}</a>
                            ))}
                        </div>
                    </div>

                    {/* Product */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>Product</h4>
                        {["Agent Studio", "Feed Engine", "Voice Delivery", "Channels"].map((l) => (
                            <a key={l} href="#" style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>{l}</a>
                        ))}
                    </div>

                    {/* Company */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>Company</h4>
                        {["About", "Leadership", "Careers", "Contact"].map((l) => (
                            <a key={l} href="#" style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>{l}</a>
                        ))}
                    </div>

                    {/* Contact */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>Contact</h4>
                        {["support@yournews.ai", "press@yournews.ai", "+91 00000 00000"].map((l) => (
                            <span key={l} style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{l}</span>
                        ))}
                    </div>
                </div>

                <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 0", display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.3)", borderTop: "1px solid rgba(255,255,255,0.07)", flexWrap: "wrap", gap: 8 }}>
                    <span>© {new Date().getFullYear()} Instant Audio News. All rights reserved.</span>
                    <span>
                        <a href="#" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>Privacy Policy</a>
                        {" · "}
                        <a href="#" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>Terms of Service</a>
                    </span>
                </div>
            </footer>
        </div>
    );
}
