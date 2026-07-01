# Leora

Leora deploys AI agents that monitor whatever you care about — markets, competitors, your team, your hobbies — and send you voice-note updates in your language, voice and cadence, delivered inside the Leora app, Telegram or WhatsApp.

## Stack

- **Next.js 16 (App Router) + React 19** — single full-stack app; UI in `app/`, API routes in `app/api/`.
- **TypeScript**
- **Tailwind CSS v4**
- **NextAuth** (Google OAuth) for sign-in, **Mongoose/MongoDB** for persistence (`models/`).
- **Telegram Bot API** for chat-based delivery (`app/api/telegram-*`, `app/api/send-telegram`).
- Voice briefings are generated on demand from `app/api/news-audio` (live web search + neural TTS) and shown at `/test-agent` ("Ask").

## Getting Started

Add your Google OAuth credentials and Mongo URI to `.env.local`, then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Key routes

- `/` — landing page
- `/signin` — Google sign-in
- `/dashboard` — manage your agents
- `/delivery` — connect Telegram/WhatsApp delivery channels
- `/test-agent` — ask for a one-off voice briefing on any topic
- `/api/agents` — agent data for the dashboard (falls back to placeholder data until a backend is wired up via `BACKEND_URL`)
