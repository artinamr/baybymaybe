import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/site/LegalPage";
import { CONTACT } from "@/lib/content";

export const metadata: Metadata = {
  title: "Privacy — Nerodyn",
  description: "What personal information the Nerodyn website collects, why, who else sees it, and how to have it corrected or deleted.",
};

const mail = (
  <a className="sp-inline" href={`mailto:${CONTACT.email}`}>
    {CONTACT.email}
  </a>
);

const SECTIONS: LegalSection[] = [
  {
    id: "who",
    title: "Who we are",
    body: (
      <p>
        Nerodyn (“we”, “us”) designs and builds websites, web platforms and AI automation. This policy explains what
        personal information this website collects, why we collect it, and what we do with it. If you have any question
        about it, write to {mail}.
      </p>
    ),
  },
  {
    id: "collect",
    title: "What we collect",
    body: (
      <>
        <p>Only what you choose to give us. When you ask for a free audit or email us, we receive:</p>
        <ul>
          <li>your name and email address;</li>
          <li>your website address, if you give it;</li>
          <li>what you tell us you need, and anything you write in your message.</li>
        </ul>
        <p>
          This website does not use cookies, analytics or advertising trackers, and it does not build a profile of you
          as you browse.
        </p>
      </>
    ),
  },
  {
    id: "use",
    title: "How we use it",
    body: (
      <p>
        To reply to you, to do the audit you asked for, and to keep a record of our conversation. We never sell your
        information, and we never add you to a mailing list you did not ask to join.
      </p>
    ),
  },
  {
    id: "others",
    title: "Who else sees it",
    body: (
      <>
        <p>A small number of services handle it on our behalf, only so that the site and our inbox work:</p>
        <ul>
          <li>
            <strong>FormSubmit</strong> (formsubmit.co) delivers the audit form to our inbox;
          </li>
          <li>
            <strong>GitHub Pages</strong> hosts this website and, like any web host, keeps short-lived technical logs
            (such as IP addresses) for security;
          </li>
          <li>our email provider stores the messages we receive.</li>
        </ul>
        <p>We share it with no one else, unless the law requires us to.</p>
      </>
    ),
  },
  {
    id: "keep",
    title: "How long we keep it",
    body: (
      <p>
        For as long as we need it to help you, or as long as the law requires — then we delete it. You can ask us to
        delete it sooner at any time.
      </p>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <>
        <p>
          You can ask to see the personal information we hold about you, to have it corrected, or to have it deleted.
          Write to {mail} and we will answer promptly.
        </p>
        <p>
          If you are not happy with how we have handled your information, you can complain to the Office of the Privacy
          Commissioner in New Zealand (privacy.org.nz), or to the data-protection authority where you live.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "Keeping it safe",
    body: (
      <p>
        The site is served only over an encrypted connection, and what you send us is kept in private, protected
        accounts. No system on the internet is perfectly secure, but we take reasonable care to protect what you trust
        us with.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: <p>If this policy changes, we will update this page and the date at the top of it.</p>,
  },
];

export default function Privacy() {
  return (
    <LegalPage
      here="privacy"
      kicker="Privacy"
      title="Privacy policy"
      updated="29 September 2026"
      lede="In short: we collect only what you send us, use it only to help you, and never sell it. There are no cookies or trackers on this site."
      sections={SECTIONS}
    />
  );
}
