import { Page, Kicker, Title, Closing } from "@/components/site/Page";
import { WorkIndex } from "@/components/work/WorkIndex";
import { PAGES } from "@/lib/content";
import { pageMeta } from "@/lib/meta";
import { PageLd } from "@/components/site/JsonLd";
import { HOME_WORK, KIND_LABEL, WORK_ITEMS } from "@/content/work";
import { service } from "@/content/services";
import { COVER_PREVIEW } from "@/content/coverPreviews";
import { coverName, coverSrcSet } from "@/lib/covers";

const DESCRIPTION = "Explore complete concept websites and working studio demonstrations. Try the interactions, read the decisions and see what a live version would need.";

export const metadata = pageMeta({
  title: "Work",
  description: DESCRIPTION,
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
    srcSet: coverSrcSet(p.cover),
    preview: COVER_PREVIEW[coverName(p.cover)],
    label: KIND_LABEL[p.kind],
    services: p.services.map((sl) => ({ slug: sl, name: service(sl)?.name ?? sl })),
  }));
  return (
    <Page here="work" crumbs={[{ name: "Work", href: PAGES.work }]}>
      <PageLd type="CollectionPage" href={PAGES.work} name="Work" description={DESCRIPTION} />
      <section className="sp-hero wk-hero">
        <Kicker>Work</Kicker>
        <Title lines={["Work you can", "put to the test."]} />
        <p className="sp-lede" data-rv>
          Open a website. Approve a sample quote. Review a sample enquiry reply. These concept projects show how
          we think and what we build. The businesses are fictional, and each study explains what works here and what a
          live version would need.
        </p>
        {/* The live work in the first screen: the three concept sites as phones,
            each opening its case study (cut out by tools/qa/phonecut.py). */}
        <div className="wk-fan" data-rv>
          {HOME_WORK.map((p) => (
            <a key={p.slug} className="wk-fan-p" href={PAGES.project(p.slug)} aria-label={`${p.client}: ${p.title}`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- a static export: no image optimiser to gain */}
              <img src={p.cover.replace(/.webp$/, "-phone.webp")} alt="" width={520} height={1091} decoding="async" />
            </a>
          ))}
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
