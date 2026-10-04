import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { INDEXABLE, PAGES, SITE_URL } from "@/lib/content";

// Variable names must never equal an @theme --font-* token (CLAUDE.md gotcha #2).
// One family for every voice, the way Apple sets SF Pro: Inter's optical-size
// axis gives headlines its Display cut (tighter, finer) and reading sizes its
// Text cut (open, sturdy) automatically, by size.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  axes: ["opsz"],
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
  // The GitHub Pages preview stays out of search; the real domain is indexed.
  ...(INDEXABLE ? {} : { robots: { index: false, follow: true } }),
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
    <html lang="en-NZ" data-intro="wait" className={`${inter.variable} ${gmono.variable} antialiased`}>
      <body>
        <noscript>
          <style>{`#loader{display:none!important}[data-rv]{opacity:1!important;transform:none!important;filter:none!important}#stage,#field-card,#stage-frame,.intro,.intro-mask>*{clip-path:none!important;opacity:1!important;transform:none!important;animation:none!important}[data-chapter=potential]{visibility:visible!important}`}</style>
        </noscript>
        {/* The .ico for Safari and crawlers (Next drops its own favicon link
            under a basePath); sized 32x32 so browsers that read SVG keep
            app/icon.svg. React hoists it into <head>. */}
        <link rel="icon" href={`${PAGES.home}favicon.ico`} sizes="32x32" />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
        {/* The first screen's reveal starts as soon as the page is parsed, not
            when its scripts arrive (on a slow phone that was seconds of a blank
            hero): whatever is already in view rises in now; the rest waits for
            the scroll as before (SubReveal, PageReveal). Two frames later, so
            the hidden start has been painted and the rise plays as before (a
            change before the first frame shows at once, without transition). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){var h=innerHeight,a=[];document.querySelectorAll('[data-rv]').forEach(function(e){var r=e.getBoundingClientRect();if(r.height&&r.top<h*.9&&r.bottom>0)a.push(e)});a.length&&requestAnimationFrame(function(){requestAnimationFrame(function(){a.forEach(function(e){e.setAttribute('data-in','1')})})})})()",
          }}
        />
      </body>
    </html>
  );
}
