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

/** What kind of practical tool a section of an article is (the blog's toolkit lists them). */
export type ToolKind = "Checklist" | "Steps" | "Decision path" | "Comparison" | "Template" | "Test";

export type ArticleMeta = {
  slug: string;
  title: string;
  /** For search results: at most 155 characters. */
  description: string;
  /** The two-or-three-sentence answer at the top of the article. It must stand on its own. */
  short: string;
  /**
   * Where the reader is when this is the article they need, in their own
   * words ("We’re comparing quotes for a new website."). It is the article's
   * line on the blog's "Start where you are" list. Optional: give one only to
   * articles that answer a buyer's starting point, and keep that list at six
   * to eight.
   */
  situation?: string;
  /**
   * Who it is for, and when it isn't for you: shown beside the short answer,
   * under "Who it’s for" and "Not for you if". One or two plain sentences each.
   */
  audience: { for: string; skip: string };
  /** The practical tools inside it (a section id from the body's `toc`), listed in the blog's toolkit. */
  tools: { title: string; kind: ToolKind; id: string }[];
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
/** The three October articles: their sources were fetched and checked on this day. */
const CHECKED_1007 = "2026-10-07";

export const ARTICLES: ArticleMeta[] = [
  {
    slug: "redesign-or-improve",
    title: "Website redesign or targeted improvements: how to decide",
    description:
      "When a website needs rebuilding and when it only needs fixing: the signs, a one-week diagnosis you can do yourself, and what to protect if you rebuild.",
    short:
      "Rebuild when the foundations are wrong: what the site says, how it is organised, a platform you can’t change, or speed and accessibility you can’t fix in place. When the foundations are sound and particular pages underperform, improve those pages instead. It is faster and cheaper, and it keeps what the site has already earned.",
    situation: "Our website isn’t bringing in the enquiries it should.",
    audience: {
      for: "Businesses with a website that works, but not well enough, wondering whether to start again.",
      skip: "You don’t have a website yet. Start with what a website quote should include instead.",
    },
    tools: [
      { title: "A one-week website diagnosis", kind: "Steps", id: "diagnosis" },
      { title: "Rebuild or improve: the decision path", kind: "Decision path", id: "deciding" },
    ],
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
    related: { services: ["websites"], work: ["practice-website"], articles: ["website-quote-checklist", "after-launch-ownership", "what-is-seo"] },
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
    situation: "We’re comparing quotes for a new website.",
    audience: {
      for: "Anyone about to ask for, or choose between, quotes for a business website.",
      skip: "You’re happy with your site and only need small changes made to it.",
    },
    tools: [
      { title: "The website quote checklist", kind: "Checklist", id: "the-lines" },
      { title: "Questions to ask before you sign", kind: "Checklist", id: "questions" },
      { title: "Comparing two quotes, line by line", kind: "Comparison", id: "comparing" },
    ],
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
    related: { services: ["websites"], work: ["practice-website"], articles: ["redesign-or-improve", "after-launch-ownership", "diy-website-or-hire"] },
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
    situation: "Client work is buried in email and spreadsheets.",
    audience: {
      for: "Service businesses whose clients send documents, approvals and questions back and forth by email.",
      skip: "Most of your customers buy once and never send you paperwork.",
    },
    tools: [
      { title: "Off the shelf or custom: a comparison", kind: "Comparison", id: "off-the-shelf" },
      { title: "What a portal’s first version should do", kind: "Steps", id: "first-version" },
    ],
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
    situation: "We type the same details into three different systems.",
    audience: {
      for: "Businesses that take enquiries, bookings or payments online and then enter them again somewhere else.",
      skip: "Nearly every enquiry still arrives by phone. Start with the website itself.",
    },
    tools: [
      { title: "A field map you can copy", kind: "Template", id: "field-map" },
      { title: "The connection checklist", kind: "Checklist", id: "checklist" },
    ],
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
    situation: "We want to know where AI could actually help.",
    audience: {
      for: "Small and medium businesses curious about AI, and wary of the hype.",
      skip: "You want to know how AI models work inside. This is about putting them to work.",
    },
    tools: [
      { title: "Is this task a good fit for AI?", kind: "Test", id: "good-fit" },
      { title: "A privacy check before you start", kind: "Steps", id: "privacy" },
    ],
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
    situation: "We’re launching a website, or taking one over.",
    audience: {
      for: "Anyone launching a new site, inheriting one, or unsure who controls theirs.",
      skip: "Your domain, hosting and code are already in your name, with notes on how it all works.",
    },
    tools: [
      { title: "The website handover checklist", kind: "Checklist", id: "handover" },
      { title: "Security basics for a business website", kind: "Checklist", id: "security" },
      { title: "Find out what you own today", kind: "Steps", id: "today" },
    ],
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
  {
    slug: "what-is-seo",
    title: "What is SEO, and what should a small business do first?",
    description:
      "Search engine optimisation in plain words: how Google decides what to show, five jobs worth doing first, how long it takes, and when it pays to hire help.",
    short:
      "SEO (search engine optimisation) is the work of making your website easy for search engines to find, understand and recommend. Most of it is plain work you can do yourself: one clear page per service, the words customers actually type, honest titles and descriptions, a fast site, and being known. Google never charges to appear, results take weeks to months, and no one can guarantee a number-one ranking.",
    situation: "We want more people to find us on Google.",
    audience: {
      for: "Business owners who keep hearing about SEO and want to know what it actually involves before they pay anyone for it.",
      skip: "You need enquiries this week. Search work pays off over months; advertising is the faster tool for that.",
    },
    tools: [
      { title: "Five SEO jobs worth doing first", kind: "Steps", id: "five-jobs" },
      { title: "A page, checked before it goes live", kind: "Checklist", id: "page-check" },
    ],
    topic: "websites",
    keywords: ["what is seo", "search engine optimisation", "seo for small business", "seo new zealand", "how to rank on google", "google search results"],
    published: "2026-10-07",
    minutes: 7,
    cover: PHOTOS["cover-seo"],
    faq: [
      {
        q: "What does SEO stand for?",
        a: "Search engine optimisation: the work of making a website easy for search engines to find, understand and recommend when someone searches for what the business does. It is mostly plain work on the site itself, not a paid placement.",
      },
      {
        q: "How long does SEO take to work?",
        a: "Google’s own guide says some changes take effect in a few hours and others could take several months. Judge a change over weeks rather than days, and give a fair test a month or two before deciding whether it worked.",
      },
      {
        q: "Can I do SEO myself?",
        a: "Yes. One clear page per service, the words customers use, a written title and description for each page, a fast site and Search Console set up are all within reach of any owner. Hiring someone buys speed and technical depth, not a secret method.",
      },
    ],
    related: { services: ["websites"], work: ["practice-website"], articles: ["google-business-profile", "redesign-or-improve"] },
    sources: [
      {
        title: "Doing business online",
        publisher: "Business.govt.nz",
        url: "https://www.business.govt.nz/strategy-and-performance/doing-business-online",
        accessed: CHECKED_1007,
      },
      {
        title: "Do you need an SEO?",
        publisher: "Google Search Central",
        url: "https://developers.google.com/search/docs/fundamentals/do-i-need-seo",
        accessed: CHECKED_1007,
      },
      {
        title: "Search Engine Optimization (SEO) Starter Guide",
        publisher: "Google Search Central",
        url: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide",
        accessed: CHECKED_1007,
      },
      {
        title: "Google Search Essentials",
        publisher: "Google Search Central",
        url: "https://developers.google.com/search/docs/essentials",
        accessed: CHECKED_1007,
      },
      {
        title: "Creating helpful, reliable, people-first content",
        publisher: "Google Search Central",
        url: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
        accessed: CHECKED_1007,
      },
      {
        title: "About Search Console",
        publisher: "Search Console Help (Google)",
        url: "https://support.google.com/webmasters/answer/9128668",
        accessed: CHECKED_1007,
      },
    ],
    status: "published",
  },
  {
    slug: "google-business-profile",
    title: "How to get your business on Google Search and Maps",
    description:
      "Add or claim a Google Business Profile, pass verification, fill in what matters, earn reviews the right way, and keep it working: all of it free.",
    short:
      "A Google Business Profile is the free listing that controls how your business appears on Google Search and Maps. Add or claim it, verify it, keep its hours, services and photos complete and accurate, and reply to every review. Google ranks local results on relevance, distance and prominence, and there is no way to pay for a better place.",
    audience: {
      for: "Any New Zealand business with premises customers can visit, or that travels to its customers.",
      skip: "You sell only online, with no face-to-face contact. Google’s rules leave profiles to businesses customers can visit, or that visit them.",
    },
    tools: [
      { title: "Setting up a Business Profile", kind: "Steps", id: "add-or-claim" },
      { title: "A profile, checked over", kind: "Checklist", id: "keep-it-working" },
    ],
    topic: "websites",
    keywords: ["google business profile", "google my business", "add business to google maps", "get on google maps", "local search new zealand"],
    published: "2026-10-07",
    minutes: 7,
    cover: PHOTOS["cover-gbp"],
    faq: [
      {
        q: "Is a Google Business Profile free?",
        a: "Yes. Google says a profile lets you manage how your business shows up on Maps and Search at no charge, and local ranking can’t be bought either. What agencies charge for is the work of setting it up well and keeping it that way.",
      },
      {
        q: "How long does verification take?",
        a: "It depends on the method Google chooses. A postcard’s code usually arrives within 14 days and expires after 30, and after you apply, review takes up to five business days. Don’t change the business name, address or category while you wait, or the code stops working.",
      },
      {
        q: "Can I pay to rank higher on Google Maps?",
        a: "No. Google states plainly that there is no way to request or pay for a better local ranking. Relevance, distance and popularity decide it, and the parts you can influence are complete details, real reviews and helpful replies.",
      },
    ],
    related: { services: ["websites"], work: ["practice-website"], articles: ["what-is-seo", "after-launch-ownership"] },
    sources: [
      {
        title: "Get started with Google Business Profile",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/7039811",
        accessed: CHECKED_1007,
      },
      {
        title: "Add or claim your Business Profile",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/2911778",
        accessed: CHECKED_1007,
      },
      {
        title: "Tips to improve your local ranking on Google",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/7091",
        accessed: CHECKED_1007,
      },
      {
        title: "Business Profile guidelines",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/3038177",
        accessed: CHECKED_1007,
      },
      {
        title: "Verify your business on Google",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/7107242",
        accessed: CHECKED_1007,
      },
      {
        title: "Tips to get more reviews",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/3474122",
        accessed: CHECKED_1007,
      },
      {
        title: "Protect your business with two-factor authentication (2FA)",
        publisher: "Own Your Online (NCSC)",
        url: "https://www.ownyouronline.govt.nz/business/get-protected/guides/protect-your-business-with-2fa/",
        accessed: CHECKED_1007,
      },
    ],
    status: "published",
  },
  {
    slug: "diy-website-or-hire",
    title: "Build your own website or hire someone: how to decide",
    description:
      "When a site builder is the right answer and when a professional earns their fee, what each path really costs, and what to protect either way.",
    short:
      "Build it yourself when the site’s job is to show what you do and take enquiries, the words and photos exist, and someone enjoys the work: a site builder is then a good answer. Hire when the site must book, take payments or connect to your systems, or when nobody has the hours. Either way, keep the domain and every account in your business’s name.",
    situation: "We need a website and haven’t decided how to build it.",
    audience: {
      for: "Anyone at the very start, weighing a site builder against engaging a professional.",
      skip: "You already have a website and are wondering whether to rebuild it. Start with redesign or improve instead.",
    },
    tools: [
      { title: "DIY or hire: the decision path", kind: "Decision path", id: "deciding" },
      { title: "What each path asks of you", kind: "Comparison", id: "costs" },
    ],
    topic: "websites",
    keywords: ["build your own website", "diy website vs professional", "website builder", "how much to build a website", "hire a web designer", "new zealand"],
    published: "2026-10-07",
    minutes: 6,
    cover: PHOTOS["cover-diy"],
    faq: [
      {
        q: "Is it cheaper to build your own website?",
        a: "In money, usually; in hours, never. A builder’s subscription is small and a professional build is a real invoice, but the hours you spend building and then tending the site are the hidden cost, and they repeat every month the site lives.",
      },
      {
        q: "What does a site builder include?",
        a: "Ready-made templates, a browser editor and the hosting, for one subscription; on Squarespace, trying multiple templates is included with the subscription. The trade is that the tool’s limits are yours, and moving a site out of one takes planning.",
      },
      {
        q: "When should we hire a professional?",
        a: "When the site must take bookings or payments, or connect to your CRM, calendar or accounting; when the words and design have to carry the brand; or when nobody in the business has the hours. Then pay for the build and keep the ownership in writing.",
      },
    ],
    related: { services: ["websites"], work: ["practice-website"], articles: ["website-quote-checklist", "after-launch-ownership"] },
    sources: [
      {
        title: "Doing business online",
        publisher: "Business.govt.nz",
        url: "https://www.business.govt.nz/strategy-and-performance/doing-business-online",
        accessed: CHECKED_1007,
      },
      {
        title: "Switching templates in version 7.0 FAQ",
        publisher: "Squarespace Help",
        url: "https://support.squarespace.com/hc/en-us/articles/206545367",
        accessed: CHECKED_1007,
      },
      {
        title: "Search Engine Optimization (SEO) Starter Guide",
        publisher: "Google Search Central",
        url: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide",
        accessed: CHECKED_1007,
      },
      {
        title: "A ready reference for registrants",
        publisher: "Domain Name Commission",
        url: "https://dnc.org.nz/assets/DocumentLibrary/a_ready_reference_for_registrants.pdf",
        accessed: CHECKED_1007,
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

/** When an article's facts were last checked: the latest date among its sources. */
export const checkedOn = (a: ArticleMeta) => a.sources.reduce((d, s) => (s.accessed > d ? s.accessed : d), a.published);

/** Every distinct page the published articles rest on (the blog's "sources checked" count). */
export const ALL_SOURCES = [...new Map(PUBLISHED.flatMap((a) => a.sources).map((s) => [s.url, s])).values()];

/** The blog's latest date: a publication, a revision or a check. */
export const BLOG_UPDATED = PUBLISHED.map((a) => [a.updated ?? a.published, checkedOn(a)])
  .flat()
  .reduce((d, x) => (x > d ? x : d), "");

export { searchable } from "@/lib/search";

/** "4 October 2026": the dates as people read them here. */
export const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
