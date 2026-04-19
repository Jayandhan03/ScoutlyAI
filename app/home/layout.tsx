"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/");
        }
    }, [status, router]);

    if (status === "loading") {
        return (
            <div style={{
                minHeight: "100vh", background: "var(--bg-base)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexDirection: "column", gap: 20,
            }}>
                {/* Spinner ring */}
                <div style={{ position: "relative", width: 52, height: 52 }}>
                    <div style={{
                        position: "absolute", inset: 0, borderRadius: "50%",
                        border: "2px solid rgba(108,143,255,0.12)",
                    }} />
                    <div style={{
                        position: "absolute", inset: 0, borderRadius: "50%",
                        border: "2px solid transparent",
                        borderTopColor: "var(--accent)",
                        animation: "spin 0.8s linear infinite",
                    }} />
                    <div style={{
                        position: "absolute", inset: 8, borderRadius: "50%",
                        border: "2px solid transparent",
                        borderTopColor: "var(--accent-2)",
                        animation: "spin 1.2s linear infinite reverse",
                    }} />
                </div>
                <span style={{ color: "var(--text-muted)", fontSize: 13, fontWeight: 500, letterSpacing: "0.04em" }}>
                    Loading…
                </span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (status === "unauthenticated") return null;

    return (
        <div className="home-shell">
            {/* ══ NAVBAR ══ */}
            <header className="home-nav">
                <div className="home-nav-inner">

                    {/* Logo */}
                    <Link href="/" style={{
                        display: "flex", alignItems: "center", gap: 10,
                        fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800,
                        color: "var(--text-primary)", textDecoration: "none", letterSpacing: "-0.02em"
                    }}>
                        <span style={{
                            position: "relative", width: 9, height: 9, borderRadius: "50%",
                            background: "var(--accent)",
                            boxShadow: "0 0 12px var(--accent), 0 0 32px rgba(108,143,255,0.4)",
                            display: "inline-block", animation: "pulse-ring 2.5s ease-in-out infinite",
                        }} />
                        YourNews
                    </Link>

                    {/* Nav links */}
                    <nav style={{ display: "flex", alignItems: "center", gap: 36 }}>
                        {["Customization", "Settings", "Preferences"].map((item) => (
                            <a key={item}
                                style={{
                                    fontSize: 13.5, fontWeight: 500,
                                    color: "var(--text-secondary)", textDecoration: "none",
                                    cursor: "pointer", transition: "color 0.2s", letterSpacing: "0.01em"
                                }}
                                onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
                                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}>
                                {item}
                            </a>
                        ))}
                    </nav>

                    {/* Right actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        {session?.user && (
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                {session.user.image ? (
                                    <img
                                        src={session.user.image}
                                        alt={session.user.name ?? "User"}
                                        style={{
                                            width: 32, height: 32, borderRadius: "50%", objectFit: "cover",
                                            border: "2px solid rgba(108,143,255,0.45)",
                                            boxShadow: "0 0 12px rgba(108,143,255,0.25)"
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: 32, height: 32, borderRadius: "50%",
                                        background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 13, fontWeight: 700, color: "#fff",
                                        boxShadow: "0 0 12px rgba(108,143,255,0.3)"
                                    }}>
                                        {session.user.name?.[0]?.toUpperCase() ?? "U"}
                                    </div>
                                )}
                                <span style={{
                                    fontSize: 13, color: "var(--text-secondary)", fontWeight: 500,
                                    maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                                }}>
                                    {session.user.name}
                                </span>
                                <span style={{ color: "var(--border-mid)", fontSize: 16 }}>|</span>
                            </div>
                        )}

                        {/* Sign Out */}
                        <button
                            onClick={() => signOut({ callbackUrl: "/" })}
                            style={{
                                fontSize: 12.5, fontWeight: 600, padding: "8px 18px",
                                borderRadius: "999px", border: "1px solid rgba(255,70,70,0.28)",
                                background: "rgba(255,70,70,0.07)", color: "rgba(255,120,120,0.9)",
                                cursor: "pointer", whiteSpace: "nowrap",
                                transition: "background 0.2s, border-color 0.2s, transform 0.2s",
                                fontFamily: "var(--font-body)",
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,70,70,0.16)";
                                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,70,70,0.5)";
                                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,70,70,0.07)";
                                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,70,70,0.28)";
                                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                            }}
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            {/* PAGE CONTENT */}
            <main style={{ flex: 1 }}>{children}</main>

            {/* ══ FOOTER ══ */}
            <footer style={{
                borderTop: "1px solid var(--border-subtle)",
                padding: "64px 28px 0",
                position: "relative", zIndex: 1,
            }}>
                <div style={{
                    maxWidth: 1160, margin: "0 auto",
                    display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.5fr",
                    gap: 48, paddingBottom: 48
                }}>
                    {/* Brand */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        <div style={{
                            display: "flex", alignItems: "center", gap: 10,
                            fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800,
                            color: "var(--text-primary)"
                        }}>
                            <span style={{
                                width: 9, height: 9, borderRadius: "50%",
                                background: "var(--accent)",
                                boxShadow: "0 0 10px var(--accent)",
                                display: "inline-block"
                            }} />
                            YourNews
                        </div>
                        <p style={{
                            fontSize: 13.5, color: "var(--text-muted)",
                            lineHeight: 1.7, margin: 0
                        }}>
                            AI-powered personalized news intelligence. Designed to eliminate noise and deliver structured signal.
                        </p>
                        <div style={{ display: "flex", gap: 16 }}>
                            {["Twitter", "LinkedIn", "GitHub"].map(s => (
                                <a key={s} href="#" style={{
                                    fontSize: 12.5, color: "var(--text-muted)", textDecoration: "none",
                                    transition: "color 0.2s", fontWeight: 500
                                }}
                                    onMouseEnter={e => (e.currentTarget.style.color = "var(--accent)")}
                                    onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
                                >{s}</a>
                            ))}
                        </div>
                    </div>

                    {/* Product */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <h4 style={{
                            fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                            letterSpacing: "0.1em", color: "var(--text-primary)", margin: 0
                        }}>Product</h4>
                        {["Agent Studio", "Feed Engine", "Voice Delivery", "Channels"].map(l => (
                            <a key={l} href="#" style={{
                                fontSize: 13.5, color: "var(--text-muted)", textDecoration: "none",
                                transition: "color 0.2s"
                            }}
                                onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
                                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
                            >{l}</a>
                        ))}
                    </div>

                    {/* Company */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <h4 style={{
                            fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                            letterSpacing: "0.1em", color: "var(--text-primary)", margin: 0
                        }}>Company</h4>
                        {["About", "Leadership", "Careers", "Contact"].map(l => (
                            <a key={l} href="#" style={{
                                fontSize: 13.5, color: "var(--text-muted)", textDecoration: "none",
                                transition: "color 0.2s"
                            }}
                                onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
                                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
                            >{l}</a>
                        ))}
                    </div>

                    {/* Contact */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <h4 style={{
                            fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                            letterSpacing: "0.1em", color: "var(--text-primary)", margin: 0
                        }}>Contact</h4>
                        {["support@yournews.ai", "press@yournews.ai"].map(l => (
                            <span key={l} style={{ fontSize: 13.5, color: "var(--text-muted)" }}>{l}</span>
                        ))}
                    </div>
                </div>

                <div style={{
                    maxWidth: 1160, margin: "0 auto", padding: "24px 0",
                    display: "flex", justifyContent: "space-between",
                    fontSize: 12.5, color: "var(--text-muted)",
                    borderTop: "1px solid var(--border-subtle)",
                    flexWrap: "wrap", gap: 8
                }}>
                    <span>© {new Date().getFullYear()} YourNews AI. All rights reserved.</span>
                    <span>
                        <a href="#" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Privacy Policy</a>
                        {" · "}
                        <a href="#" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Terms of Service</a>
                    </span>
                </div>
            </footer>

            <style>{`
              @keyframes pulse-ring {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.45; transform: scale(1.35); }
              }
            `}</style>
        </div>
    );
}
