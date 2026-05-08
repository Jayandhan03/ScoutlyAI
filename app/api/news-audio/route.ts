import { NextResponse } from "next/server";

/**
 * Proxy for POST /api/v1/audio/news on the IndustryEar FastAPI backend.
 *
 * Full pipeline (server-side):
 *   1. Fetch latest articles via RapidAPI / Tavily
 *   2. Summarize into a broadcast-style script via Grok LLM
 *   3. Convert to speech via gTTS
 *   4. Stream the MP3 bytes back to the browser
 *
 * Response:  audio/mpeg  (downloadable .mp3)
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();

        const payload = {
            topic:          body.topic,
            limit:          body.limit          ?? 5,
            time_published: body.time_published ?? "anytime",
            voice_id:       body.voice_id       ?? "en",   // BCP-47 lang code for gTTS
            model_id:       body.model_id       ?? "",
        };

        if (!payload.topic?.trim()) {
            return NextResponse.json(
                { success: false, error: "topic is required" },
                { status: 422 }
            );
        }

        // ── Call the IndustryEar backend ──────────────────────────────
        // In production (Vercel) set the BACKEND_URL env var to your Render URL.
        // Falls back to localhost:8000 for local development.
        const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";
        const backendRes = await fetch(`${BACKEND}/api/v1/audio/news`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(payload),
        });

        if (!backendRes.ok) {
            const errText = await backendRes.text();
            let errDetail: string;
            try {
                const parsed = JSON.parse(errText);
                errDetail = parsed.detail ?? parsed.error ?? errText;
            } catch {
                errDetail = errText;
            }
            return NextResponse.json(
                { success: false, error: errDetail },
                { status: backendRes.status }
            );
        }

        // ── Forward the MP3 stream + headers ─────────────────────────
        const audioBuffer = await backendRes.arrayBuffer();

        const contentDisposition =
            backendRes.headers.get("Content-Disposition") ??
            `attachment; filename="${payload.topic.replace(/\s+/g, "_").slice(0, 40)}_news.mp3"`;

        const extraHeaders: Record<string, string> = {};
        const xTopic        = backendRes.headers.get("X-Topic");
        const xArticleCount = backendRes.headers.get("X-Article-Count");
        if (xTopic)        extraHeaders["X-Topic"]         = xTopic;
        if (xArticleCount) extraHeaders["X-Article-Count"] = xArticleCount;

        return new NextResponse(audioBuffer, {
            status: 200,
            headers: {
                "Content-Type":        "audio/mpeg",
                "Content-Disposition": contentDisposition,
                ...extraHeaders,
            },
        });

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message ?? "Unexpected server error" },
            { status: 500 }
        );
    }
}
