import { notFound } from "next/navigation";
import { Article } from "@/components/blog/Article";
import { pageMeta } from "@/lib/meta";
import { ogCard } from "@/lib/content";
import { PUBLISHED, article, topicLabel } from "@/content/blog";
import { BODIES } from "@/content/blog/bodies";

// Only published articles exist; drafts and anything else under /blog/ are a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return PUBLISHED.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const a = article((await params).slug);
  if (!a) return {};
  return pageMeta({
    title: a.title,
    description: a.description,
    path: `blog/${a.slug}/`,
    type: "article",
    published: a.published,
    modified: a.updated ?? a.published,
    image: ogCard(`blog-${a.slug}`, a.cover.alt),
    feed: true,
    section: topicLabel(a.topic),
  });
}

/** AN ARTICLE: its registry entry and its words (content/blog). */
export default async function BlogArticle({ params }: { params: Promise<{ slug: string }> }) {
  const a = article((await params).slug);
  const body = a ? BODIES[a.slug] : undefined;
  if (!a || !body) notFound();
  const { Body, toc } = body;
  return (
    <Article a={a} toc={toc}>
      <Body />
    </Article>
  );
}
