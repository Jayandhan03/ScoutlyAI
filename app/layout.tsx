import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IndustryEar — AI News Audio Generator",
  description:
    "Enter any topic and get an AI-generated, broadcast-quality audio news briefing you can download instantly. Powered by LangChain, Tavily, and neural TTS.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Syne:wght@700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ background: "#070711", color: "#f0f2ff", margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
