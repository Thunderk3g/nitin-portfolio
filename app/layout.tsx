import type { Metadata, Viewport } from "next";
import CinemaMotion from "@/components/CinemaMotion";
import "./globals.css";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Nitin Wagh | Video Editor",
  description:
    "Nitin Wagh is a video editor with 3+ years of experience across reels, long-form videos, SaaS demos and cinematic content.",
  openGraph: { type: "website" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#15171c",
};

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=JetBrains+Mono:wght@400;500;600&family=Manrope:wght@300;400;500;600;700&display=swap";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the Projects page flags deep links on <html> before hydration.
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Non-blocking font load so corporate firewalls/slow CDNs never stall window.onload or /admin */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var l=document.createElement('link');l.rel='stylesheet';l.href=${JSON.stringify(
              GOOGLE_FONTS_URL,
            )};l.media='print';l.onload=function(){l.media='all'};document.head.appendChild(l);}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <CinemaMotion />
        {children}
      </body>
    </html>
  );
}
