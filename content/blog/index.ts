/**
 * THE BLOG: one registry for every article. It holds what search engines and
 * the index see (title, description, dates, topic, keywords), the short answer
 * shown at the top, the cover photograph (content/images.ts, with its credit),
 * a few questions answered in a line or two (shown at the end, and marked up
 * for search), what the article links to, and the pages its facts were checked
 * against. Each article's words are typed TSX in its own module
 * (content/blog/*.tsx); `status: "draft"` keeps it out of the build, the
 * index, the sitemap and the feed.
 *
 * Writing or editing an article? docs/BLOG-GUIDE.md is binding: no em dashes,
 * plain New Zealand English, licence-safe outside photographs, every fact
 * cited, sources at the end. `npm run build` runs the copy check
 * (scripts/copy-guard.mjs) and fails on a breach.
 */

import { PHOTOS, type Photo } from "@/content/images";

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
  /** For search results: at most 155 characters. */
  description: string;
  /** The two-or-three-sentence answer at the top of the article. It must stand on its own. */
  short: string;
  topic: Topic;
  /** What people search for when this article is the answer (structured data). */
  keywords: string[];
  /** ISO dates. `updated` only when the article is genuinely revised. */
  published: string;
  updated?: string;
  minutes: number;
  /** An outside photograph, never the site's own imagery (content/images.ts). */
  cover: Photo;
  /** Short questions and answers shown before the sources (and as FAQPage data). Plain, and true to the article. */
  faq: { q: string; a: string }[];
  related: { services: string[]; work: string[]; articles: string[] };
  /** Numbered in the order the article first cites them. */
  sources: Source[];
  status: "published" | "draft";
};

const ACCESSED = "2026-10-04";

