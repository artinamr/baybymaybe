import type { Metadata } from "next";
import { PAGES } from "@/lib/content";

// nerodyn.com had a /cookies page. This site sets no cookies, and the privacy
// policy says so; the old address forwards there. GitHub Pages can't send a
// 301, so this is the static equivalent: noindex, a canonical to the new page
// and an immediate refresh (which search engines treat as a permanent move),
// with a link for anyone whose browser waits.
export const metadata: Metadata = {
  title: "Moved to the privacy policy | Nerodyn",
  robots: { index: false, follow: true },
  alternates: { canonical: "privacy/" },
};

export default function Cookies() {
  return (
    <main id="main" className="sp-main moved">
      <meta httpEquiv="refresh" content={`0; url=${PAGES.privacy}`} />
      <p className="sp-lede">
        This page has moved. This site uses no cookies; it is all in the <a href={PAGES.privacy}>privacy policy</a>.
      </p>
    </main>
  );
}
