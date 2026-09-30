import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Geist_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { PAGES, SITE_URL } from "@/lib/content";

// Variable names must never equal an @theme --font-* token (CLAUDE.md gotcha #2).
const isans = Instrument_Sans({
  variable: "--font-isans",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

// The display voice: a Didone whose hairlines and knife-point serifs echo the
// stone's edge highlights. The optical-size axis keeps hairlines razor-thin at
// display sizes and sturdier at text sizes.
const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  display: "swap",
});

const gmono = Geist_Mono({
  variable: "--font-gmono",
  subsets: ["latin"],
  display: "swap",
});

const TITLE = "Nerodyn — Digital infrastructure & AI automation";
const DESCRIPTION =
  "Nerodyn designs, engineers and runs the websites and platforms companies run on — and the AI that works inside them.";

export const metadata: Metadata = {
  metadataBase: new URL(`${SITE_URL}/`),
  title: TITLE,
  description: DESCRIPTION,
  // The card a shared link shows: the stone, the name, the one line.
  openGraph: {
    type: "website",
    siteName: "Nerodyn",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "og.jpg", width: 1200, height: 630, alt: "Nerodyn — a polished obsidian stone with light inside it, and the name." }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["og.jpg"] },
};

export const viewport: Viewport = {
  themeColor: "#F6F5F2",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // data-intro="wait" is server-rendered so the first paint is already the
    // intro's opening frame (no flash of the finished page before JS runs).
    <html lang="en" data-intro="wait" className={`${isans.variable} ${bodoni.variable} ${gmono.variable} antialiased`}>
      <body>
        <noscript>
          <style>{`#loader{display:none!important}[data-rv]{opacity:1!important;transform:none!important;filter:none!important}#stage,#field-card,#stage-frame,.intro,.intro-mask>*{clip-path:none!important;opacity:1!important;transform:none!important;animation:none!important}`}</style>
        </noscript>
        {/* The .ico for Safari and crawlers (Next drops its own favicon link
            under a basePath); sized 32x32 so browsers that read SVG keep
            app/icon.svg. React hoists it into <head>. */}
        <link rel="icon" href={`${PAGES.home}favicon.ico`} sizes="32x32" />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
