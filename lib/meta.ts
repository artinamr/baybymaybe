import type { Metadata } from "next";

const CARD = { url: "og.jpg", width: 1200, height: 630, alt: "Nerodyn: a polished obsidian stone with light inside it, and the name." };

/** "Websites | Nerodyn": the page first, the name after (search results cut from the right). */
export const titleFor = (title: string) => `${title} | Nerodyn`;

/**
 * A page's metadata: its title, description, canonical address and share card.
 * (A page's openGraph replaces the layout's rather than merging with it, so
 * every page states its own in full.) `path` is relative to the site root,
 * e.g. "services/websites/" — metadataBase makes it absolute. Robots come
 * from the layout (indexed on the real domain, noindex on the preview).
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
  section,
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
  /** An article's topic, for its share card. */
  section?: string;
}): Metadata {
  const full = titleFor(title);
  const img = image ?? CARD;
  const og = { siteName: "Nerodyn", locale: "en_NZ", title: full, description, url: path, images: [img] };
  return {
    title: full,
    description,
    alternates: { canonical: path, ...(feed ? { types: { "application/rss+xml": [{ url: "blog/feed.xml", title: "Nerodyn blog" }] } } : {}) },
    openGraph:
      type === "article"
        ? { ...og, type, publishedTime: published, modifiedTime: modified, authors: ["Nerodyn"], section }
        : { ...og, type },
    twitter: { card: "summary_large_image", title: full, description, images: [img.url] },
  };
}
