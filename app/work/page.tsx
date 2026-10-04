import { Page, Kicker, Title, Closing } from "@/components/site/Page";
import { WorkIndex } from "@/components/work/WorkIndex";
import { PAGES } from "@/lib/content";
import { pageMeta } from "@/lib/meta";
import { WORK_ITEMS } from "@/content/work";
import { service } from "@/content/services";

export const metadata = pageMeta({
  title: "Work",
  description:
    "Websites, platforms and AI automation by Nerodyn — each shown as a working demonstration you can click through, with the brief, the decisions and the limits.",
  path: "work/",
});

/** WORK — every project, filterable, each opening its case study. */
export default function Work() {
  const items = WORK_ITEMS.map((p) => ({
    slug: p.slug,
    href: PAGES.project(p.slug),
    client: p.client,
    title: p.title,
    summary: p.summary,
    cover: p.cover,
    coverAlt: p.coverAlt,
    demo: p.kind === "demo",
    services: p.services.map((sl) => ({ slug: sl, name: service(sl)?.name ?? sl })),
  }));
  return (
    <Page here="work" crumbs={[{ name: "Work", href: PAGES.work }]}>
      <section className="sp-hero">
        <Kicker>Work</Kicker>
        <Title lines={["Don’t take our word for it.", "Click through it."]} />
        <p className="sp-lede" data-rv>
          Each project here is a working demonstration: a fictional business, built the way we would build yours, with the brief,
          the decisions and the limits written up plainly. Client projects join them as they launch.
        </p>
      </section>
      <WorkIndex items={items} />
      <Closing
        title="Your project, next."
        line="Start with the free audit — a straight answer on what you have, within two days."
        more={{ label: "See the services", href: PAGES.services }}
      />
    </Page>
  );
}
