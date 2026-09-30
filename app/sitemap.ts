import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/content";

export const dynamic = "force-static";

/** Every page, for search engines. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: [string, number][] = [
    ["", 1],
    ["methodology/", 0.8],
    ["faq/", 0.7],
    ["privacy/", 0.3],
    ["terms/", 0.3],
  ];
  return pages.map(([path, priority]) => ({
    url: `${SITE_URL}/${path}`,
    lastModified: new Date("2026-09-30"),
    changeFrequency: "monthly",
    priority,
  }));
}
