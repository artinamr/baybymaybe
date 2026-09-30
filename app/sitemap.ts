import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/content";
import { SERVICES } from "@/content/services";

export const dynamic = "force-static";

/** Every published page, for search engines — built from the same registries as the pages. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: [string, number][] = [
    ["", 1],
    ["services/", 0.9],
    ...SERVICES.map((s): [string, number] => [`services/${s.slug}/`, 0.9]),
    ["methodology/", 0.8],
    ["studio/", 0.6],
    ["pricing/", 0.7],
    ["contact/", 0.7],
    ["faq/", 0.6],
    ["privacy/", 0.2],
    ["terms/", 0.2],
  ];
  return pages.map(([path, priority]) => ({
    url: `${SITE_URL}/${path}`,
    lastModified: new Date("2026-09-30"),
    changeFrequency: "monthly",
    priority,
  }));
}
