import type { ReactNode } from "react";
import { Page, Crumbs, Closing } from "@/components/site/Page";
import { PageLd } from "@/components/site/JsonLd";
import { CONTACT, PAGES, ogCard } from "@/lib/content";
import { pageMeta } from "@/lib/meta";

const DESCRIPTION =
  "How the Nerodyn blog is researched, checked and corrected: primary sources, dated checks, no sponsored content, licence-free photographs and plain English.";

export const metadata = pageMeta({
  title: "How we write and check our articles",
  description: DESCRIPTION,
  path: "blog/how-we-write/",
  image: ogCard("blog-how-we-write", "How the Nerodyn blog is researched, checked and corrected."),
});

const mail = (subject: string, label: ReactNode) => (
  <a href={`mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}`}>{label}</a>
);

/**
 * The blog's standards, in public: who writes, how facts are checked, what
 * we won't do, and how to tell us we're wrong. It promises only what
 * docs/BLOG-GUIDE.md (binding on every article, enforced in part by the
 * build) already requires; keep the two in step. The client signs it off.
 */
const SECTIONS: { id: string; title: string; body: ReactNode }[] = [
  {
    id: "who",
    title: "Who writes them",
    body: (
      <p>
        The Nerodyn studio in Auckland: the designers and engineers who build websites, platforms and automation for
        New Zealand businesses. We write about the decisions our clients ask us about, for owners and managers who want
        to understand a choice before they make it.
      </p>
    ),
  },
  {
    id: "promise",
    title: "What every article has to do",
    body: (
      <ul>
        <li>Answer one real question completely, even when the honest answer is that you don’t need us.</li>
        <li>Give the answer first: a short answer at the top that stands on its own.</li>
        <li>Say who it is for, and who can skip it.</li>
        <li>Include something you can use: a checklist, a set of steps, a comparison or a decision path.</li>
        <li>Use plain New Zealand English, and New Zealand’s laws, agencies and spelling wherever they apply.</li>
      </ul>
    ),
  },
  {
    id: "checking",
    title: "How we check the facts",
    body: (
      <>
        <p>
          Every fact that isn’t our own experience is checked against a primary source on the day it is written: the
          legislation, the regulator (the Privacy Commissioner, the Domain Name Commission, the National Cyber Security
          Centre), the standards body (the W3C) or the documentation of the product concerned. A small number in the text
          links to the source, and every source is listed at the end of the article with the date it was checked.
        </p>
        <p>
          We don’t cite other agencies’ blogs, AI chat answers, or anything we couldn’t open and read in full. If a claim
          can’t be confirmed, it comes out.
        </p>
      </>
    ),
  },
  {
    id: "wont",
    title: "What we won’t do",
    body: (
      <ul>
        <li>Publish sponsored articles, use affiliate links, or take payment to mention a product.</li>
        <li>Invent numbers, clients, quotes, results or case studies. Our work examples are concept websites and demonstrations for fictional businesses, and say so.</li>
        <li>Use generated images or our own marketing imagery as illustrations.</li>
        <li>Give legal advice. We say what the law and the regulators say, and link to them; for your own contract or situation, talk to a lawyer.</li>
      </ul>
    ),
  },
  {
    id: "photos",
    title: "Photographs",
    body: (
      <p>
        Every photograph is from outside the studio and free of copyright restrictions (CC0 or public domain). We
        check each one’s licence page before using it, reject anything with a watermark, a logo or a recognisable person
        as its subject, and credit the photographer at the end of the article even though the licence doesn’t require it.
      </p>
    ),
  },
  {
    id: "tools",
    title: "Software and AI",
    body: (
      <p>
        We may use software, including AI tools, to help research, draft and check. A person on the team checks every
        claim against its source and approves every article before it is published.
      </p>
    ),
  },
  {
    id: "current",
    title: "Keeping articles current",
    body: (
      <p>
        When something an article relies on changes (a law, a guideline, how a product works), we update the article,
        check every source again and show the date it was updated at the top.
      </p>
    ),
  },
  {
    id: "corrections",
    title: "Corrections",
    body: (
      <p>
        If you spot something wrong or out of date, {mail("A correction for the blog", "email us")}. We’ll check it, fix
        it if we got it wrong, and show the date of the change. You don’t need to give your name.
      </p>
    ),
  },
  {
    id: "using",
    title: "Quoting our articles",
    body: (
      <p>
        You’re welcome to quote a sentence or two with a link back to the article. Please don’t republish whole articles.
        To suggest a question we should answer, {mail("A question for the blog", "send it to us")}.
      </p>
    ),
  },
];

/** HOW WE WRITE: the blog's editorial standards, in the shape of the legal pages (sections alongside). */
export default function HowWeWrite() {
  const crumbs = [
    { name: "Blog", href: PAGES.blog },
    { name: "How we write", href: PAGES.standards },
  ];
  return (
    <Page here="blog" crumbs={crumbs}>
      <PageLd type="AboutPage" href={PAGES.standards} name="How we write and check our articles" description={DESCRIPTION} />
      <section className="sp-hero sp-hero-s">
        <Crumbs crumbs={crumbs} />
        <h1 className="sp-h1 hw-h1" data-rv>
          How we write
          <br />
          <em>and check our articles.</em>
        </h1>
        <p className="sp-lede" data-rv>
          The blog is here to help you decide, whether or not you ever work with us. These are the rules every article
          follows.
        </p>
      </section>
      <div className="doc">
        <nav className="doc-toc" aria-label="Sections">
          <p className="doc-toc-h">On this page</p>
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`}>
              {s.title}
            </a>
          ))}
        </nav>
        <div className="doc-body lg-body hw-body">
          {SECTIONS.map((s, i) => (
            <section key={s.id} id={s.id} className="lg-sec" aria-labelledby={`${s.id}-h`}>
              <h2 id={`${s.id}-h`} className="lg-h">
                <span className="mono">{String(i + 1).padStart(2, "0")}</span>
                {s.title}
              </h2>
              {s.body}
            </section>
          ))}
        </div>
      </div>
      <Closing
        title="Have a question we haven’t answered?"
        line="Ask it with the free audit, or on its own. We reply to every message within two days."
        more={{ label: "Back to the blog", href: PAGES.blog }}
      />
    </Page>
  );
}
