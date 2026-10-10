import { CONTACT, FAQ_ALL, PAGES, PLACE, STAGES, abs } from "@/lib/content";
import { SERVICES } from "@/content/services";
import { KIND_LABEL, WORK_ITEMS } from "@/content/work";
import { PUBLISHED } from "@/content/blog";
import { GLOSSARY } from "@/content/blog/glossary";

// Written once at build time into the static export (out/llms.txt).
export const dynamic = "force-static";

/**
 * /llms.txt: the site in plain Markdown for AI assistants and answer engines
 * (the llms.txt convention): who Nerodyn is, what it offers, how it works,
 * the questions it answers and the articles worth citing, each with its
 * address. Built from the same registries as the pages, so it never drifts.
 */
export function GET() {
  const qa = FAQ_ALL.flatMap((g) => g.items);
  const lines = [
    "# Nerodyn",
    "",
    `> Nerodyn is a studio of designers and engineers in ${PLACE.city}, ${PLACE.country}. It designs, builds and looks after websites, platforms (client portals, booking, payments, dashboards and internal tools) and AI automation for small and medium businesses in ${PLACE.country}. Every project is quoted in writing at a fixed price before work starts, and the client owns everything: the code, the domain, the content and every account.`,
    "",
    "Key facts:",
    `- Location: ${PLACE.city}, ${PLACE.country}. Works with businesses across ${PLACE.country}.`,
    `- Contact: ${CONTACT.email}. Replies within two days.`,
    "- First step: a free website audit, a short written answer within two days on what is working, what is costing enquiries, and what Nerodyn would build instead.",
    "- Pricing: no published price list; a fixed quote from a written scope after the audit or a first call.",
    "- Typical website timeline: about fourteen days from first call to launch, in five stages. Platforms and automation are planned in their own quote.",
    "- One team designs and engineers each project, with no account managers and no subcontractors.",
    "",
    "## Services",
    ...SERVICES.map((s) => `- [${s.name}](${abs(PAGES.service(s.slug))}): ${s.description}`),
    `- [Free website audit](${abs(PAGES.audit)}): what is working, what is costing you enquiries, and what we would build instead, within two days.`,
    "",
    "## How a project runs",
    `- [Methodology](${abs(PAGES.methodology)}): five stages, from first call to launch.`,
    ...STAGES.map((s) => `  - ${s.title} (${s.when}): ${s.line} ${s.happens}`),
    `- [Investment](${abs(PAGES.pricing)}): how projects are priced, what moves the price, and the running costs to plan for.`,
    `- [The quiet leak](${abs(PAGES.story)}): a four-minute film (with a full transcript) about where a business loses customers without seeing it: a slow website (Google: 53% of mobile visits are likely to be abandoned if a page takes longer than 3 seconds to load), an inbox answered tomorrow (Harvard Business Review: firms that answered within an hour were nearly seven times as likely to qualify the lead), retyping between systems, and no follow-up; then the same business rebuilt as one system.`,
    "",
    "## Articles",
    ...PUBLISHED.map((a) => `- [${a.title}](${abs(PAGES.article(a.slug))}): ${a.short}`),
    `- [How we write and check our articles](${abs(PAGES.standards)}): primary sources checked on a stated date, no sponsored content or affiliate links, public-domain photographs, corrections shown as updates.`,
    "",
    `## Glossary ([web, platform and AI terms in plain English](${abs(PAGES.glossary)}))`,
    ...GLOSSARY.map((t) => `- **${t.term}**${"also" in t ? ` (${t.also})` : ""}: ${t.def} [${abs(PAGES.glossary)}#${t.id}]`),
    "",
    "## Work (concept websites and studio demonstrations; the businesses are fictional and labelled as such)",
    ...WORK_ITEMS.map(
      (p) =>
        `- [${p.client}: ${p.title}](${abs(PAGES.project(p.slug))}) (${KIND_LABEL[p.kind].toLowerCase()}): ${p.summary}${p.site ? ` The site itself: ${abs(p.site.live)}` : ""}`
    ),
    "",
    "## Questions and answers",
    ...qa.map((it) => `- **${it.q}** ${it.a}`),
    "",
    "## About and contact",
    `- [Studio](${abs(PAGES.studio)}): who Nerodyn works with, how the team is set up, and what it won't do.`,
    `- [Contact](${abs(PAGES.contact)}): ask for a free audit or describe a new project.`,
    `- [All questions](${abs(PAGES.faq)})`,
    "",
    "## Optional",
    `- [Blog index](${abs(PAGES.blog)}) and [RSS feed](${abs(PAGES.blog)}feed.xml)`,
    `- [Privacy policy](${abs(PAGES.privacy)})`,
    `- [Terms of use](${abs(PAGES.terms)})`,
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
