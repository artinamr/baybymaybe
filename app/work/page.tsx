import { Page, Kicker, Title, Closing } from "@/components/site/Page";
import { WorkIndex } from "@/components/work/WorkIndex";
import { PAGES } from "@/lib/content";
import { pageMeta } from "@/lib/meta";
import { KIND_LABEL, WORK_ITEMS } from "@/content/work";
import { service } from "@/content/services";

export const metadata = pageMeta({
  title: "Work",
  description:
    "Explore complete concept websites and working studio demonstrations. Try the interactions, read the decisions and see what a live version would need.",
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
        <Title lines={["Work you can", "put to the test."]} />
        <p className="sp-lede" data-rv>
          Open a website. Approve a sample quote. Review a sample enquiry reply. These concept projects show how
          we think and what we build. The businesses are fictional, and each study explains what works here and what a
          live version would need.
        </p>
        <div className="wk-reading" data-rv>
          <p className="mono">A closer look</p>
          <p>Start with the live work, then read the brief and the decisions behind it.</p>
          <a href="#work-index" className="text-link">Explore the projects <span aria-hidden>↓</span></a>
        </div>
      </section>
      <WorkIndex items={items} />
      <Closing
        title="Bring us your brief."
        line="Send us your website or the job you need it to do. We’ll give you a clear place to start, within two days."
        more={{ label: "See the services", href: PAGES.services }}
      />
    </Page>
  );
}
