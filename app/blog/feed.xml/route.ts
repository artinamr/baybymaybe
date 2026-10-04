import fs from "node:fs";
import path from "node:path";
import { PAGES, SITE_URL, abs } from "@/lib/content";
import { PUBLISHED, topicLabel } from "@/content/blog";

// Written once at build time into the static export (out/blog/feed.xml).
export const dynamic = "force-static";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const rfc822 = (iso: string) => new Date(`${iso}T00:00:00Z`).toUTCString();
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** A cover's size in bytes (RSS enclosures state it), read from public/ at build time. */
function bytes(src: string) {
  try {
    return fs.statSync(path.join(process.cwd(), "public", src.slice(BASE.length))).size;
  } catch {
    return 0;
  }
}

/** The blog as RSS 2.0: every published article, newest first, with its short answer and cover. */
export function GET() {
  const items = PUBLISHED.map((a) => {
    const size = bytes(a.cover.src);
    return `    <item>
      <title>${esc(a.title)}</title>
      <link>${abs(PAGES.article(a.slug))}</link>
      <guid isPermaLink="true">${abs(PAGES.article(a.slug))}</guid>
      <description>${esc(a.short)}</description>
      <category>${esc(topicLabel(a.topic))}</category>
      <pubDate>${rfc822(a.published)}</pubDate>
${size ? `      <enclosure url="${abs(a.cover.src)}" length="${size}" type="image/webp"/>\n` : ""}    </item>`;
  }).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Nerodyn blog</title>
    <link>${abs(PAGES.blog)}</link>
    <atom:link href="${abs(PAGES.blog)}feed.xml" rel="self" type="application/rss+xml"/>
    <description>Plain, checked answers about websites, platforms and AI automation for small and medium businesses in New Zealand.</description>
    <language>en-nz</language>
    <image>
      <url>${SITE_URL}/apple-icon.png</url>
      <title>Nerodyn blog</title>
      <link>${abs(PAGES.blog)}</link>
    </image>
${PUBLISHED[0] ? `    <lastBuildDate>${rfc822(PUBLISHED.map((a) => a.updated ?? a.published).sort().at(-1)!)}</lastBuildDate>\n` : ""}${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
