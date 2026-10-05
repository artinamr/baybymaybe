import type { MetadataRoute } from "next";
import { SITE_URL, STAGES, abs } from "@/lib/content";
import { SERVICES } from "@/content/services";
import { WORK_ITEMS } from "@/content/work";
import { PUBLISHED } from "@/content/blog";
import { PHOTOS } from "@/content/images";

export const dynamic = "force-static";

/** When the pages last changed in substance (the round that rewrote them). Bump a page's date when you change it. */
const SITE_UPDATED = "2026-10-05";

type Row = { path: string; priority: number; modified?: string; images?: string[] };

/**
 * Every published page, for search engines, built from the same registries as
 * the pages, with each page's photographs (image sitemap). Old addresses that
 * only redirect (/cookies/) are left out; /audit/ is a real page.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const rows: Row[] = [
    { path: "", priority: 1, images: [`${SITE_URL}/og.jpg`] },
    { path: "services/", priority: 0.9, images: SERVICES.map((s) => abs(s.cardPhoto.src)) },
    ...SERVICES.map((s) => ({ path: `services/${s.slug}/`, priority: 0.9, images: [abs(s.photo.src)] })),
    { path: "audit/", priority: 0.8 },
    { path: "work/", priority: 0.8 },
    ...WORK_ITEMS.map((p) => ({ path: `work/${p.slug}/`, priority: 0.7, images: [abs(p.cover)] })),
    { path: "methodology/", priority: 0.8, images: [abs(PHOTOS["method-hero"].src), ...STAGES.map((s) => abs(s.photo.src))] },
    { path: "blog/", priority: 0.8, modified: PUBLISHED[0]?.updated ?? PUBLISHED[0]?.published },
    ...PUBLISHED.map((a) => ({ path: `blog/${a.slug}/`, priority: 0.7, modified: a.updated ?? a.published, images: [abs(a.cover.src)] })),
    { path: "blog/glossary/", priority: 0.6 },
    { path: "blog/how-we-write/", priority: 0.4 },
    { path: "studio/", priority: 0.6 },
    { path: "pricing/", priority: 0.7 },
    { path: "contact/", priority: 0.7 },
    { path: "faq/", priority: 0.6 },
    { path: "privacy/", priority: 0.2 },
    { path: "terms/", priority: 0.2 },
  ];
  return rows.map((r) => ({
    url: `${SITE_URL}/${r.path}`,
    lastModified: new Date(r.modified && r.modified > SITE_UPDATED ? r.modified : SITE_UPDATED),
    changeFrequency: r.path.startsWith("blog") ? "weekly" : "monthly",
    priority: r.priority,
    ...(r.images?.length ? { images: r.images } : {}),
  }));
}
