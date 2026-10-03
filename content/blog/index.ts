/**
 * THE BLOG — one registry for every article: what search engines and the
 * index see (title, description, dates, topic), the short answer shown at
 * the top, what it links to, and the pages its facts were checked against.
 * Each article’s words are typed TSX in its own module (content/blog/*.tsx);
 * `status: "draft"` keeps it out of the build, the index, the sitemap and
 * the feed. No invented numbers, clients or results (CLAUDE.md).
 */

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export type Topic = "websites" | "platforms" | "automation";

export const TOPICS: { key: Topic; label: string }[] = [
  { key: "websites", label: "Websites" },
  { key: "platforms", label: "Platforms" },
  { key: "automation", label: "Automation" },
];

export const topicLabel = (t: Topic) => TOPICS.find((x) => x.key === t)?.label ?? t;

export type Source = { title: string; publisher: string; url: string; accessed: string };

export type ArticleMeta = {
  slug: string;
  title: string;
  /** For search results: ≤ 155 characters. */
  description: string;
  /** The two-or-three-sentence answer at the top of the article. */
  short: string;
  topic: Topic;
  /** ISO dates. `updated` only when the article is genuinely revised. */
  published: string;
  updated?: string;
  minutes: number;
  cover: { src: string; alt: string };
  related: { services: string[]; work: string[]; articles: string[] };
  sources: Source[];
  status: "published" | "draft";
};

const cover = (slug: string) => `${BASE}/blog/${slug}.webp`;
const ACCESSED = "2026-10-04";

