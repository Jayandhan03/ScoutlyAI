"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };
export type ExtractedPrefs = {
  topics: string[];
  keywords: string[];
  region: string;
  summary: string;
};

const QUICK_REPLIES = [
  "🤖 AI & Technology",
  "💰 Finance & Markets",
  "⚽ Sports",
  "🌍 World news",
  "🪙 Crypto",
  "🔬 Science & Space",
];

function TypingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 2px" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: "50%", background: "rgba(180,195,255,0.7)",
          animation: "typingDot 1.2s ease-in-out infinite", animationDelay: `${i * 0.18}s`,
        }} />
      ))}
    </div>
  );
}

function BotAvatar() {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: 9, flexShrink: 0,
      background: "linear-gradient(135deg, #4d7fff, #8b5cf6)",
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
      boxShadow: "0 0 14px rgba(77,127,255,0.35)",
    }}>🧠</div>
  );
}

function Spinner({ size = 15 }: { size?: number }) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size, borderRadius: "50%",
      border: "2px solid rgba(255,255,255,0.25)", borderTopColor: "#fff",
      animation: "spin 0.7s linear infinite", flexShrink: 0,
    }} />
  );
}

export default function PreferencesChat({
  open,
  onClose,
  onSaved,
  initialPrefs,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (prefs: ExtractedPrefs) => Promise<void> | void;
  initialPrefs?: ExtractedPrefs | null;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState<ExtractedPrefs | null>(null);
  const [complete, setComplete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const started = useRef(false);
  // Hidden context (prior saved prefs) prepended to every request when editing.
  const contextRef = useRef<Msg[]>([]);

  useEffect(() => {
    if (!open) { started.current = false; return; }
    if (started.current) return;
    started.current = true;
    setMessages([]);
    setInput("");
    setPrefs(initialPrefs ?? null);
    setComplete(false);
    setError(null);
    contextRef.current = initialPrefs
      ? [{
          role: "user",
          content: `For context, my current saved preferences are topics=[${initialPrefs.topics.join(", ")}], keywords=[${initialPrefs.keywords.join(", ")}], region=${initialPrefs.region}. Greet me and ask if I'd like to keep or change them.`,
        }]
      : [];
    void send([], true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(history: Msg[], isOpening = false) {
    setLoading(true);
    setError(null);
    try {
      const payload = [...contextRef.current, ...history];
      const res = await fetch("/api/preferences/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        return;
      }
      if (data.reply) setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      if (data.preferences) setPrefs(data.preferences);
      setComplete(Boolean(data.complete));
      if (!isOpening) setTimeout(() => inputRef.current?.focus(), 50);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  function pushAndSend(text: string) {
    if (!text.trim() || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text.trim() }];
    setMessages(next);
    setInput("");
    void send(next);
  }

  async function handleSave() {
    if (!prefs) return;
    setSaving(true);
    setError(null);
    try {
      await onSaved(prefs);
      onClose();
    } catch {
      setError("Could not save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const showQuickReplies = !loading && !complete && messages.filter(m => m.role === "user").length === 0;

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 120,
        background: "rgba(0,0,0,0.62)", backdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, animation: "fadeIn 0.25s ease both",
      }}
    >
      <div style={{
        width: "100%", maxWidth: 540, height: "min(660px, 90vh)",
        display: "flex", flexDirection: "column",
        background: "linear-gradient(180deg, rgba(20,20,40,0.98), rgba(15,15,30,0.98))",
        border: "1px solid rgba(77,127,255,0.22)",
        borderRadius: 24, boxShadow: "0 0 90px rgba(77,127,255,0.14), 0 32px 64px rgba(0,0,0,0.55)",
        animation: "modalSlideUp 0.35s cubic-bezier(0.16,1,0.3,1) both",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "18px 22px", borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(77,127,255,0.04)",
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 13,
            background: "linear-gradient(135deg, #4d7fff, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, flexShrink: 0,
            boxShadow: "0 0 22px rgba(77,127,255,0.4)",
          }}>🧠</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Sora', sans-serif", letterSpacing: "-0.02em" }}>
              News Preference Assistant
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(180,200,255,0.6)", marginTop: 1 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 6px #34d399" }} />
              Online · powered by Grok
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(160,175,220,0.6)", fontSize: 15, cursor: "pointer",
            }}
          >✕</button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              display: "flex", gap: 9, alignItems: "flex-end",
              flexDirection: m.role === "user" ? "row-reverse" : "row",
              animation: "msgIn 0.3s cubic-bezier(0.16,1,0.3,1) both",
            }}>
              {m.role === "assistant" && <BotAvatar />}
              <div style={{
                maxWidth: "80%",
                padding: "11px 15px", borderRadius: 16, fontSize: 14, lineHeight: 1.55,
                background: m.role === "user"
                  ? "linear-gradient(135deg, #4d7fff, #8b5cf6)"
                  : "rgba(255,255,255,0.05)",
                color: m.role === "user" ? "#fff" : "rgba(232,237,255,0.94)",
                border: m.role === "user" ? "none" : "1px solid rgba(255,255,255,0.07)",
                borderBottomRightRadius: m.role === "user" ? 5 : 16,
                borderBottomLeftRadius: m.role === "user" ? 16 : 5,
                whiteSpace: "pre-wrap",
              }}>
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", gap: 9, alignItems: "flex-end" }}>
              <BotAvatar />
              <div style={{
                padding: "10px 14px", borderRadius: 16, borderBottomLeftRadius: 5,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)",
              }}>
                <TypingDots />
              </div>
            </div>
          )}

          {/* Quick replies */}
          {showQuickReplies && (
            <div style={{ marginTop: 4, animation: "msgIn 0.4s 0.1s cubic-bezier(0.16,1,0.3,1) both" }}>
              <div style={{ fontSize: 11.5, color: "rgba(160,175,220,0.5)", marginBottom: 8, marginLeft: 4 }}>
                Tap to start, or type your own:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {QUICK_REPLIES.map(q => (
                  <button
                    key={q}
                    onClick={() => pushAndSend(q)}
                    style={{
                      padding: "8px 13px", borderRadius: 999, cursor: "pointer",
                      fontSize: 12.5, fontWeight: 600, fontFamily: "'Inter', sans-serif",
                      background: "rgba(77,127,255,0.08)", border: "1px solid rgba(77,127,255,0.25)",
                      color: "#bcccff", transition: "all 0.18s",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(77,127,255,0.18)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(77,127,255,0.5)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(77,127,255,0.08)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(77,127,255,0.25)"; }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Extracted preferences preview */}
        {prefs && (prefs.topics.length > 0 || complete) && (
          <div style={{
            margin: "0 22px 8px", padding: "13px 15px", borderRadius: 14,
            background: complete ? "rgba(52,211,153,0.08)" : "rgba(77,127,255,0.06)",
            border: `1px solid ${complete ? "rgba(52,211,153,0.28)" : "rgba(77,127,255,0.2)"}`,
            animation: "msgIn 0.3s cubic-bezier(0.16,1,0.3,1) both",
          }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: complete ? "#34d399" : "#8aa3ff", marginBottom: 9 }}>
              {complete ? "✓ Ready to save" : "Captured so far"}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {prefs.topics.map(t => <span key={t} style={chipStyle("#4d7fff")}>{t}</span>)}
              {prefs.keywords.map(k => <span key={k} style={chipStyle("#8b5cf6")}>{k}</span>)}
              {prefs.region && <span style={chipStyle("#38bdf8")}>📍 {prefs.region}</span>}
            </div>
          </div>
        )}

        {error && <div style={{ margin: "0 22px 8px", fontSize: 12.5, color: "#ff7070" }}>⚠ {error}</div>}

        {/* Footer / input */}
        <div style={{ padding: "12px 22px 18px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {complete && prefs && prefs.topics.length > 0 && (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: "100%", height: 48, borderRadius: 13, marginBottom: 11,
                background: saving ? "rgba(52,211,153,0.3)" : "linear-gradient(135deg, #34d399, #10b981)",
                border: "none", color: "#fff", fontSize: 14.5, fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                fontFamily: "'Inter', sans-serif",
                boxShadow: saving ? "none" : "0 0 26px rgba(52,211,153,0.35)",
              }}
            >
              {saving ? <><Spinner /> Saving…</> : "✓ Save these preferences"}
            </button>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && pushAndSend(input)}
              placeholder={complete ? "Want to tweak anything?" : "Type your answer…"}
              disabled={loading}
              autoFocus
              style={{
                flex: 1, height: 48, borderRadius: 13, padding: "0 16px",
                background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#f0f2ff", fontSize: 14, outline: "none", fontFamily: "'Inter', sans-serif",
              }}
              onFocus={e => { e.target.style.borderColor = "rgba(77,127,255,0.5)"; }}
              onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
            />
            <button
              onClick={() => pushAndSend(input)}
              disabled={loading || !input.trim()}
              style={{
                width: 52, height: 48, borderRadius: 13,
                background: loading || !input.trim() ? "rgba(77,127,255,0.25)" : "linear-gradient(135deg, #4d7fff, #8b5cf6)",
                border: "none", color: "#fff", fontSize: 18, fontWeight: 700,
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >➤</button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalSlideUp { from { opacity: 0; transform: translateY(30px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes msgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes typingDot { 0%, 60%, 100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-5px); opacity: 1; } }
      `}</style>
    </div>
  );
}

function chipStyle(color: string): React.CSSProperties {
  return {
    fontSize: 12, fontWeight: 600, padding: "4px 11px", borderRadius: 999,
    color, background: `${color}1a`, border: `1px solid ${color}40`,
  };
}
