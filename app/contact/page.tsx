import { Page, Kicker } from "@/components/site/Page";
import { AuditForm } from "@/components/contact/AuditForm";
import { CONTACT, PAGES } from "@/lib/content";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta({
  title: "Contact",
  description:
    "Ask Nerodyn for a free website audit or tell us about a new project — websites, platforms or AI automation. You’ll hear back within two days.",
  path: "contact/",
});

const NEXT = [
  { title: "We read it", body: "The people who would do the work read what you send — not a sales team." },
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
      <section className="ct" id="contact" aria-labelledby="ct-title">
        <div className="ct-head">
          <Kicker>Contact</Kicker>
          <h1 id="ct-title" className="sp-h1" data-rv>
            Tell us
            <br />
            <em>what you need.</em>
          </h1>
          <p className="sp-lede" data-rv>
            A free audit of the website you have, or a new project from scratch — pick one and tell us a little. Everything else can
            wait for the reply.
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
        </div>
      </section>
    </Page>
  );
}