export const ARTICLES: ArticleMeta[] = [
  {
    slug: "redesign-or-improve",
    title: "Website redesign or targeted improvements: how to decide",
    description:
      "When a website needs rebuilding and when it only needs fixing: the signs, a one-week diagnosis you can do yourself, and what to protect if you rebuild.",
    short:
      "Rebuild when the foundations are wrong: what the site says, how it is organised, a platform you can’t change, or speed and accessibility you can’t fix in place. When the foundations are sound and particular pages underperform, improve those pages instead — it is faster, cheaper and keeps what the site has already earned.",
    topic: "websites",
    published: "2026-10-04",
    minutes: 8,
    cover: { src: cover("redesign-or-improve"), alt: "The Nerodyn stone breaking apart, its pieces flying outward from the glowing core." },
    related: { services: ["websites"], work: ["practice-website"], articles: ["website-quote-checklist", "after-launch-ownership"] },
    sources: [
      { title: "About PageSpeed Insights", publisher: "Google for Developers", url: "https://developers.google.com/speed/docs/insights/v5/about", accessed: ACCESSED },
      { title: "Web Vitals", publisher: "web.dev (Google)", url: "https://web.dev/articles/vitals", accessed: ACCESSED },
      {
        title: "Influencing your title links in search results",
        publisher: "Google Search Central",
        url: "https://developers.google.com/search/docs/appearance/title-link",
        accessed: ACCESSED,
      },
      { title: "Control your snippets in search results", publisher: "Google Search Central", url: "https://developers.google.com/search/docs/appearance/snippet", accessed: ACCESSED },
      {
        title: "Site moves with URL changes",
        publisher: "Google Search Central",
        url: "https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes",
        accessed: ACCESSED,
      },
    ],
    status: "published",
  },
  {
    slug: "website-quote-checklist",
    title: "What a business website quote should include",
    description:
      "The lines a good website quote has — scope, content, standards, launch, ownership, running costs and changes — plus red flags and how to compare quotes.",
    short:
      "A good quote says exactly what will be built, who supplies the words and pictures, how designs are approved, what it connects to, the accessibility and speed standard, what happens at launch, who owns what afterwards, what it costs to run, how support works, when you pay, and how changes are handled. If a line is missing, ask for it in writing before you sign.",
    topic: "websites",
    published: "2026-10-04",
    minutes: 7,
    cover: { src: cover("website-quote-checklist"), alt: "The pieces of the stone settling into an exploded view, each one finding its exact place." },
    related: { services: ["websites"], work: ["practice-website"], articles: ["redesign-or-improve", "after-launch-ownership"] },
    sources: [
      { title: "WCAG 2 Overview", publisher: "W3C Web Accessibility Initiative", url: "https://www.w3.org/WAI/standards-guidelines/wcag/", accessed: ACCESSED },
      { title: "Web Vitals", publisher: "web.dev (Google)", url: "https://web.dev/articles/vitals", accessed: ACCESSED },
      {
        title: "Site moves with URL changes",
        publisher: "Google Search Central",
        url: "https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes",
        accessed: ACCESSED,
      },
    ],
    status: "published",
  },
  {
    slug: "when-you-need-a-client-portal",
    title: "When your business needs a client portal",
    description:
      "Five signs email has become the bottleneck, when an off-the-shelf portal is the right answer, what the first version should do, and the security basics.",
    short:
      "When the same questions, documents and approvals pass between you and your clients often enough that email has become the bottleneck — and your clients would rather look things up themselves. Often an off-the-shelf tool is the right first step; a custom portal earns its cost when your work doesn’t fit one.",
    topic: "platforms",
    published: "2026-10-04",
    minutes: 7,
    cover: { src: cover("when-you-need-a-client-portal"), alt: "The pieces of the stone laid one by one as the steps of a spiral stair." },
    related: { services: ["platforms"], work: ["operations-portal"], articles: ["connect-website-crm-booking", "after-launch-ownership"] },
    sources: [
      {
        title: "Principle 5 — Storage and security of personal information",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/privacy-principles/5/",
        accessed: ACCESSED,
      },
      { title: "Critical Controls: Summary", publisher: "National Cyber Security Centre", url: "https://www.ncsc.govt.nz/protect-your-organisation/summary/", accessed: ACCESSED },
      {
        title: "Protect your business with two-factor authentication (2FA)",
        publisher: "Own Your Online (NCSC)",
        url: "https://www.ownyouronline.govt.nz/business/get-protected/guides/protect-your-business-with-2fa/",
        accessed: ACCESSED,
      },
      {
        title: "Privacy breaches: notify us",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/responsibilities/privacy-breaches/notify-us/",
        accessed: ACCESSED,
      },
    ],
    status: "published",
  },
  {
    slug: "connect-website-crm-booking",
    title: "Connecting your website to your CRM and booking tools",
    description:
      "Connect forms, bookings, your CRM and accounts so each detail is entered once: the options, a field map, consent, and knowing when a connection fails.",
    short:
      "Connect them so each piece of information is entered once: an enquiry form goes into the CRM, a booking goes into the calendar and the CRM, a payment goes into the accounts. Use each tool’s official integration where it does the job, write down which field goes where, record consent properly, and make sure someone is told when a connection fails.",
    topic: "platforms",
    published: "2026-10-04",
    minutes: 7,
    cover: { src: cover("connect-website-crm-booking"), alt: "The pieces of the stone turned into the blades of a turbine, turning as one." },
    related: { services: ["platforms", "websites"], work: ["operations-portal", "practice-website"], articles: ["when-you-need-a-client-portal", "ai-automation-workflows"] },
    sources: [
      {
        title: "Principle 3 — Collection of information from the individual",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/privacy-principles/3/",
        accessed: ACCESSED,
      },
      { title: "Spam: three steps", publisher: "Department of Internal Affairs", url: "https://www.dia.govt.nz/Spam-Three-Steps", accessed: ACCESSED },
      {
        title: "Principle 5 — Storage and security of personal information",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/privacy-principles/5/",
        accessed: ACCESSED,
      },
    ],
    status: "published",
  },
  {
    slug: "ai-automation-workflows",
    title: "Five practical AI automation workflows for NZ businesses",
    description:
      "Where AI automation earns its keep in a small or medium business: five workflows, where a person stays in the loop, what can go wrong, and privacy.",
    short:
      "Start with work that is frequent, follows rules and can be checked: sorting and drafting replies to enquiries, reading details out of documents, turning call notes into CRM records, a website assistant that answers only from approved information, and searching your own documents. Keep a person approving anything that matters.",
    topic: "automation",
    published: "2026-10-04",
    minutes: 7,
    cover: { src: cover("ai-automation-workflows"), alt: "The glowing core of the stone rising through a spiral of turning blades." },
    related: { services: ["ai-automation"], work: ["enquiry-desk"], articles: ["connect-website-crm-booking", "when-you-need-a-client-portal"] },
    sources: [
      {
        title: "Generative Artificial Intelligence",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/resources-and-learning/a-z-topics/ai/generative-artificial-intelligence/",
        accessed: ACCESSED,
      },
      {
        title: "Principle 12 — Disclosure of personal information outside New Zealand",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/privacy-principles/12/",
        accessed: ACCESSED,
      },
      {
        title: "Privacy breaches: notify us",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/responsibilities/privacy-breaches/notify-us/",
        accessed: ACCESSED,
      },
    ],
    status: "published",
  },
  {
    slug: "after-launch-ownership",
    title: "After launch: website ownership, hosting and support",
    description:
      "What owning your website means — domain, code, content and accounts in your name — plus a handover checklist, backups, security and support options.",
    short:
      "Own the domain, the code, the content and every account in your own name. Know where the site is hosted, how it is backed up and who fixes what when something breaks. Then decide how much ongoing care you want — a monthly arrangement, or help when you ask for it.",
    topic: "websites",
    published: "2026-10-04",
    minutes: 7,
    cover: { src: cover("after-launch-ownership"), alt: "The stone whole again, standing on the floor above its own reflection." },
    related: { services: ["websites", "platforms"], work: ["practice-website"], articles: ["website-quote-checklist", "redesign-or-improve"] },
    sources: [
      {
        title: "A ready reference for registrants",
        publisher: "Domain Name Commission",
        url: "https://dnc.org.nz/assets/DocumentLibrary/a_ready_reference_for_registrants.pdf",
        accessed: ACCESSED,
      },
      {
        title: "Protect your business against ransomware",
        publisher: "Own Your Online (NCSC)",
        url: "https://www.ownyouronline.govt.nz/business/get-protected/guides/protect-your-business-against-ransomware/",
        accessed: ACCESSED,
      },
      { title: "Critical Controls: Summary", publisher: "National Cyber Security Centre", url: "https://www.ncsc.govt.nz/protect-your-organisation/summary/", accessed: ACCESSED },
      {
        title: "Protect your business with two-factor authentication (2FA)",
        publisher: "Own Your Online (NCSC)",
        url: "https://www.ownyouronline.govt.nz/business/get-protected/guides/protect-your-business-with-2fa/",
        accessed: ACCESSED,
      },
      {
        title: "Secure your website’s domain name",
        publisher: "Own Your Online (NCSC)",
        url: "https://www.ownyouronline.govt.nz/business/get-protected/guides/secure-your-domain-name/",
        accessed: ACCESSED,
      },
    ],
    status: "published",
  },
];

/** What the site shows: published only, newest first (registry order breaks a tie). */
export const PUBLISHED: ArticleMeta[] = ARTICLES.map((a, i) => ({ a, i }))
  .filter(({ a }) => a.status === "published")
  .sort((x, y) => y.a.published.localeCompare(x.a.published) || x.i - y.i)
  .map(({ a }) => a);

export const article = (slug: string) => PUBLISHED.find((a) => a.slug === slug);

/** "4 October 2026" — the dates as people read them here. */
export const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
