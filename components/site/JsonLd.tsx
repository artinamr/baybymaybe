import { CONTACT, FAQ_ALL, PAGES, SITE_URL, STAGES, abs } from "@/lib/content";
import { SERVICES } from "@/content/services";
import { LICENCE_URL, type Photo } from "@/content/images";
import { topicLabel, type ArticleMeta } from "@/content/blog";

/**
 * Structured data for search engines and AI assistants: who Nerodyn is, where
 * it works and what it offers (every page carries the organisation and the
 * site), and what each page is (an article, a service, questions and
 * answers, the method's steps). A plain script with `<` escaped, as Next's
 * JSON-LD guide has it; built from the same content the pages render, so the
 * two never drift. Validate with the Rich Results Test / Schema Markup
 * Validator after changing anything here.
 */
function Ld({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

const ORG_ID = `${SITE_URL}/#org`;
const SITE_ID = `${SITE_URL}/#site`;

/** One line about the studio, the same everywhere a machine reads it. */
export const ORG_DESCRIPTION =
  "Nerodyn is an Auckland studio of designers and engineers. It designs, builds and looks after websites, platforms (client portals, booking, payments and internal tools) and AI automation for New Zealand businesses, with everything owned by the client.";

const sameAs = () => [CONTACT.linkedin, CONTACT.instagram].filter(Boolean);

/** The organisation: name, place, how to reach it, what it knows and offers. */
function orgNode(withOffers: boolean) {
  return {
    "@type": "ProfessionalService",
    "@id": ORG_ID,
    name: "Nerodyn",
    url: `${SITE_URL}/`,
    logo: { "@type": "ImageObject", url: `${SITE_URL}/apple-icon.png`, width: 180, height: 180 },
    image: `${SITE_URL}/og.jpg`,
    email: CONTACT.email,
    description: ORG_DESCRIPTION,
    address: { "@type": "PostalAddress", addressLocality: "Auckland", addressRegion: "Auckland", addressCountry: "NZ" },
    areaServed: { "@type": "Country", name: "New Zealand" },
    contactPoint: { "@type": "ContactPoint", contactType: "sales", email: CONTACT.email, areaServed: "NZ", availableLanguage: ["English"] },
    knowsAbout: [
      "Web design",
      "Website development",
      "Web accessibility",
      "Website speed",
      "Technical SEO",
      "Client portals",
      "Online booking and payments",
      "Software integration",
      "AI automation",
      "Business process automation",
    ],
    ...(withOffers
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Services",
            itemListElement: [
              ...SERVICES.map((s) => ({
                "@type": "Offer",
                itemOffered: { "@type": "Service", name: s.name, description: s.description, url: abs(PAGES.service(s.slug)) },
              })),
              {
                "@type": "Offer",
                price: "0",
                priceCurrency: "NZD",
                itemOffered: {
                  "@type": "Service",
                  name: "Free website audit",
                  description: "What is working, what is costing you enquiries, and what we would build instead, in a short written answer within two days.",
                  url: abs(PAGES.audit),
                },
              },
            ],
          },
        }
      : {}),
    publishingPrinciples: abs(PAGES.standards),
    ...(sameAs().length ? { sameAs: sameAs() } : {}),
  };
}

const siteNode = {
  "@type": "WebSite",
  "@id": SITE_ID,
  name: "Nerodyn",
  url: `${SITE_URL}/`,
  inLanguage: "en-NZ",
  description: ORG_DESCRIPTION,
  publisher: { "@id": ORG_ID },
};

/** Every page: who publishes it, and the site it belongs to. */
export function SiteLd() {
  return <Ld data={{ "@context": "https://schema.org", "@graph": [orgNode(false), siteNode] }} />;
}

/** The home page: the organisation with what it offers, the site, and the page itself. */
export function OrgLd() {
  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@graph": [
          orgNode(true),
          siteNode,
          {
            "@type": "WebPage",
            "@id": `${SITE_URL}/#webpage`,
            url: `${SITE_URL}/`,
            name: "Nerodyn: websites, platforms and AI automation, Auckland",
            isPartOf: { "@id": SITE_ID },
            about: { "@id": ORG_ID },
            inLanguage: "en-NZ",
          },
        ],
      }}
    />
  );
}

/**
 * What kind of page this is, for the pages that aren't an article, a service
 * or a list of questions (those say so themselves).
 */
export function PageLd({
  type = "WebPage",
  href,
  name,
  description,
  image,
}: {
  type?: "WebPage" | "AboutPage" | "ContactPage" | "CollectionPage";
  href: string;
  name: string;
  description: string;
  image?: Photo;
}) {
  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@type": type,
        "@id": `${abs(href)}#webpage`,
        url: abs(href),
        name,
        description,
        isPartOf: { "@id": SITE_ID },
        about: { "@id": ORG_ID },
        inLanguage: "en-NZ",
        ...(image ? { primaryImageOfPage: imageNode(image) } : {}),
      }}
    />
  );
}

/** The trail to a page (the visible Crumbs mirror it). */
export function CrumbsLd({ crumbs }: { crumbs: { name: string; href: string }[] }) {
  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: abs(c.href) })),
      }}
    />
  );
}

