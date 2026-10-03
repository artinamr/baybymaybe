import { PAGES, abs } from "@/lib/content";
import { PUBLISHED } from "@/content/blog";

// Written once at build time into the static export (out/blog/feed.xml).
export const dynamic = "force-static";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const rfc822 = (iso: string) => new Date(`${iso}T00:00:00Z`).toUTCString();

/** The blog as RSS 2.0: every published article, newest first. */
export function GET() {
  const items = PUBLISHED.map(
    (a) => `    <item>
      <title>${esc(a.title)}</title>
      <link>${abs(PAGES.article(a.slug))}</link>
      <guid isPermaLink="true">${abs(PAGES.article(a.slug))}</guid>
      <description>${esc(a.description)}</description>
      <pubDate>${rfc822(a.published)}</pubDate>
    </item>`
  ).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Nerodyn — Blog</title>
    <link>${abs(PAGES.blog)}</link>
    <atom:link href="${abs(PAGES.blog)}feed.xml" rel="self" type="application/rss+xml"/>
    <description>Plain, checked answers about websites, platforms and AI automation for small and medium businesses in New Zealand.</description>
    <language>en-nz</language>
${PUBLISHED[0] ? `    <lastBuildDate>${rfc822(PUBLISHED.map((a) => a.updated ?? a.published).sort().at(-1)!)}</lastBuildDate>\n` : ""}${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
