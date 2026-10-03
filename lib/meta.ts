import type { Metadata } from "next";

const CARD = { url: "og.jpg", width: 1200, height: 630, alt: "Nerodyn — a polished obsidian stone with light inside it, and the name." };

/**
 * A page's metadata: its title, description, canonical address and share card.
 * (A page's openGraph replaces the layout's rather than merging with it, so
 * every page states its own in full.) `path` is relative to the site root,
 * e.g. "services/websites/" — metadataBase makes it absolute.
 */
export function pageMeta({
  title,
  description,
  path,
  type = "website",
  image,
  published,
  modified,
  feed = false,
}: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  image?: { url: string; width: number; height: number; alt: string };
  published?: string;
  modified?: string;
  /** Announce the blog's feed (the blog's pages). */
  feed?: boolean;
}): Metadata {
  const full = `${title} — Nerodyn`;
  const img = image ?? CARD;
  return {
    title: full,
    description,
    alternates: { canonical: path, ...(feed ? { types: { "application/rss+xml": [{ url: "blog/feed.xml", title: "Nerodyn — Blog" }] } } : {}) },
    openGraph:
      type === "article"
        ? { type, siteName: "Nerodyn", title: full, description, url: path, images: [img], publishedTime: published, modifiedTime: modified, authors: ["Nerodyn"] }
        : { type, siteName: "Nerodyn", title: full, description, url: path, images: [img] },
    twitter: { card: "summary_large_image", title: full, description, images: [img.url] },
  };
}