/** A photograph, with its licence (CC0 or the Public Domain Mark) and who took it. */
function imageNode(p: Photo) {
  return {
    "@type": "ImageObject",
    url: abs(p.src),
    contentUrl: abs(p.src),
    width: p.width,
    height: p.height,
    caption: p.alt,
    creditText: `${p.credit.author} (${p.credit.source})`,
    creator: { "@type": p.credit.org ? "Organization" : "Person", name: p.credit.author, url: p.credit.authorUrl },
    license: LICENCE_URL[p.credit.licence],
    acquireLicensePage: p.credit.page,
  };
}

/** One discipline, offered by the organisation. */
export function ServiceLd({ name, description, href, image }: { name: string; description: string; href: string; image?: Photo }) {
  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@type": "Service",
        "@id": `${abs(href)}#service`,
        name,
        serviceType: name,
        description,
        url: abs(href),
        provider: { "@id": ORG_ID },
        areaServed: { "@type": "Country", name: "New Zealand" },
        audience: { "@type": "BusinessAudience", name: "Small and medium businesses in New Zealand" },
        ...(image ? { image: imageNode(image) } : {}),
      }}
    />
  );
}

/** Questions and answers shown on a page (FAQPage matches what is visible). */
export function QaLd({ items }: { items: { q: string; a: string }[] }) {
  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((it) => ({ "@type": "Question", name: it.q, acceptedAnswer: { "@type": "Answer", text: it.a } })),
      }}
    />
  );
}

export function FaqLd() {
  return <QaLd items={FAQ_ALL.flatMap((g) => g.items)} />;
}

/** How a project runs: the five stages as steps, matching the methodology page. */
export function HowToLd() {
  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@type": "HowTo",
        "@id": `${abs(PAGES.methodology)}#method`,
        name: "How a Nerodyn website project runs, from first call to launch",
        description:
          "Five stages: discover, define, design, build, and launch and care. The days are typical for a website; a platform or an automation is planned stage by stage in its own quote.",
        inLanguage: "en-NZ",
        step: STAGES.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: s.title,
          text: `${s.line} ${s.happens} (${s.when}.)`,
          url: `${abs(PAGES.methodology)}#stage-${s.n}`,
          image: abs(s.photo.src),
        })),
      }}
    />
  );
}

/** An article, matching what the page shows: headline, dates, author (the studio), cover, sources. */
export function ArticleLd({ a, words }: { a: ArticleMeta; words?: number }) {
  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "@id": `${abs(PAGES.article(a.slug))}#article`,
        headline: a.title,
        description: a.description,
        abstract: a.short,
        datePublished: a.published,
        dateModified: a.updated ?? a.published,
        author: { "@type": "Organization", "@id": ORG_ID, name: "Nerodyn", url: abs(PAGES.studio) },
        publisher: { "@id": ORG_ID },
        image: imageNode(a.cover),
        articleSection: topicLabel(a.topic),
        keywords: a.keywords.join(", "),
        timeRequired: `PT${a.minutes}M`,
        ...(words ? { wordCount: words } : {}),
        isAccessibleForFree: true,
        inLanguage: "en-NZ",
        publishingPrinciples: abs(PAGES.standards),
        ...(a.audience ? { audience: { "@type": "BusinessAudience", audienceType: a.audience.for } } : {}),
        isPartOf: { "@type": "Blog", "@id": `${abs(PAGES.blog)}#blog`, name: "Nerodyn blog" },
        mainEntityOfPage: { "@type": "WebPage", "@id": abs(PAGES.article(a.slug)) },
        about: { "@type": "Thing", name: topicLabel(a.topic) },
        citation: a.sources.map((s) => ({ "@type": "CreativeWork", name: s.title, url: s.url, publisher: { "@type": "Organization", name: s.publisher } })),
      }}
    />
  );
}

/** The glossary: a set of defined terms, each with its own address on the page. */
export function GlossaryLd({ name, description, terms }: { name: string; description: string; terms: { id: string; term: string; also?: string; def: string }[] }) {
  const url = abs(PAGES.glossary);
  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@type": "DefinedTermSet",
        "@id": `${url}#terms`,
        name,
        description,
        url,
        inLanguage: "en-NZ",
        publisher: { "@id": ORG_ID },
        hasDefinedTerm: terms.map((t) => ({
          "@type": "DefinedTerm",
          "@id": `${url}#${t.id}`,
          name: t.term,
          ...(t.also ? { alternateName: t.also } : {}),
          description: t.def,
          url: `${url}#${t.id}`,
          inDefinedTermSet: { "@id": `${url}#terms` },
        })),
      }}
    />
  );
}

/** The blog's index: the publication and its articles. */
export function BlogLd({ articles }: { articles: ArticleMeta[] }) {
  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@type": "Blog",
        "@id": `${abs(PAGES.blog)}#blog`,
        name: "Nerodyn blog",
        description: "Plain, checked answers about websites, platforms and AI automation for small and medium businesses in New Zealand.",
        url: abs(PAGES.blog),
        inLanguage: "en-NZ",
        publisher: { "@id": ORG_ID },
        publishingPrinciples: abs(PAGES.standards),
        blogPost: articles.map((a) => ({
          "@type": "BlogPosting",
          headline: a.title,
          description: a.description,
          url: abs(PAGES.article(a.slug)),
          datePublished: a.published,
          dateModified: a.updated ?? a.published,
          image: abs(a.cover.src),
          author: { "@id": ORG_ID },
        })),
      }}
    />
  );
}
