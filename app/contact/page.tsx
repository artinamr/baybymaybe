import { Page, Kicker } from "@/components/site/Page";
import { AuditForm } from "@/components/contact/AuditForm";
import { PageLd } from "@/components/site/JsonLd";
import { NzTime } from "@/components/site/NzTime";
import { CONTACT, PAGES, PLACE, ogCard } from "@/lib/content";
import { pageMeta } from "@/lib/meta";

const DESCRIPTION =
  "Ask Nerodyn, an Auckland studio, for a free website audit or tell us about a new project: a website, a platform or AI automation. We reply within two days.";

export const metadata = pageMeta({
  title: "Contact: a free website audit or a new project",
  description: DESCRIPTION,
  path: "contact/",
  image: ogCard("contact", "Contact Nerodyn: a free website audit or a new project."),
});

const NEXT = [
  { title: "We read it", body: "The people who would do the work read what you send, not a sales team." },
  { title: "You hear back within two days", body: "With a straight answer, your audit, or a few questions if we need them." },
  { title: "A call, if it helps", body: "Thirty minutes to talk it through. No pitch, and no obligation." },
];

/**
 * CONTACT — the form with its two asks (a free audit or a new project), what
 * happens next, and the email for those who would rather write. The form is
 * #contact here, so the footer leaves its own copy out.
 */
export default function Contact() {
  return (
    <Page here="contact" crumbs={[{ name: "Contact", href: PAGES.contact }]} footerForm={false}>
      <PageLd type="ContactPage" href={PAGES.contact} name="Contact Nerodyn" description={DESCRIPTION} />
      <section className="ct" id="contact" aria-labelledby="ct-title">
        <div className="ct-head">
          <Kicker>Contact</Kicker>
          <h1 id="ct-title" className="sp-h1" data-rv>
            Tell us
            <br />
            <em>what you need.</em>
          </h1>
          <p className="sp-lede" data-rv>
            A free audit of the website you have, or a new project from scratch. Pick one and tell us a little; everything else
            can wait for the reply.
          </p>
        </div>
        <div className="ct-form" data-rv>
          <AuditForm tone="card" intent="choose" />
        </div>
        {/* Below the form on a phone; under the title beside it on a wide screen. */}
        <div className="ct-more">
          <ol className="ct-next" data-rv>
            {NEXT.map((n, i) => (
              <li key={n.title}>
                <span className="mono">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className="item-t">{n.title}</p>
                  <p className="item-b">{n.body}</p>
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
          <p className="ct-place" data-rv>
            <span>
              Based in {PLACE.city}, working with businesses across {PLACE.country}.
            </span>
            <NzTime />
          </p>
        </div>
      </section>
    </Page>
  );
}
