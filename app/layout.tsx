import "./globals.css";
import type { Metadata } from "next";
import SessionProvider from "@/components/SessionProvider";

export const metadata: Metadata = {
  title: "Scoutly — AI agents that brief you by voice",
  description:
    "Deploy AI agents that monitor the topics you care about and send you voice-note updates — in your language, voice and cadence — inside the Scoutly app, Telegram or WhatsApp. Built for busy people who need to stay ahead without reading a thing.",
};

/* Set the theme before first paint to avoid a flash of the wrong theme. */
const themeScript = `
(function () {
  try {
    var t = localStorage.getItem('scoutly-theme');
    if (t !== 'light' && t !== 'dark') {
      t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;450;500;550;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
