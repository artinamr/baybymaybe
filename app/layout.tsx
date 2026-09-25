import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Geist_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "Nerodyn — Digital infrastructure & AI automation",
  description:
    "Nerodyn designs, engineers and runs the websites and platforms companies run on — and the AI that works inside them.",
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
          <style>{`#stage,#field-card,#stage-frame,.intro,.intro-mask>*{clip-path:none!important;opacity:1!important;transform:none!important;animation:none!important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
