import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/site/LegalPage";
import { CONTACT } from "@/lib/content";
import { pageMeta } from "@/lib/meta";

export const metadata: Metadata = pageMeta({
  title: "Terms of use",
  description: "The terms of using the Nerodyn website: its content, the free audit, links, liability and the law that applies.",
  path: "terms/",
});

const SECTIONS: LegalSection[] = [
  {
    id: "using",
    title: "Using this website",
    body: (
      <p>
        By using this website you agree to these terms. If you do not agree with them, please do not use the site.
      </p>
    ),
  },
  {
    id: "content",
    title: "Our content",
    body: (
      <p>
        Everything on this website (the words, the design, the 3D work and the code) belongs to Nerodyn unless we say
        otherwise. The photographs are public-domain images (CC0 1.0) from StockSnap. You are
        welcome to view the site and to share links to it; please do not copy, reproduce or reuse our work without our
        written permission.
      </p>
    ),
  },
  {
    id: "information",
    title: "Information, not an offer",
    body: (
      <p>
        What we publish here describes how we usually work. It is general information, not a contract, a quote or
        professional advice for your situation. Any work we do for you is governed by a written agreement that sets out
        its scope, price and timeline.
      </p>
    ),
  },
  {
    id: "audit",
    title: "The free audit",
    body: (
      <p>
        The free audit is an honest, good-faith review of your website. It is our opinion and advice, not a guarantee of
        any result, and asking for one does not commit you to anything.
      </p>
    ),
  },
  {
    id: "links",
    title: "Links to other sites",
    body: <p>Where we link to other websites, it is for your convenience; we are not responsible for their content.</p>,
  },
  {
    id: "liability",
    title: "Liability",
    body: (
      <>
        <p>
          We work to keep this website accurate and available, but we provide it “as is”. As far as the law allows, we
          are not liable for any loss that comes from using it or from relying on what it says.
        </p>
        <p>
          Nothing in these terms takes away any right you have under consumer law that cannot be excluded: in New
          Zealand, under the Consumer Guarantees Act 1993 and the Fair Trading Act 1986.
        </p>
      </>
    ),
  },
  {
    id: "law",
    title: "The law that applies",
    body: <p>These terms are governed by the laws of New Zealand, and the courts of New Zealand have jurisdiction.</p>,
  },
  {
    id: "changes",
    title: "Changes and contact",
    body: (
      <p>
        We may update these terms from time to time; the date at the top shows when they last changed. Questions? Write
        to{" "}
        <a className="sp-inline" href={`mailto:${CONTACT.email}`}>
          {CONTACT.email}
        </a>
        .
      </p>
    ),
  },
];

export default function Terms() {
  return (
    <LegalPage
      here="terms"
      kicker="Terms"
      title="Terms of use"
      updated="29 September 2026"
      lede="The short version: the site and everything on it is ours, what it says is general information, and the audit is free and commits you to nothing."
      sections={SECTIONS}
    />
  );
}