export const ARTICLES: ArticleMeta[] = [
  {
    slug: "redesign-or-improve",
    title: "Website redesign or targeted improvements: how to decide",
    description:
      "When a website needs rebuilding and when it only needs fixing: the signs, a one-week diagnosis you can do yourself, and what to protect if you rebuild.",
    short:
      "Rebuild when the foundations are wrong: what the site says, how it is organised, a platform you can’t change, or speed and accessibility you can’t fix in place. When the foundations are sound and particular pages underperform, improve those pages instead. It is faster and cheaper, and it keeps what the site has already earned.",
    topic: "websites",
    keywords: ["website redesign", "website improvements", "rebuild or refresh a website", "Core Web Vitals", "301 redirects", "New Zealand small business website"],
    published: "2026-10-04",
    minutes: 8,
    cover: PHOTOS["cover-redesign"],
    faq: [
      {
        q: "How do I know if my website needs a rebuild rather than a refresh?",
        a: "Look at the foundations, not the look. Plan a rebuild if the site no longer describes the business you run, your team can’t change it or it isn’t in your name, or every page is slow whatever you remove. If the problems sit on particular pages, fix those pages first.",
      },
      {
        q: "Will a new website hurt our Google rankings?",
        a: "It can, if addresses change carelessly. Keep the address of every page that already ranks, send each old address that does change to its closest new page with a permanent redirect, and expect rankings to move about for a few weeks while Google recrawls the site.",
      },
      {
        q: "What should we fix first if we keep the current site?",
        a: "The first screen of the home page and each service page, one clear page per service, the route an enquiry takes, page speed (usually oversized images and unused scripts), and each page’s title and description. Change one thing at a time and note the date, so you can see what worked.",
      },
    ],
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
      "The lines a good website quote has (scope, content, standards, launch, ownership, running costs and changes), plus red flags and how to compare quotes.",
    short:
      "A good quote says exactly what will be built, who supplies the words and pictures, how designs are approved, what it connects to, the accessibility and speed standard, what happens at launch, who owns what afterwards, what it costs to run, how support works, when you pay, and how changes are handled. If a line is missing, ask for it in writing before you sign.",
    topic: "websites",
    keywords: ["website quote", "web design quote", "website proposal checklist", "website cost", "website ownership", "New Zealand"],
    published: "2026-10-04",
    minutes: 7,
    cover: PHOTOS["cover-quote"],
    faq: [
      {
        q: "Why do website quotes vary so much?",
        a: "Because “a website” covers very different amounts of work: how much is designed from scratch, who writes the words, what the site connects to, the standard it is built to, and what happens after launch. Compare quotes line by line, not by their totals.",
      },
      {
        q: "What should a website quote include?",
        a: "The scope (and what is not included), who supplies content, how design is approved, integrations, a named accessibility and speed standard, launch tasks, ownership and handover, running costs, support, the payment schedule, how changes are handled, and the dates with what they depend on.",
      },
      {
        q: "Is a fixed price realistic for a website?",
        a: "Yes, when the scope is written precisely, the quote says what you provide and by when, and every change is priced and approved before any work on it starts. Then the price only moves when you agree to change the scope.",
      },
    ],
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
      "When the same questions, documents and approvals pass between you and your clients so often that email has become the bottleneck, and your clients would rather look things up themselves. An off-the-shelf tool is often the right first step. A custom portal earns its cost when your work doesn’t fit one.",
    topic: "platforms",
    keywords: ["client portal", "customer portal", "custom portal vs off-the-shelf", "multi-factor authentication", "Privacy Act 2020", "New Zealand business software"],
    published: "2026-10-04",
    minutes: 7,
    cover: PHOTOS["cover-portal"],
    faq: [
      {
        q: "What is a client portal?",
        a: "A private place, behind a login, where each client sees their own work with you: what is happening, what they need to provide, what needs their approval and what they owe. Your team sees the same information for every client at once.",
      },
      {
        q: "Should we buy an off-the-shelf portal or build our own?",
        a: "Start with off-the-shelf software if one fits the way you work: it is quicker and cheaper, and you will learn what you really need. A custom portal earns its cost when your work has stages no product models, when it must join up systems you rely on, or when per-user pricing grows faster than your business.",
      },
      {
        q: "What security does a client portal need?",
        a: "At least individual accounts, two-step sign-in (compulsory for staff), roles so each client sees only their own work, a record of who did what, and a plan for reporting a serious privacy breach. New Zealand’s Privacy Act 2020 expects reasonable security safeguards for personal information.",
      },
    ],
    related: { services: ["platforms"], work: ["operations-portal"], articles: ["connect-website-crm-booking", "after-launch-ownership"] },
    sources: [
      {
        title: "Principle 5: Storage and security of personal information",
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
    keywords: ["CRM integration", "website booking system", "connect website to CRM", "field mapping", "Unsolicited Electronic Messages Act", "New Zealand"],
    published: "2026-10-04",
    minutes: 7,
    cover: PHOTOS["cover-connect"],
    faq: [
      {
        q: "What is the best way to connect a website to a CRM?",
        a: "Use the tools’ own integration when one exists and does the job. Use a connector service for simple rules that change often, and a custom integration for core processes, unusual cases or high volumes. Whichever you choose, use each system’s official, documented way in.",
      },
      {
        q: "Can we add everyone who enquires to our newsletter?",
        a: "Not automatically. In New Zealand, commercial electronic messages need consent (express, inferred or deemed) under the Unsolicited Electronic Messages Act 2007. An enquiry is not a newsletter sign-up, so record marketing consent separately, with the date and the wording the person agreed to, and make sure unsubscribes reach the CRM.",
      },
      {
        q: "How do we know if a connection has stopped working?",
        a: "Design it to tell you. Store every submission before it is passed on, retry temporary failures, send anything that still fails to a named person, and once a week compare the number of form submissions with the number of new CRM enquiries.",
      },
    ],
    related: { services: ["platforms", "websites"], work: ["operations-portal", "practice-website"], articles: ["when-you-need-a-client-portal", "ai-automation-workflows"] },
    sources: [
      {
        title: "Principle 3: Collection of information from the individual",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/privacy-principles/3/",
        accessed: ACCESSED,
      },
      { title: "Spam: three steps", publisher: "Department of Internal Affairs", url: "https://www.dia.govt.nz/Spam-Three-Steps", accessed: ACCESSED },
      {
        title: "Principle 5: Storage and security of personal information",
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
    keywords: ["AI automation", "AI for small business", "workflow automation", "human in the loop", "Privacy Act 2020 and AI", "New Zealand"],
    published: "2026-10-04",
    minutes: 7,
    cover: PHOTOS["cover-ai"],
    faq: [
      {
        q: "Which business tasks suit AI automation?",
        a: "Work that happens often, follows rules you could write down, can be checked by a person in seconds, and does little harm if it is wrong. Sorting enquiries, reading documents, writing up call notes, answering from approved information and searching your own documents are common starting points.",
      },
      {
        q: "What does the Privacy Act mean for AI tools?",
        a: "It applies to them as it does to everything else. The Privacy Commissioner expects businesses to assess the privacy risks before using a tool, be open with customers about it, have a person review output before acting on it, and keep personal information out of tools that may keep or disclose it. Sending information overseas has its own rules, in principle 12.",
      },
      {
        q: "What does AI automation cost to run?",
        a: "There are two costs: building it (the workflow, rules, approved answers, connections, testing and training) and running it. Most AI services charge by how much they process, so running costs rise and fall with your volume. A good build estimates them from your real numbers and sets limits and alerts.",
      },
    ],
    related: { services: ["ai-automation"], work: ["enquiry-desk"], articles: ["connect-website-crm-booking", "when-you-need-a-client-portal"] },
    sources: [
      {
        title: "Generative Artificial Intelligence",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/resources-and-learning/a-z-topics/ai/generative-artificial-intelligence/",
        accessed: ACCESSED,
      },
      {
        title: "Principle 12: Disclosure of personal information outside New Zealand",
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
      "What owning your website means (domain, code, content and accounts in your name), plus a handover checklist, backups, security and support options.",
    short:
      "Own the domain, the code, the content and every account in your own name. Know where the site is hosted, how it is backed up and who fixes what when something breaks. Then decide how much ongoing care you want: a monthly arrangement, or help when you ask for it.",
    topic: "websites",
    keywords: ["website ownership", "web hosting", "website support", ".nz domain", "website backups", "website security"],
    published: "2026-10-04",
    minutes: 7,
    cover: PHOTOS["cover-ownership"],
    faq: [
      {
        q: "Who should own our website’s domain name?",
        a: "Your business. For .nz names, the Domain Name Commission says that anyone registering a domain on your behalf must register it in your name, not theirs. You can check whose name it is in with a WHOIS search on its website.",
      },
      {
        q: "What should we receive when a website is handed over?",
        a: "The domain, DNS, hosting, code, editor, analytics, Search Console and every paid service in your business’s name, with your own logins, plus a page or two of plain notes on how it all works and who to call.",
      },
      {
        q: "How do we move a .nz domain to another provider?",
        a: "Ask your current registrar for the domain’s UDAI, a code that confirms the transfer. They must give it to you promptly and at no cost. Moving registrar doesn’t automatically end other contracts with the old provider, such as hosting.",
      },
    ],
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

/** "4 October 2026": the dates as people read them here. */
export const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
