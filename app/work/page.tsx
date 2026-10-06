import { Page, Kicker, Title, Closing } from "@/components/site/Page";
import { WorkIndex } from "@/components/work/WorkIndex";
import { PAGES } from "@/lib/content";
import { pageMeta } from "@/lib/meta";
import { KIND_LABEL, WORK_ITEMS } from "@/content/work";
import { service } from "@/content/services";

export const metadata = pageMeta({
  title: "Work",
  description:
    "Three complete websites you can click through, and working demonstrations of a client portal and an AI enquiry desk, each with the brief and the decisions.",
  path: "work/",
});

/** WORK — every project, filterable, each opening its case study. */
export default function Work() {
  const items = WORK_ITEMS.map((p) => ({
    slug: p.slug,
    kind: p.kind,
    href: PAGES.project(p.slug),
    client: p.client,
    title: p.title,
    summary: p.summary,
    cover: p.cover,
    coverAlt: p.coverAlt,
    label: KIND_LABEL[p.kind],
    services: p.services.map((sl) => ({ slug: sl, name: service(sl)?.name ?? sl })),
  }));
  return (
    <Page here="work" crumbs={[{ name: "Work", href: PAGES.work }]}>
      <section className="sp-hero">
        <Kicker>Work</Kicker>
        <Title lines={["Don’t take our word for it.", "Click through it."]} />
        <p className="sp-lede" data-rv>
          Three complete websites, and working pieces of a platform and an automation. The businesses are fictional; the
          work is real, built the way we would build yours, and every one of them runs here for you to try. Client projects
          join them as they launch.
        </p>
      </section>
      <WorkIndex items={items} />
      <Closing
        title="Your project, next."
        line="Start with the free audit: a straight answer on what you have, within two days."
        more={{ label: "See the services", href: PAGES.services }}
      />
    </Page>
  );
}
