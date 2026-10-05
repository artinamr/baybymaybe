import { PAGES } from "@/lib/content";
import { searchable } from "@/lib/search";
import { PUBLISHED } from "@/content/blog";
import { BODIES } from "@/content/blog/bodies";
import { GLOSSARY } from "@/content/blog/glossary";

// Written once at build time into the static export (out/blog/search.json).
export const dynamic = "force-static";

/**
 * /blog/search.json: what the blog's search box matches, fetched only when
 * someone starts to search (so the blog's page doesn't carry it). For each
 * article, everything a reader might type: the words up front, the questions
 * and their answers, its sections, and the glossary terms it goes further
 * into. For the glossary, each term and its other name.
 */
export function GET() {
  const items = PUBLISHED.map((a) => ({
    slug: a.slug,
    text: searchable(
      [
        a.title,
        a.description,
        a.short,
        a.situation ?? "",
        a.keywords.join(" "),
        ...a.faq.flatMap((f) => [f.q, f.a]),
        ...(BODIES[a.slug]?.toc.map((t) => t.title) ?? []),
        ...GLOSSARY.filter((t) => "see" in t && t.see.slug === a.slug).map((t) => `${t.term} ${"also" in t ? t.also : ""}`),
        a.topic,
      ].join(" ")
    ),
  }));
  const words = GLOSSARY.map((t) => ({
    id: t.id,
    term: t.term,
    href: `${PAGES.glossary}#${t.id}`,
    text: searchable(`${t.term} ${"also" in t ? t.also : ""}`),
  }));
  return Response.json({ items, words });
}
