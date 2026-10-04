import { Page, Kicker, Closing } from "@/components/site/Page";
import { AuditForm } from "@/components/contact/AuditForm";
import { QaList } from "@/components/site/QaList";
import { PageLd, QaLd } from "@/components/site/JsonLd";
import { ArticleCard } from "@/components/blog/ArticleCard";
import { CONTACT, FAQ_ALL, PAGES, ogCard } from "@/lib/content";
import { pageMeta } from "@/lib/meta";
import { article, type ArticleMeta } from "@/content/blog";

const DESCRIPTION =
  "Send us your website. Within two days you get a plain, written answer: what works, what is costing you enquiries, and what we would build instead. Free.";

export const metadata = pageMeta({
  title: "Free website audit for NZ businesses",
  description: DESCRIPTION,
  path: "audit/",
  image: ogCard("audit", "A free website audit from Nerodyn: a straight answer within two days."),
});

const LOOK = [
  { title: "On a phone", body: "Most people meet your business on a phone. We check what they see first, and how easily they find what they came for." },
  { title: "In search", body: "How your pages show up in search results, and which pages people actually arrive on." },
  { title: "The route to an enquiry", body: "From the first screen to the form or the phone call, and what happens to an enquiry after it is sent." },
  { title: "Speed and the basics", body: "How quickly the pages load, whether they work for everyone, and anything that is slowing the site down." },
];

const GET = [
  "What is working, and should stay.",
  "What is quietly costing you enquiries.",
  "What we would build instead, and how long it would take.",
];

const QS = ["What does the free audit include?", "What do you need from us to start?", "Can you take over our existing website?", "What does it cost?"];
const QA = QS.map((q) => FAQ_ALL.flatMap((g) => g.items).find((it) => it.q === q)!).filter(Boolean);

const READ = ["redesign-or-improve", "website-quote-checklist"].map((s) => article(s)).filter((x): x is ArticleMeta => Boolean(x));

/**
 * THE FREE AUDIT: the site's one offer, on a page of its own (nerodyn.com's
 * old /audit lands here). What we look at, what you get, the form itself
 * beside the title, the questions people ask, and two articles to read first.
 * The form is #contact here, so the footer leaves its own copy out.
 */
export default function Audit() {
  return (
    <Page crumbs={[{ name: "Free website audit", href: PAGES.audit }]} footerForm={false}>
      <PageLd href={PAGES.audit} name="Free website audit" description={DESCRIPTION} />
      <QaLd items={QA} />
      <section className="ct au" id="contact" aria-labelledby="au-title">
        <div className="ct-head">
          <Kicker>Free website audit</Kicker>
          <h1 id="au-title" className="sp-h1" data-rv>
            Send us your website.
            <br />
            <em>Get a straight answer in two days.</em>
          </h1>
          <p className="sp-lede" data-rv>
            We look at your website the way your customers do, and write down plainly what we find. No pitch, and no
            obligation.
          </p>
        </div>
        <div className="ct-form" data-rv>
          <AuditForm tone="card" intent="audit" />
        </div>
        <div className="ct-more">
          <ol className="ct-next" data-rv>
            {GET.map((g, i) => (
              <li key={g}>
                <span className="mono">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className="item-t">{g}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="ct-direct" data-rv>
            <span>Rather write?</span>
            <a className="ct-email" href={`mailto:${CONTACT.email}`}>
              {CONTACT.email}
            </a>
          </p>
        </div>
      </section>

      <section className="sp-block split" aria-labelledby="au-look-h">
        <header className="split-head">
          <Kicker>What we look at</Kicker>
          <h2 id="au-look-h" className="sp-h2" data-rv>
            Your site, as your customers see it.
          </h2>
        </header>
        <ul className="items">
          {LOOK.map((it, i) => (
            <li key={it.title} data-rv style={{ transitionDelay: `${(i % 2) * 90}ms` }}>
              <span className="item-n mono">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="item-t">{it.title}</h3>
              <p className="item-b">{it.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="sp-block split" aria-labelledby="au-qa-h">
        <header className="split-head">
          <Kicker>Questions</Kicker>
          <h2 id="au-qa-h" className="sp-h2" data-rv>
            Before you send it.
          </h2>
          <p className="split-more" data-rv>
            <a className="text-link" href={PAGES.faq}>
              All questions <span aria-hidden>→</span>
            </a>
          </p>
        </header>
        <div data-rv>
          <QaList items={QA} id="audit-qa" first={0} />
        </div>
      </section>

      {READ.length ? (
        <section className="sp-block bl-related" aria-labelledby="au-read-h">
          <header className="split-head bl-related-head">
            <Kicker>Read first, if you like</Kicker>
            <h2 id="au-read-h" className="sp-h2" data-rv>
              Do your own check.
            </h2>
          </header>
          <div className="bl-grid bl-grid-2">
            {READ.map((a, i) => (
              <ArticleCard key={a.slug} a={a} level="h3" delay={i * 90} sizes="(min-width: 900px) 42vw, 92vw" />
            ))}
          </div>
        </section>
      ) : null}

      <Closing
        title="Not sure it’s worth it?"
        line="It costs nothing, and the write-up is yours to keep whether or not we work together."
        more={{ label: "See how a project runs", href: PAGES.methodology }}
      />
    </Page>
  );
}
