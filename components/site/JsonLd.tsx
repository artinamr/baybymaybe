import { CONTACT, FAQ_ALL, SITE_URL } from "@/lib/content";

/**
 * Structured data for search engines and AI assistants: who Nerodyn is and
 * what it offers (home), the questions and their answers (the questions page).
 * A plain script with `<` escaped, as Next's JSON-LD guide has it; built from
 * the same content the pages render, so the two never drift.
 */
function Ld({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function OrgLd() {
  const sameAs = [CONTACT.linkedin, CONTACT.instagram].filter(Boolean);
  const service = (name: string, description: string) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name, description } });
  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "ProfessionalService",
            "@id": `${SITE_URL}/#org`,
            name: "Nerodyn",
            url: `${SITE_URL}/`,
            logo: `${SITE_URL}/apple-icon.png`,
            image: `${SITE_URL}/og.jpg`,
            email: CONTACT.email,
            description:
              "Nerodyn designs, engineers and runs the websites and platforms companies run on — and the AI that works inside them.",
            makesOffer: [
              service("Websites", "Custom-designed, fast websites your team can edit."),
              service("Platforms", "Client portals, dashboards, booking, payments and internal tools."),
              service("AI automation", "Assistants and agents inside your website and your team's tools."),
              service("Free website audit", "What is working, what is costing you enquiries, and what we would build instead — within two days."),
            ],
            ...(sameAs.length ? { sameAs } : {}),
          },
          { "@type": "WebSite", "@id": `${SITE_URL}/#site`, name: "Nerodyn", url: `${SITE_URL}/`, publisher: { "@id": `${SITE_URL}/#org` } },
        ],
      }}
    />
  );
}

export function FaqLd() {
  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQ_ALL.flatMap((g) => g.items).map((it) => ({
          "@type": "Question",
          name: it.q,
          acceptedAnswer: { "@type": "Answer", text: it.a },
        })),
      }}
    />
  );
}
