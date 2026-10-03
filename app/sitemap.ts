import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/content";
import { SERVICES } from "@/content/services";
import { WORK_ITEMS } from "@/content/work";
import { PUBLISHED } from "@/content/blog";

export const dynamic = "force-static";

/** Every published page, for search engines — built from the same registries as the pages. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: [string, number, string?][] = [
    ["", 1],
    ["services/", 0.9],
    ...SERVICES.map((s): [string, number] => [`services/${s.slug}/`, 0.9]),
    ["work/", 0.9],
    ...WORK_ITEMS.map((p): [string, number] => [`work/${p.slug}/`, 0.8]),
    ["methodology/", 0.8],
    ["blog/", 0.7, PUBLISHED[0]?.published],
    ...PUBLISHED.map((a): [string, number, string] => [`blog/${a.slug}/`, 0.7, a.updated ?? a.published]),
    ["studio/", 0.6],
    ["pricing/", 0.7],
    ["contact/", 0.7],
    ["faq/", 0.6],
    ["privacy/", 0.2],
    ["terms/", 0.2],
  ];
  return pages.map(([path, priority, modified]) => ({
    url: `${SITE_URL}/${path}`,
    lastModified: new Date(modified ?? "2026-09-30"),
    changeFrequency: "monthly",
    priority,
  }));
}
