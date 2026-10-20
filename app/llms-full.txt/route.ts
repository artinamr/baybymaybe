import { PAGES, abs } from "@/lib/content";
import { PUBLISHED, checkedOn } from "@/content/blog";
import { BODIES } from "@/content/blog/bodies";

// Written once at build time into the static export (out/llms-full.txt).
export const dynamic = "force-static";

const TOPIC = { websites: "Websites", platforms: "Platforms", automation: "AI automation" } as const;

/**
 * /llms-full.txt: every article in Markdown for AI assistants and answer
 * engines, a step deeper than /llms.txt: its short answer, who it is for,
 * its sections and tools (each with its address), the questions it answers
 * and the sources it cites, with the dates they were checked. Built from the
 * blog's registries (content/blog), so it never drifts from the pages.
 */
export function GET() {
  const lines = [
    "# Nerodyn: the articles in full",
    "",
    `> Plain answers for small and medium businesses in New Zealand deciding about websites, platforms and AI automation, written by Nerodyn (a studio of designers and engineers). Every factual claim is cited to a source checked on the date shown. The site in brief: ${abs(`${PAGES.home}llms.txt`)}. How the articles are written and checked: ${abs(PAGES.standards)}.`,
    "",
  ];
  for (const a of PUBLISHED) {
    const url = abs(PAGES.article(a.slug));
    const toc = BODIES[a.slug]?.toc ?? [];
    lines.push(
      `## ${a.title}`,
      "",
      `- Address: ${url}`,
      `- Topic: ${TOPIC[a.topic]}. Published ${a.published}${a.updated ? `, updated ${a.updated}` : ""}; sources checked ${checkedOn(a)}. About ${a.minutes} minutes to read.`,
      `- Who it is for: ${a.audience.for}`,
      `- Not for you if: ${a.audience.skip}`,
      "",
      `**The short answer.** ${a.short}`,
      ""
    );
    if (toc.length) lines.push("Sections:", ...toc.map((t) => `- [${t.title}](${url}#${t.id})`), "");
    if (a.tools.length) lines.push("Tools in it:", ...a.tools.map((t) => `- ${t.kind}: [${t.title}](${url}#${t.id})`), "");
    if (a.faq.length) lines.push("Questions it answers:", ...a.faq.map((f) => `- **${f.q}** ${f.a}`), "");
    if (a.sources.length)
      lines.push("Sources:", ...a.sources.map((s, i) => `${i + 1}. ${s.publisher}, "${s.title}", ${s.url} (checked ${s.accessed})`), "");
  }
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
