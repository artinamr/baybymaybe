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

/** Sources fetched and read during the editorial revision, including primary-source checks. */
const CHECKED_1012 = "2026-10-12";
/** Revised in the accuracy pass of 20 October 2026 (corrections from the research memos). */
const REVISED_1020 = "2026-10-20";

export const ARTICLES: ArticleMeta[] = [
  {
    slug: "redesign-or-improve",
    title: "Should you rebuild your website or improve it?",
    description:
      "Check what needs fixing before paying for a rebuild. A one-week diagnosis, a decision path and the parts of your website worth keeping.",
    short:
      "Rebuild when the message, structure or platform needs to change, or speed and accessibility cannot be fixed in place. If the foundations are sound, improve the pages that underperform. Start with a diagnosis so you keep what already works.",
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
    updated: REVISED_1020,
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
      { title: "About PageSpeed Insights", publisher: "Google for Developers", url: "https://developers.google.com/speed/docs/insights/v5/about", accessed: CHECKED_1012 },
      { title: "Web Vitals", publisher: "web.dev (Google)", url: "https://web.dev/articles/vitals", accessed: CHECKED_1012 },
      {
        title: "Influencing your title links in search results",
        publisher: "Google Search Central",
        url: "https://developers.google.com/search/docs/appearance/title-link",
        accessed: CHECKED_1012,
      },
      { title: "Control your snippets in search results", publisher: "Google Search Central", url: "https://developers.google.com/search/docs/appearance/snippet", accessed: CHECKED_1012 },
      {
        title: "Site moves with URL changes",
        publisher: "Google Search Central",
        url: "https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes",
        accessed: CHECKED_1012,
      },
    ],
    status: "published",
  },
  {
    slug: "website-quote-checklist",
    title: "What a business website quote should include",
    description:
      "A checklist for comparing website quotes: scope, content, design, launch, ownership and ongoing costs, with questions to ask before signing.",
    short:
      "A good quote sets out the work, the content you must supply and how you approve the design. It also covers build standards, connections, launch, ownership, ongoing costs, support and the payment schedule. Get missing details and the process for changes in writing before signing.",
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
    updated: REVISED_1020,
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
      { title: "WCAG 2 Overview", publisher: "W3C Web Accessibility Initiative", url: "https://www.w3.org/WAI/standards-guidelines/wcag/", accessed: CHECKED_1012 },
      { title: "Web Vitals", publisher: "web.dev (Google)", url: "https://web.dev/articles/vitals", accessed: CHECKED_1012 },
      {
        title: "Site moves with URL changes",
        publisher: "Google Search Central",
        url: "https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes",
        accessed: CHECKED_1012,
      },
    ],
    status: "published",
  },
  {
    slug: "when-you-need-a-client-portal",
    title: "When your business needs a client portal",
    description:
      "Work out when client email needs a better home, compare existing software with a custom portal, and plan a useful first version.",
    short:
      "Consider a portal when routine updates, documents and approvals create too much email, and clients need to find information themselves. Try an off-the-shelf tool first if one fits. A custom portal earns its cost when existing software cannot support the way you work.",
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
    keywords: ["client portal", "customer portal", "client portal for small business", "multi-factor authentication", "Privacy Act 2020", "custom portal vs off-the-shelf"],
    published: "2026-10-04",
    updated: REVISED_1020,
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
        title: "Principle 5: Storage and security of information",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/privacy-principles/5/",
        accessed: CHECKED_1012,
      },
      { title: "Critical Controls: Summary", publisher: "National Cyber Security Centre", url: "https://www.ncsc.govt.nz/protect-your-organisation/summary/", accessed: CHECKED_1012 },
      {
        title: "Protect your business with two-factor authentication (2FA)",
        publisher: "Own Your Online (NCSC)",
        url: "https://www.ownyouronline.govt.nz/business/get-protected/guides/protect-your-business-with-2fa/",
        accessed: CHECKED_1012,
      },
      {
        title: "NotifyUs of a serious privacy breach",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/responsibilities/privacy-breaches/notify-us/",
        accessed: CHECKED_1012,
      },
    ],
    status: "published",
  },
  {
    slug: "connect-website-crm-booking",
    title: "Connect your website to your CRM and booking tools",
    description:
      "Plan where enquiries and booking details go, compare the ways to connect your tools, and check consent, errors and handover.",
    short:
      "Connect the repeated work first: enquiries into the CRM, bookings into the calendar or payments into the accounts. Use an official integration where it fits, and write down which field goes where. Record consent and give someone responsibility for connection failures.",
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
    updated: REVISED_1020,
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
        title: "Principle 3: Collection of information directly from subject (what to tell the individual)",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/privacy-principles/3/",
        accessed: CHECKED_1012,
      },
      { title: "Three steps to ensure you are not spamming", publisher: "Department of Internal Affairs", url: "https://www.dia.govt.nz/Spam-Three-Steps", accessed: CHECKED_1012 },
      {
        title: "Principle 5: Storage and security of information",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/privacy-principles/5/",
        accessed: CHECKED_1012,
      },
    ],
    status: "published",
  },
  {
    slug: "ai-automation-workflows",
    title: "Five practical AI automation workflows for NZ businesses",
    description:
      "Five practical workflows for AI, with the input each needs, the checks a person makes and the privacy questions to answer first.",
    short:
      "Start with frequent work that follows rules and can be checked: sorting enquiries, drafting replies, reading documents or updating records. These five workflows show what each needs and where it can fail. Keep a person approving decisions that matter.",
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
    keywords: ["AI automation", "AI for small business", "workflow automation", "ai tools for business", "human in the loop", "Privacy Act 2020 and AI"],
    published: "2026-10-04",
    updated: REVISED_1020,
    minutes: 7,
    cover: PHOTOS["cover-ai"],
    faq: [
      {
        q: "Which business tasks suit AI automation?",
        a: "Work that happens often, follows rules you could write down, can be checked by a person in seconds, and does little harm if it is wrong. Sorting enquiries, reading documents, writing up call notes, answering from approved information and searching your own documents are common starting points.",
      },
      {
        q: "What does the Privacy Act mean for AI tools?",
        a: "It applies to them as it does to everything else. The Privacy Commissioner expects businesses to assess the privacy risks before using a tool, be open with customers about it, have a person review output before acting on it, and keep personal information out of tools that may keep or disclose it. A provider that only processes information for you leaves you responsible for it; one that uses it for its own purposes, such as training its AI, may be receiving a disclosure, with principle 12’s rules if it is overseas.",
      },
      {
        q: "What does AI automation cost to run?",
        a: "There are two costs: building it (the workflow, rules, approved answers, connections, testing and training) and running it. Most AI services charge by how much they process, so running costs rise and fall with your volume. A good build estimates them from your real numbers and sets limits and alerts.",
      },
    ],
    related: { services: ["ai-automation"], work: ["enquiry-desk"], articles: ["connect-website-crm-booking", "when-you-need-a-client-portal", "website-chat-assistant"] },
    sources: [
      {
        title: "Generative Artificial Intelligence",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/resources-and-learning/a-z-topics/ai/generative-artificial-intelligence/",
        accessed: CHECKED_1012,
      },
      {
        title: "Principle 12: Disclosure outside New Zealand",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/privacy-principles/12/",
        accessed: CHECKED_1012,
      },
      {
        title: "Working with third-party providers: understanding your privacy responsibilities",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/resources-and-learning/a-z-topics/working-with-third-party-providers/",
        accessed: "2026-10-20",
      },
      {
        title: "NotifyUs of a serious privacy breach",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/responsibilities/privacy-breaches/notify-us/",
        accessed: CHECKED_1012,
      },
    ],
    status: "published",
  },
  {
    slug: "after-launch-ownership",
    title: "Who owns your website? Domain, hosting, code and support",
    description:
      "Check who controls your domain, hosting, content and code. Use the handover checklist and compare the options for care after launch.",
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
    keywords: ["website ownership", "who owns my website", "website hosting", ".nz domain", "website handover", "website support"],
    published: "2026-10-04",
    updated: REVISED_1020,
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
    related: { services: ["websites", "platforms"], work: ["practice-website"], articles: ["website-quote-checklist", "redesign-or-improve", "website-hacked"] },
    sources: [
      {
        title: "Manage my domain name?",
        publisher: "Domain Name Commission",
        url: "https://dnc.org.nz/tools-and-services/how-do-i-2/manage-my-domain-name/",
        accessed: "2026-10-20",
      },
      {
        title: ".nz Rules",
        publisher: "Domain Name Commission",
        url: "https://dnc.org.nz/about/compliance-and-enforcement/nz-rules/nz-rules/",
        accessed: "2026-10-20",
      },
      {
        title: "Protect your business against ransomware",
        publisher: "Own Your Online (NCSC)",
        url: "https://www.ownyouronline.govt.nz/business/get-protected/guides/protect-your-business-against-ransomware/",
        accessed: CHECKED_1012,
      },
      { title: "Critical Controls: Summary", publisher: "National Cyber Security Centre", url: "https://www.ncsc.govt.nz/protect-your-organisation/summary/", accessed: CHECKED_1012 },
      {
        title: "Protect your business with two-factor authentication (2FA)",
        publisher: "Own Your Online (NCSC)",
        url: "https://www.ownyouronline.govt.nz/business/get-protected/guides/protect-your-business-with-2fa/",
        accessed: CHECKED_1012,
      },
      {
        title: "Secure your website’s domain name",
        publisher: "Own Your Online (NCSC)",
        url: "https://www.ownyouronline.govt.nz/business/get-protected/guides/secure-your-domain-name/",
        accessed: CHECKED_1012,
      },
      {
        title: "Change a domain name holder?",
        publisher: "Domain Name Commission",
        url: "https://dnc.org.nz/tools-and-services/how-do-i-2/change-a-domain-name-holder/",
        accessed: "2026-10-20",
      },
      {
        title: "How a complaint works",
        publisher: "Domain Name Commission",
        url: "https://dnc.org.nz/for-consumers/complaints-about-nz-industry-service-providers/how-it-works/",
        accessed: "2026-10-20",
      },
      {
        title: "Transfer my domain?",
        publisher: "Domain Name Commission",
        url: "https://dnc.org.nz/tools-and-services/how-do-i-2/transfer-my-domain-name/",
        accessed: "2026-10-20",
      },
    ],
    status: "published",
  },
  {
    slug: "what-is-seo",
    title: "What is SEO, and what should a small business do first?",
    description:
      "Understand SEO before paying for it. Start with five useful jobs, check your pages and learn what a provider should explain.",
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
    keywords: ["what is seo", "search engine optimisation", "seo for small business", "seo new zealand", "how to rank on google", "how does google search work"],
    published: "2026-10-07",
    updated: REVISED_1020,
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
        accessed: CHECKED_1012,
      },
      {
        title: "Do you need an SEO?",
        publisher: "Google Search Central",
        url: "https://developers.google.com/search/docs/fundamentals/do-i-need-seo",
        accessed: CHECKED_1012,
      },
      {
        title: "Search Engine Optimization (SEO) Starter Guide",
        publisher: "Google Search Central",
        url: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide",
        accessed: CHECKED_1012,
      },
      {
        title: "Google Search Essentials",
        publisher: "Google Search Central",
        url: "https://developers.google.com/search/docs/essentials",
        accessed: CHECKED_1012,
      },
      {
        title: "Spam policies for Google web search",
        publisher: "Google Search Central",
        url: "https://developers.google.com/search/docs/essentials/spam-policies",
        accessed: "2026-10-20",
      },
      {
        title: "Creating helpful, reliable, people-first content",
        publisher: "Google Search Central",
        url: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
        accessed: CHECKED_1012,
      },
      {
        title: "About Search Console",
        publisher: "Search Console Help (Google)",
        url: "https://support.google.com/webmasters/answer/9128668",
        accessed: CHECKED_1012,
      },
    ],
    status: "published",
  },
  {
    slug: "google-business-profile",
    title: "How to get your business on Google Search and Maps",
    description:
      "Set up a Google Business Profile, check your eligibility, complete verification and keep the details customers rely on up to date.",
    short:
      "A Google Business Profile is the free listing that controls how your business appears on Google Search and Maps. Add or claim it, verify it, keep its hours, services and photos complete and accurate, and reply to every review. Google ranks local results on relevance, distance and popularity, and there is no way to pay for a better place.",
    audience: {
      for: "Any New Zealand business with premises customers can visit, or that travels to its customers.",
      skip: "You sell only online, with no face-to-face contact. Google’s rules leave profiles to businesses customers can visit, or that visit them.",
    },
    tools: [
      { title: "Setting up a Business Profile", kind: "Steps", id: "add-or-claim" },
      { title: "A profile, checked over", kind: "Checklist", id: "keep-it-working" },
    ],
    topic: "websites",
    keywords: ["google business profile", "google my business", "add business to google maps", "get on google maps", "google maps listing", "local search new zealand"],
    published: "2026-10-07",
    updated: REVISED_1020,
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
        accessed: CHECKED_1012,
      },
      {
        title: "Add or claim your Business Profile",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/2911778",
        accessed: CHECKED_1012,
      },
      {
        title: "Tips to improve your local ranking on Google",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/7091",
        accessed: CHECKED_1012,
      },
      {
        title: "Business Profile guidelines",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/3038177",
        accessed: CHECKED_1012,
      },
      {
        title: "Request ownership of a Business Profile",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/4566671",
        accessed: "2026-10-20",
      },
      {
        title: "Verify your business on Google",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/7107242",
        accessed: CHECKED_1012,
      },
      {
        title: "Verify your business with a video recording",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/14271705",
        accessed: "2026-10-20",
      },
      {
        title: "Tips to get more reviews",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/3474122",
        accessed: CHECKED_1012,
      },
      {
        title: "Manage your Business Profile owners & managers",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/3403100",
        accessed: "2026-10-20",
      },
      {
        title: "Protect your business with two-factor authentication (2FA)",
        publisher: "Own Your Online (NCSC)",
        url: "https://www.ownyouronline.govt.nz/business/get-protected/guides/protect-your-business-with-2fa/",
        accessed: CHECKED_1012,
      },
    ],
    status: "published",
  },
  {
    slug: "diy-website-or-hire",
    title: "Build your own website or hire someone: how to decide",
    description:
      "Compare a site builder with hiring a professional, including your time after launch and the ownership details to protect either way.",
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
    keywords: ["build your own website", "diy website vs professional", "website builder", "how much to build a website", "hire a web designer", "website builder vs web designer"],
    published: "2026-10-07",
    updated: REVISED_1020,
    minutes: 6,
    cover: PHOTOS["cover-diy"],
    faq: [
      {
        q: "Is it cheaper to build your own website?",
        a: "Compare the subscription and domain with the quoted build, then count your own setup and maintenance time. DIY can cost less upfront when a suitable tool covers the job, but it still needs someone to write, build and look after it.",
      },
      {
        q: "What does a site builder include?",
        a: "Typically templates, a browser editor and hosting under one subscription. Check the plan’s features and limits, including bookings, payments and export options. On Squarespace, template switching depends on the version you use.",
      },
      {
        q: "When should we hire a professional?",
        a: "When the available tools do not cover your process, the words or design need professional work, or your team does not have time to build and maintain it. Agree the scope, ownership and handover in writing before starting.",
      },
    ],
    related: { services: ["websites"], work: ["practice-website"], articles: ["website-quote-checklist", "after-launch-ownership"] },
    sources: [
      {
        title: "Doing business online",
        publisher: "Business.govt.nz",
        url: "https://www.business.govt.nz/strategy-and-performance/doing-business-online",
        accessed: CHECKED_1012,
      },
      {
        title: "Exporting or Embedding Your Wix Site Elsewhere",
        publisher: "Wix Help Center",
        url: "https://support.wix.com/en/article/exporting-or-embedding-your-wix-site-elsewhere",
        accessed: "2026-10-20",
      },
      {
        title: "Search Engine Optimization (SEO) Starter Guide",
        publisher: "Google Search Central",
        url: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide",
        accessed: CHECKED_1012,
      },
      {
        title: "Manage my domain name?",
        publisher: "Domain Name Commission",
        url: "https://dnc.org.nz/tools-and-services/how-do-i-2/manage-my-domain-name/",
        accessed: "2026-10-20",
      },
      {
        title: "Export your site content",
        publisher: "Squarespace Help",
        url: "https://support.squarespace.com/hc/en-us/articles/206566687-Exporting-your-site",
        accessed: "2026-10-20",
      },
      {
        title: "Transfer my domain?",
        publisher: "Domain Name Commission",
        url: "https://dnc.org.nz/tools-and-services/how-do-i-2/transfer-my-domain-name/",
        accessed: "2026-10-20",
      },
      {
        title: "Get an authentication code (UDAI)?",
        publisher: "Domain Name Commission",
        url: "https://dnc.org.nz/tools-and-services/how-do-i-2/get-a-udai/",
        accessed: "2026-10-20",
      },
    ],
    status: "published",
  },
  {
    slug: "website-hacked",
    title: "What to do if your website is hacked",
    description:
      "The first steps after a break-in, recovery with your host, reporting to the NCSC and assessing whether a privacy breach needs notification.",
    short:
      "Contact your host, record what you’re seeing and contain the problem before restoring from a clean backup. Report the incident to the NCSC and assess any personal information breach: serious harm, or the risk of it, can trigger notification duties. Investigate how the attacker got in and check your recovery plan.",
    audience: {
      for: "Business owners preparing for a website incident or working through one with their hosting provider.",
      skip: "You need immediate technical help. Contact your hosting or IT provider first, then use this as a checklist with them.",
    },
    tools: [
      { title: "If your website is hacked today", kind: "Steps", id: "first" },
      { title: "After the clean-up", kind: "Checklist", id: "next" },
    ],
    topic: "websites",
    keywords: ["website hacked", "what to do if website is hacked", "hacked website fix", "report cyber attack nz", "malware on website", "website security new zealand"],
    published: "2026-10-08",
    updated: REVISED_1020,
    minutes: 7,
    cover: PHOTOS["cover-hacked"],
    faq: [
      {
        q: "How do I know if my website has been hacked?",
        a: "Browser warnings for your visitors, an alert in Google Search Console, pages or admin users you didn’t create, sudden slowness, or email from your domain landing in spam. Your hosting provider’s notice counts too; check it is really from them before clicking anything.",
      },
      {
        q: "Should we pay a ransom to get our website back?",
        a: "No. Own Your Online’s advice is not to pay, even if the amount seems small: “There is no guarantee that you’ll get your data back, and paying a ransom could put you at risk of further attacks.” Paying may also breach sanctions. Restoring from a clean backup is the way back.",
      },
      {
        q: "Do we have to tell customers if our website was hacked?",
        a: "Assess whether the personal information breach has caused or might cause serious harm. The Privacy Commissioner says a breach at that threshold must be notified, ideally within 72 hours of becoming aware. Tell affected people as soon as you can, unless an exception applies; get specialist help if you are unsure.",
      },
    ],
    related: { services: ["websites"], work: ["practice-website"], articles: ["after-launch-ownership", "diy-website-or-hire"] },
    sources: [
      {
        title: "IT risks and scams",
        publisher: "Business.govt.nz",
        url: "https://www.business.govt.nz/operations/it-risks-and-scams",
        accessed: CHECKED_1012,
      },
      {
        title: "Report a cyber security issue",
        publisher: "National Cyber Security Centre",
        url: "https://www.ncsc.govt.nz/report/",
        accessed: CHECKED_1012,
      },
      {
        title: "Protect your business against ransomware",
        publisher: "Own Your Online (NCSC)",
        url: "https://www.ownyouronline.govt.nz/business/get-protected/guides/protect-your-business-against-ransomware/",
        accessed: CHECKED_1012,
      },
      {
        title: "NotifyUs of a serious privacy breach",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/responsibilities/privacy-breaches/notify-us/",
        accessed: CHECKED_1012,
      },
      {
        title: "Protect your business with two-factor authentication (2FA)",
        publisher: "Own Your Online (NCSC)",
        url: "https://www.ownyouronline.govt.nz/business/get-protected/guides/protect-your-business-with-2fa/",
        accessed: CHECKED_1012,
      },
    ],
    status: "published",
  },
  {
    slug: "website-chat-assistant",
    title: "Should our website have a chat assistant?",
    description:
      "Check whether a chat assistant would help your visitors, what it needs to answer safely and who will look after it once it is live.",
    short:
      "Consider a chat assistant when routine questions keep arriving, you have approved written answers and someone will review it after launch. Improve missing or unclear pages first. A trial needs privacy checks, tests of its answers and an easy route to a person.",
    audience: {
      for: "Owners hearing “you need a chatbot” and wanting an honest test before spending on one.",
      skip: "You want an assistant that takes bookings or changes orders. That is automation with higher stakes, and needs more than this article covers.",
    },
    tools: [
      { title: "Should you build one: the test", kind: "Decision path", id: "test" },
      { title: "Before it goes live", kind: "Checklist", id: "live" },
    ],
    topic: "automation",
    keywords: ["chatbot for website", "should i add a chatbot", "ai chat assistant for business", "website live chat", "ai assistant small business nz", "chatbot privacy"],
    published: "2026-10-08",
    updated: REVISED_1020,
    minutes: 7,
    cover: PHOTOS["cover-chat"],
    faq: [
      {
        q: "Does a chat assistant replace our contact page?",
        a: "No. It sits beside it. Some visitors want a person immediately, and the Privacy Commissioner’s guidance expects people to be told how and why the tool is being used. Keep the human path one tap away everywhere the assistant appears.",
      },
      {
        q: "What should a chat assistant answer?",
        a: "The ten questions that arrive every week, answered only from words you have approved, with a link to the page behind each answer. Anything outside the sheet gets a handover to a person rather than an improvisation.",
      },
      {
        q: "Is a chatbot bad for privacy?",
        a: "It depends on the design. Ask visitors not to share personal details in the chat and take them through a form, use a tool you have confirmed doesn’t keep or disclose what it is given, tell visitors plainly, and read the conversations regularly: a live assistant answers before anyone can check it. The Privacy Commissioner also expects a privacy impact assessment first.",
      },
    ],
    related: { services: ["ai-automation"], work: ["enquiry-desk"], articles: ["ai-automation-workflows", "what-is-seo"] },
    sources: [
      {
        title: "Generative Artificial Intelligence",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/resources-and-learning/a-z-topics/ai/generative-artificial-intelligence/",
        accessed: CHECKED_1012,
      },
      {
        title: "Privacy Act 2020: the privacy principles",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/privacy-principles/",
        accessed: CHECKED_1012,
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
