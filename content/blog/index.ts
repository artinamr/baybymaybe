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
  /** The title in search results and the browser tab when the title is too long for them (the page title plus " | Nerodyn" stays within 60 characters). */
  seoTitle?: string;
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
      "Before paying for a new website, check its four foundations: a one-week diagnosis, a decision path, and how to keep your search traffic if you rebuild.",
    short:
      "Improve the website you have unless one of its foundations needs replacing: it no longer describes your business, its software can’t be updated to a supported version, or every page is slow whatever you remove. A domain or account held by someone else doesn’t need a new site: have it moved into your business’s name. Spend a week measuring first, so you keep the pages that already bring in work.",
    situation: "Our website isn’t bringing in the enquiries it should.",
    audience: {
      for: "Businesses with a website that works, but not well enough, wondering whether to start again.",
      skip: "You don’t have a website yet. Start with whether to build it yourself or hire someone.",
    },
    tools: [
      { title: "A one-week website diagnosis", kind: "Steps", id: "diagnosis" },
      { title: "Rebuild or improve: the decision path", kind: "Decision path", id: "deciding" },
      { title: "Protecting search traffic in a rebuild", kind: "Checklist", id: "protect" },
    ],
    topic: "websites",
    keywords: [
      "website redesign or refresh",
      "should I rebuild my website",
      "website audit checklist",
      "301 redirects",
      "PageSpeed Insights",
      "New Zealand small business website",
    ],
    published: "2026-10-04",
    updated: REVISED_1020,
    minutes: 9,
    cover: PHOTOS["cover-redesign"],
    faq: [
      {
        q: "How do I know if my website needs a rebuild or just improvements?",
        a: "Check four foundations: whether it describes the business you run today, whether it’s in your name and your team can edit it, whether its software still gets security updates, and whether its speed problems are confined to a few pages. If none is broken, improve the pages your week of checks pointed to. If one is, repair it first. If two or more are, or the only repair is a new theme or platform, get a rebuild priced alongside the list of fixes.",
      },
      {
        q: "Will a new website hurt our Google rankings?",
        a: "It can, if addresses change carelessly. Keep the address of every page that already ranks, and give each changed address a permanent redirect to its closest new page, never all to the home page, kept for as long as possible, generally at least a year. On launch day, check the new site isn’t still hidden from search engines. Google says rankings may fluctuate while it recrawls, and a small to medium-sized site can take a few weeks for most pages to move.",
      },
      {
        q: "Our old web designer registered our domain. Do we need a new website?",
        a: "Not for that alone. For a .nz name, the Domain Name Commission says your business should be listed as the registrant, and if your web developer is listed instead, to contact your registrar to have it transferred. If you believe the name is yours and the holder won’t transfer it, the Commission has a dispute resolution service. A rebuild only comes into it if the site itself is locked to its provider’s platform.",
      },
    ],
    related: { services: ["websites"], work: ["practice-website"], articles: ["website-quote-checklist", "after-launch-ownership", "what-is-seo"] },
    sources: [
      { title: "Supported Versions", publisher: "PHP (php.net)", url: "https://www.php.net/supported-versions.php", accessed: "2026-10-20" },
      { title: "Requirements", publisher: "WordPress.org", url: "https://wordpress.org/about/requirements/", accessed: "2026-10-20" },
      {
        title: "Protect your website",
        publisher: "Own Your Online (NCSC)",
        url: "https://www.ownyouronline.govt.nz/business/get-protected/guides/protect-your-website/",
        accessed: "2026-10-20",
      },
      {
        title: "Manage my domain name?",
        publisher: "Domain Name Commission",
        url: "https://dnc.org.nz/tools-and-services/how-do-i-2/manage-my-domain-name/",
        accessed: "2026-10-20",
      },
      {
        title: "Change a domain name holder?",
        publisher: "Domain Name Commission",
        url: "https://dnc.org.nz/tools-and-services/how-do-i-2/change-a-domain-name-holder/",
        accessed: "2026-10-20",
      },
      { title: "[GA4] Landing page report", publisher: "Google Analytics Help", url: "https://support.google.com/analytics/answer/12931766", accessed: "2026-10-20" },
      { title: "[GA4] About key events", publisher: "Google Analytics Help", url: "https://support.google.com/analytics/answer/9267568", accessed: "2026-10-20" },
      {
        title: "Mobile site and mobile-first indexing best practices",
        publisher: "Google Search Central",
        url: "https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing",
        accessed: "2026-10-20",
      },
      { title: "About PageSpeed Insights", publisher: "Google for Developers", url: "https://developers.google.com/speed/docs/insights/v5/about", accessed: "2026-10-20" },
      { title: "Web Vitals", publisher: "web.dev (Google)", url: "https://web.dev/articles/vitals", accessed: "2026-10-20" },
      {
        title: "Easy Checks: A First Review of Web Accessibility (draft)",
        publisher: "W3C Web Accessibility Initiative",
        url: "https://www.w3.org/WAI/test-evaluate/easy-checks/",
        accessed: "2026-10-20",
      },
      {
        title: "Performance report (Search results): Overview and basic setup",
        publisher: "Search Console Help (Google)",
        url: "https://support.google.com/webmasters/answer/7576553",
        accessed: "2026-10-20",
      },
      {
        title: "Influencing your title links in search results",
        publisher: "Google Search Central",
        url: "https://developers.google.com/search/docs/appearance/title-link",
        accessed: "2026-10-20",
      },
      { title: "Control your snippets in search results", publisher: "Google Search Central", url: "https://developers.google.com/search/docs/appearance/snippet", accessed: "2026-10-20" },
      {
        title: "How to move a site",
        publisher: "Google Search Central",
        url: "https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes",
        accessed: "2026-10-20",
      },
      {
        title: "Changing your hosting",
        publisher: "Google Search Central",
        url: "https://developers.google.com/search/docs/crawling-indexing/site-move-no-url-changes",
        accessed: "2026-10-20",
      },
    ],
    status: "published",
  },
  {
    slug: "website-quote-checklist",
    title: "What a business website quote should include",
    description:
      "A checklist for comparing website quotes in New Zealand: scope, content, standards, ownership, running costs, the law and questions to ask before you sign.",
    short:
      "Compare website quotes line by line, not by their totals. A good quote is a fixed price for a written scope that says who supplies the content, how you approve the design, the standard it’s built to, who owns the domain, code, words and accounts, what it will cost to run and what support you get. Consumer law may not protect a business buying a website, so get every missing line in writing before you sign.",
    situation: "We’re comparing quotes for a new website.",
    audience: {
      for: "Anyone about to ask for, or choose between, quotes for a business website.",
      skip: "You’re happy with your site and only need small changes made to it.",
    },
    tools: [
      { title: "The website quote checklist", kind: "Checklist", id: "the-lines" },
      { title: "Questions to ask before you sign", kind: "Checklist", id: "questions" },
      { title: "Comparing two quotes, line by line", kind: "Comparison", id: "comparing" },
      { title: "A one-page brief to send for quotes", kind: "Template", id: "what-to-send" },
    ],
    topic: "websites",
    keywords: ["website quote", "web design quote checklist", "compare website quotes", "website proposal", "who owns my website", "New Zealand"],
    published: "2026-10-04",
    updated: REVISED_1020,
    minutes: 9,
    cover: PHOTOS["cover-quote"],
    faq: [
      {
        q: "Why do website quotes vary so much?",
        a: "Because “a website” covers very different amounts of work: how much is designed, who writes the words, what it connects to, the standard it’s built and tested to, and what happens after launch. Compare quotes line by line, put a price on each gap, and only then compare the totals.",
      },
      {
        q: "Who owns a website we pay someone to build?",
        a: "Check your agreement first. New Zealand’s Copyright Act makes the person who commissions and pays for certain work, including a computer program and a photograph, its first owner, but only subject to any agreement to the contrary, and written words aren’t on its list. So get ownership of the design, code, words and photos, and of the domain and accounts, written into the quote.",
      },
      {
        q: "What’s the difference between a quote and an estimate?",
        a: "Consumer Protection describes a quote as an offer to do a job for a specified price, and an estimate as the provider’s best guess of what the job will cost. Once you accept a quote, the provider can’t charge you more unless you agree to extra work or the scope changes. Ask which you’re being given, and whether it includes GST.",
      },
    ],
    related: { services: ["websites"], work: ["practice-website"], articles: ["redesign-or-improve", "after-launch-ownership", "diy-website-or-hire"] },
    sources: [
      {
        title: "Quotes and estimates",
        publisher: "Consumer Protection (MBIE)",
        url: "https://www.consumerprotection.govt.nz/general-help/guide-to-buying-smart/quotes-and-estimates",
        accessed: "2026-10-20",
      },
      { title: "WCAG 2 Overview", publisher: "W3C Web Accessibility Initiative", url: "https://www.w3.org/WAI/standards-guidelines/wcag/", accessed: "2026-10-20" },
      { title: "Implement", publisher: "W3C Web Accessibility Initiative", url: "https://www.w3.org/WAI/planning-and-managing/implement/", accessed: "2026-10-20" },
      { title: "Web Vitals", publisher: "web.dev (Google)", url: "https://web.dev/articles/vitals", accessed: "2026-10-20" },
      {
        title: "Manage my domain name?",
        publisher: "Domain Name Commission",
        url: "https://dnc.org.nz/tools-and-services/how-do-i-2/manage-my-domain-name/",
        accessed: "2026-10-20",
      },
      { title: "Web fonts from Adobe Fonts", publisher: "Adobe Fonts Help", url: "https://helpx.adobe.com/fonts/using/webfont-licensing.html", accessed: "2026-10-20" },
      {
        title: "Protect your website",
        publisher: "Own Your Online (NCSC)",
        url: "https://www.ownyouronline.govt.nz/business/get-protected/guides/protect-your-website/",
        accessed: "2026-10-20",
      },
      {
        title: "What is a privacy statement? What do I need to include in a privacy statement?",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/resources-and-learning/knowledge-base/view/312/",
        accessed: "2026-10-20",
      },
      {
        title: "What to watch out for in contracts",
        publisher: "Business.govt.nz",
        url: "https://www.business.govt.nz/business-stage-or-type/contractors/what-to-watch-out-for-in-contracts",
        accessed: "2026-10-20",
      },
      {
        title: "How to move a site",
        publisher: "Google Search Central",
        url: "https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes",
        accessed: "2026-10-20",
      },
      {
        title: "Consumer Guarantees Act 1993, section 2: Interpretation",
        publisher: "New Zealand Legislation (Parliamentary Counsel Office)",
        url: "https://www.legislation.govt.nz/act/public/1993/91/en/latest/#DLM311058",
        accessed: "2026-10-20",
      },
      {
        title: "Consumer Guarantees Act 1993, section 43: No contracting out except for business transactions",
        publisher: "New Zealand Legislation (Parliamentary Counsel Office)",
        url: "https://www.legislation.govt.nz/act/public/1993/91/en/latest/#DLM312859",
        accessed: "2026-10-20",
      },
      {
        title: "New provisions come into force tackling unfair business practices",
        publisher: "Commerce Commission",
        url: "https://www.comcom.govt.nz/news-and-media/news-and-events/2022/new-provisions-come-into-force-tackling-unfair-business-practices/",
        accessed: "2026-10-20",
      },
      {
        title: "Unfair contract terms",
        publisher: "Commerce Commission",
        url: "https://www.comcom.govt.nz/business/your-rights-as-a-business/unfair-contract-terms/",
        accessed: "2026-10-20",
      },
      {
        title: "Copyright Act 1994, section 21: First ownership of copyright",
        publisher: "New Zealand Legislation (Parliamentary Counsel Office)",
        url: "https://www.legislation.govt.nz/act/public/1994/143/en/latest/#DLM345930",
        accessed: "2026-10-20",
      },
      {
        title: "Variations to contracts",
        publisher: "Business.govt.nz",
        url: "https://www.business.govt.nz/browse-our-resource-library/tips-for-tradies/variations-to-contracts",
        accessed: "2026-10-20",
      },
      {
        title: "Getting an online presence",
        publisher: "Business.govt.nz",
        url: "https://www.business.govt.nz/strategy-and-performance/building-a-brand/getting-an-online-presence",
        accessed: "2026-10-20",
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
    seoTitle: "AI automation for NZ businesses: where to start",
    description:
      "Which job to give AI first, whether it pays once checking time is counted, what stays with a person, and the privacy steps for NZ businesses.",
    short:
      "Pick one job your team does many times a week, that follows rules you could write down and that a person can check in seconds: sorting enquiries and drafting replies is usually a good place to start. Put staff on business AI accounts, keep a person approving anything a customer sees, and test the job on a few weeks of past work, counting the checking time, before it goes live.",
    situation: "We want to know where AI could actually help.",
    audience: {
      for: "Small and medium businesses curious about AI, and wary of the hype.",
      skip: "You want to know how AI models work inside. This is about choosing one job for AI and doing it safely.",
    },
    tools: [
      { title: "Is this task worth automating?", kind: "Test", id: "good-fit" },
      { title: "A one-page AI rule for staff", kind: "Template", id: "team-tools" },
      { title: "A privacy check before you start", kind: "Steps", id: "privacy" },
      { title: "Does it pay? The time sum", kind: "Template", id: "costs" },
      { title: "A four-week pilot with stop rules", kind: "Steps", id: "start" },
    ],
    topic: "automation",
    keywords: ["AI automation", "AI for small business NZ", "ChatGPT for business privacy", "AI use policy for staff", "human in the loop", "Privacy Act 2020 and AI"],
    published: "2026-10-04",
    updated: REVISED_1020,
    minutes: 9,
    cover: PHOTOS["cover-ai"],
    faq: [
      {
        q: "Which task should a small business automate with AI first?",
        a: "One that happens many times a week, follows rules you could write down, can be checked by a person in seconds and does little harm if it’s wrong. Sorting enquiries and drafting replies is usually a good first choice. Test it on a few weeks of past work and count the checking time: if checking takes nearly as long as doing the job, it doesn’t pay.",
      },
      {
        q: "Can my staff paste customer emails into ChatGPT?",
        a: "Not on personal accounts: OpenAI says it may train its models on content from its Free, Plus and Pro plans unless the user opts out, while ChatGPT Business, Enterprise, Edu and its API aren’t used to improve its models by default. Even on a business account, the Privacy Commissioner expects personal information to stay out of a generative AI tool unless the provider has explicitly confirmed it won’t keep or disclose it. If you’re not sure, keep it out.",
      },
      {
        q: "Does the Privacy Act stop us using an overseas AI service?",
        a: "Not in itself. A provider that only stores or processes information on your behalf isn’t receiving a disclosure, but you stay fully responsible for it. If it uses the information for its own purposes, such as training its AI, that can be a disclosure that principle 11 must allow, and principle 12 too if the provider is overseas. Get the provider’s answer in writing, and assess the privacy risks before you start.",
      },
    ],
    related: { services: ["ai-automation"], work: ["enquiry-desk"], articles: ["connect-website-crm-booking", "when-you-need-a-client-portal", "website-chat-assistant"] },
    sources: [
      {
        title: "Responsible AI Guidance for Businesses: Investing with confidence",
        publisher: "Ministry of Business, Innovation and Employment",
        url: "https://www.mbie.govt.nz/assets/responsible-ai-guidance-for-businesses.pdf",
        accessed: "2026-10-20",
      },
      {
        title: "Artificial intelligence and the Information Privacy Principles",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/assets/New-order/Resources-/Publications/Guidance-resources/AI-Guidance-Resources-/AI-and-the-Information-Privacy-Principles.pdf",
        accessed: "2026-10-20",
      },
      {
        title: "How your data is used to improve model performance",
        publisher: "OpenAI Help Center",
        url: "https://help.openai.com/en/articles/5722486-how-your-data-is-used-to-improve-model-performance",
        accessed: "2026-10-20",
      },
      {
        title: "Is my data used for model training? (commercial products)",
        publisher: "Anthropic Privacy Center",
        url: "https://privacy.claude.com/en/articles/7996868-is-my-data-used-for-model-training",
        accessed: "2026-10-20",
      },
      {
        title: "Generative AI in Google Workspace Privacy Hub",
        publisher: "Google Workspace Admin Help",
        url: "https://knowledge.workspace.google.com/admin/generative-ai/generative-ai-in-google-workspace-privacy-hub",
        accessed: "2026-10-20",
      },
      {
        title: "Data, Privacy, and Security for Microsoft Copilot",
        publisher: "Microsoft Learn",
        url: "https://learn.microsoft.com/en-us/copilot/microsoft-365/microsoft-365-copilot-privacy",
        accessed: "2026-10-20",
      },
      {
        title: "Artificial intelligence guide for small businesses",
        publisher: "National Cyber Security Centre",
        url: "https://www.ncsc.govt.nz/protect-your-organisation/ai-guide-for-small-businesses/",
        accessed: "2026-10-20",
      },
      {
        title: "Generative Artificial Intelligence",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/resources-and-learning/a-z-topics/ai/generative-artificial-intelligence/",
        accessed: "2026-10-20",
      },
      {
        title: "Privacy Act 2020 (sections 11 and 201)",
        publisher: "New Zealand Legislation",
        url: "https://www.legislation.govt.nz/act/public/2020/0031/latest/whole.html",
        accessed: "2026-10-20",
      },
      {
        title: "Fair Trading Act 1986, section 9: Misleading and deceptive conduct generally",
        publisher: "New Zealand Legislation",
        url: "https://www.legislation.govt.nz/act/public/1986/0121/latest/DLM96907.html",
        accessed: "2026-10-20",
      },
      {
        title: "Record keeping",
        publisher: "Inland Revenue",
        url: "https://www.ird.govt.nz/managing-my-tax/record-keeping",
        accessed: "2026-10-20",
      },
      {
        title: "Principle 3: Collection of information directly from subject (what to tell the individual)",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/privacy-principles/3/",
        accessed: "2026-10-20",
      },
      {
        title: "Privacy Impact Assessments",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/responsibilities/privacy-impact-assessments/",
        accessed: "2026-10-20",
      },
      {
        title: "Working with third-party providers: understanding your privacy responsibilities",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/resources-and-learning/a-z-topics/working-with-third-party-providers/",
        accessed: "2026-10-20",
      },
      {
        title: "Principle 12: Disclosure outside New Zealand",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/privacy-principles/12/",
        accessed: "2026-10-20",
      },
      {
        title: "NotifyUs of a serious privacy breach",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/responsibilities/privacy-breaches/notify-us/",
        accessed: "2026-10-20",
      },
      {
        title: "Quickstart: Businesses using AI tools",
        publisher: "Ministry of Business, Innovation and Employment",
        url: "https://www.mbie.govt.nz/assets/businesses-using-ai-tools.pdf",
        accessed: "2026-10-20",
      },
    ],
    status: "published",
  },
  {
    slug: "after-launch-ownership",
    title: "Who owns your website? Domain, hosting, code and support",
    seoTitle: "Who owns your website? Domain, hosting and code",
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
    seoTitle: "What is SEO? What a small business should do first",
    description:
      "Find where your site is stuck on Google, do the five jobs that matter first, and learn what to ask before you pay anyone for SEO.",
    short:
      "SEO (search engine optimisation) is the work of making your website easy for Google to find, understand and choose when people search for what you do. Start by setting up Google Search Console to see where your site is stuck; then claim your Business Profile if you meet customers face to face, and give each service its own clear page in your customers’ words. Google never charges to appear and no one can guarantee a top ranking; a change can take from hours to months to show, so judge it over weeks.",
    situation: "We want more people to find us on Google.",
    audience: {
      for: "Owners who want more people to find them on Google, and want to know what to do first and what to ask before paying anyone.",
      skip: "You need enquiries this week. Search work pays off over months; advertising is the faster tool for that.",
    },
    tools: [
      { title: "Where is your site stuck? A four-question check", kind: "Decision path", id: "diagnose" },
      { title: "Five SEO jobs worth doing first", kind: "Steps", id: "five-jobs" },
      { title: "A page, checked before it goes live", kind: "Checklist", id: "page-check" },
      { title: "Questions to ask an SEO provider", kind: "Checklist", id: "paying-someone" },
    ],
    topic: "websites",
    keywords: ["what is seo", "seo for small business", "seo new zealand", "how to get found on google", "google search console", "do i need an seo"],
    published: "2026-10-07",
    updated: REVISED_1020,
    minutes: 9,
    cover: PHOTOS["cover-seo"],
    faq: [
      {
        q: "Can I do SEO myself?",
        a: "Yes. Set up Search Console, claim your Business Profile if you meet customers face to face, give each service its own page in your customers’ words, write a title and description for each page, and make the pages quick on a phone. Hiring buys time and technical depth, not a secret method, and Google advises giving an outside SEO read access to Search Console only at first.",
      },
      {
        q: "How long does SEO take to work?",
        a: "Google says some changes take effect in a few hours and others could take several months, and suggests waiting a few weeks before judging whether a change helped. Note the date of each change, then compare clicks and impressions in Search Console with the period before, allowing for the season.",
      },
      {
        q: "Do we need to do anything different for AI answers?",
        a: "Not for Google’s AI features. Google says there are no extra requirements or special optimisation for appearing in AI Overviews or AI Mode: a page needs to be indexed and eligible to show in Search with a snippet. Keep important content in text on the page, and make sure any structured data matches what visitors can see.",
      },
    ],
    related: { services: ["websites"], work: ["practice-website"], articles: ["google-business-profile", "redesign-or-improve"] },
    sources: [
      {
        title: "About the ad review process",
        publisher: "Google Ads Help",
        url: "https://support.google.com/google-ads/answer/1722120",
        accessed: "2026-10-20",
      },
      {
        title: "Doing business online",
        publisher: "Business.govt.nz",
        url: "https://www.business.govt.nz/strategy-and-performance/doing-business-online",
        accessed: "2026-10-20",
      },
      {
        title: "Do you need an SEO?",
        publisher: "Google Search Central",
        url: "https://developers.google.com/search/docs/fundamentals/do-i-need-seo",
        accessed: "2026-10-20",
      },
      {
        title: "In-depth guide to how Google Search works",
        publisher: "Google Search Central",
        url: "https://developers.google.com/search/docs/fundamentals/how-search-works",
        accessed: "2026-10-20",
      },
      {
        title: "Search Engine Optimization (SEO) Starter Guide",
        publisher: "Google Search Central",
        url: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide",
        accessed: "2026-10-20",
      },
      {
        title: "Spam policies for Google web search",
        publisher: "Google Search Central",
        url: "https://developers.google.com/search/docs/essentials/spam-policies",
        accessed: "2026-10-20",
      },
      {
        title: "AI features and your website",
        publisher: "Google Search Central",
        url: "https://developers.google.com/search/docs/appearance/ai-features",
        accessed: "2026-10-20",
      },
      {
        title: "Google Search Essentials",
        publisher: "Google Search Central",
        url: "https://developers.google.com/search/docs/essentials",
        accessed: "2026-10-20",
      },
      {
        title: "Creating helpful, reliable, people-first content",
        publisher: "Google Search Central",
        url: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
        accessed: "2026-10-20",
      },
      {
        title: "Understanding page experience in Google Search results",
        publisher: "Google Search Central",
        url: "https://developers.google.com/search/docs/appearance/page-experience",
        accessed: "2026-10-20",
      },
      {
        title: "site: search operator",
        publisher: "Google Search Central",
        url: "https://developers.google.com/search/docs/monitor-debug/search-operators/all-search-site",
        accessed: "2026-10-20",
      },
      {
        title: "URL Inspection tool",
        publisher: "Search Console Help (Google)",
        url: "https://support.google.com/webmasters/answer/9012289",
        accessed: "2026-10-20",
      },
      {
        title: "Performance report (Search results): Overview and basic setup",
        publisher: "Search Console Help (Google)",
        url: "https://support.google.com/webmasters/answer/7576553",
        accessed: "2026-10-20",
      },
      {
        title: "About Search Console",
        publisher: "Search Console Help (Google)",
        url: "https://support.google.com/webmasters/answer/9128668",
        accessed: "2026-10-20",
      },
      {
        title: "Add a website or platform property to Search Console",
        publisher: "Search Console Help (Google)",
        url: "https://support.google.com/webmasters/answer/34592",
        accessed: "2026-10-20",
      },
      {
        title: "Get started with Google Business Profile",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/7039811",
        accessed: "2026-10-20",
      },
      { title: "Web Vitals", publisher: "web.dev (Google)", url: "https://web.dev/articles/vitals", accessed: "2026-10-20" },
      {
        title: "Managing multi-regional and multilingual sites",
        publisher: "Google Search Central",
        url: "https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites",
        accessed: "2026-10-20",
      },
      {
        title: "Commission takes court action to stop misleading paid online rankings",
        publisher: "Commerce Commission",
        url: "https://www.comcom.govt.nz/news-and-media/news-and-events/2026/commission-takes-court-action-to-stop-misleading-paid-online-rankings/",
        accessed: "2026-10-20",
      },
    ],
    status: "published",
  },
  {
    slug: "google-business-profile",
    title: "How to get your business on Google Search and Maps",
    description:
      "Set up and verify a Google Business Profile, fill it in properly, get reviews within Google’s rules and NZ law, and fix ownership and suspension problems.",
    short:
      "A Google Business Profile is the free listing that lets you manage how your business appears on Google Search and Maps, and only businesses that meet their customers face to face can have one. Claim or add it, get it verified, keep its details true (holiday hours included) and ask every customer for a review, with nothing offered in return. Google ranks local results mainly on relevance, distance and popularity, and there is no way to pay for a better place.",
    audience: {
      for: "Any New Zealand business that customers visit, or that goes to its customers.",
      skip: "You sell only online and never meet customers face to face. Google doesn’t give those businesses a profile; start with what SEO involves instead.",
    },
    tools: [
      { title: "Setting up a Business Profile", kind: "Steps", id: "add-or-claim" },
      { title: "When your Business Profile goes wrong", kind: "Steps", id: "problems" },
      { title: "A profile, checked over", kind: "Checklist", id: "keep-it-working" },
    ],
    topic: "websites",
    keywords: [
      "google business profile",
      "add business to google maps",
      "google business profile verification",
      "claim google business listing",
      "google reviews rules nz",
      "google business profile suspended",
    ],
    published: "2026-10-07",
    updated: REVISED_1020,
    minutes: 9,
    cover: PHOTOS["cover-gbp"],
    faq: [
      {
        q: "Is a Google Business Profile free?",
        a: "Yes. Google provides it at no charge, and says it will never try to convince you to pay to maintain, verify or reinstate your profile. A caller who asks for payment information or guarantees you a special spot isn’t Google: hang up. What agencies charge for is their time.",
      },
      {
        q: "Someone else controls our Google listing. How do we get it back?",
        a: "Don’t create a second profile. Go to business.google.com/add, find your business, choose “Request Access” and fill in the form. The current owner has three days to respond; if they don’t, you may be offered the option to claim the profile yourself, though Google says that option isn’t always available.",
      },
      {
        q: "Can we ask customers for Google reviews?",
        a: "Yes: ask every customer, with Google’s review link or QR code. Don’t offer anything in return, don’t ask only the happy ones, and don’t have staff or family post reviews, because Google’s rules ban all three. In New Zealand the Commerce Commission expects reviews to be genuine and not misleading, and staff-written reviews were part of a Fair Trading Act case in which The TV Shop was ordered to pay $1,104,000.",
      },
    ],
    related: { services: ["websites"], work: ["practice-website"], articles: ["what-is-seo", "after-launch-ownership"] },
    sources: [
      {
        title: "Get started with Google Business Profile",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/7039811",
        accessed: "2026-10-20",
      },
      {
        title: "Guidelines for representing your business on Google",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/3038177",
        accessed: "2026-10-20",
      },
      {
        title: "Add a missing place to Google Maps",
        publisher: "Google Maps Help",
        url: "https://support.google.com/maps/answer/6320846",
        accessed: "2026-10-20",
      },
      {
        title: "Help protect your Google Business Profile",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/14509283",
        accessed: "2026-10-20",
      },
      {
        title: "Add or claim your Business Profile",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/2911778",
        accessed: "2026-10-20",
      },
      {
        title: "Protect your business with two-factor authentication (2FA)",
        publisher: "Own Your Online (NCSC)",
        url: "https://www.ownyouronline.govt.nz/business/get-protected/guides/protect-your-business-with-2fa/",
        accessed: "2026-10-20",
      },
      {
        title: "Tips to improve your local ranking on Google",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/7091",
        accessed: "2026-10-20",
      },
      {
        title: "Manage your service areas for service-area & hybrid businesses",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/9157481",
        accessed: "2026-10-20",
      },
      {
        title: "Verify your business on Google",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/7107242",
        accessed: "2026-10-20",
      },
      {
        title: "Verify your business with a video recording",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/14271705",
        accessed: "2026-10-20",
      },
      {
        title: "Edit your Business Profile",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/3039617",
        accessed: "2026-10-20",
      },
      {
        title: "How to set Special hours",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/6303076",
        accessed: "2026-10-20",
      },
      {
        title: "Tips for business-specific photos on your Business Profile",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/6123536",
        accessed: "2026-10-20",
      },
      {
        title: "Public holidays and anniversary dates",
        publisher: "Employment New Zealand",
        url: "https://www.employment.govt.nz/leave-and-holidays/public-holidays/public-holidays-and-anniversary-dates",
        accessed: "2026-10-20",
      },
      {
        title: "Tips to get more reviews",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/3474122",
        accessed: "2026-10-20",
      },
      {
        title: "Prohibited & restricted content",
        publisher: "Maps User Generated Content Policy Help (Google)",
        url: "https://support.google.com/contributionpolicy/answer/7400114",
        accessed: "2026-10-20",
      },
      {
        title: "Online reviews",
        publisher: "Commerce Commission",
        url: "https://www.comcom.govt.nz/business/dealing-with-typical-situations/ensuring-customers-get-a-complete-picture-of-your-online-reviews",
        accessed: "2026-10-20",
      },
      {
        title: "District Court finds The TV Shop staff wrote positive ‘customer’ reviews, misled consumers",
        publisher: "Commerce Commission",
        url: "https://www.comcom.govt.nz/news-and-media/news-and-events/2025/district-court-finds-the-tv-shop-staff-wrote-positive-customer-reviews-misled-consumers/",
        accessed: "2026-10-20",
      },
      {
        title: "The TV Shop to pay $1.104m for conduct that included misleading customers",
        publisher: "Commerce Commission",
        url: "https://www.comcom.govt.nz/news-and-media/news-and-events/2026/the-tv-shop-to-pay-1-104m-for-conduct-that-included-misleading-customers/",
        accessed: "2026-10-20",
      },
      {
        title: "Manage customer reviews",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/3474050",
        accessed: "2026-10-20",
      },
      {
        title: "Report inappropriate reviews on your Business Profile",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/4596773",
        accessed: "2026-10-20",
      },
      {
        title: "Request ownership of a Business Profile",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/4566671",
        accessed: "2026-10-20",
      },
      {
        title: "Fix suspended or disabled profiles",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/4569145",
        accessed: "2026-10-20",
      },
      {
        title: "Help protect against fraudulent calls and texts",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/6212928",
        accessed: "2026-10-20",
      },
      {
        title: "Report negative review extortion scams on your Business Profile",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/16404809",
        accessed: "2026-10-20",
      },
      {
        title: "Manage your Business Profile owners & managers",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/3403100",
        accessed: "2026-10-20",
      },
      {
        title: "Understand your Business Profile performance & insights",
        publisher: "Google Business Profile Help",
        url: "https://support.google.com/business/answer/9918094",
        accessed: "2026-10-20",
      },
      {
        title: "Introducing Apple Business",
        publisher: "Apple Newsroom (New Zealand)",
        url: "https://www.apple.com/nz/newsroom/2026/03/introducing-apple-business/",
        accessed: "2026-10-20",
      },
      {
        title: "Apple Business feature availability",
        publisher: "Apple Support (New Zealand)",
        url: "https://support.apple.com/en-nz/guide/business/axmef1c47twq/web",
        accessed: "2026-10-20",
      },
    ],
    status: "published",
  },
  {
    slug: "diy-website-or-hire",
    title: "Build your own website or hire someone: how to decide",
    seoTitle: "Build your own website or hire someone?",
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
      "A plan for the first hour, day and week after a website break-in: contain it, report it to the NCSC, check your Privacy Act duties and restore safely.",
    short:
      "Call your host, write down what you see, take the site offline if it’s harming visitors, and change every password from a device you trust. Report it to the NCSC, and if customers’ personal information was involved and serious harm has been caused or is likely, the Privacy Act requires you to notify the Privacy Commissioner as soon as practicable and, unless an exception applies, the people affected. Close the way in before you restore a clean backup, then ask Google to review the site.",
    audience: {
      for: "Owners of a business website that has been, or might have been, broken into, and anyone who wants the plan ready before it happens.",
      skip: "Your office computers or email were attacked, not the website. Start with your IT provider and Own Your Online’s guidance, then use the website steps here if they apply.",
    },
    tools: [
      { title: "Hacked today: the first hour, day and week", kind: "Steps", id: "first" },
      { title: "Is it a hack? What you’re seeing", kind: "Comparison", id: "signs" },
      { title: "Must you notify the Privacy Commissioner? The test", kind: "Decision path", id: "tell" },
      { title: "Stopping the next one", kind: "Checklist", id: "next" },
    ],
    topic: "websites",
    keywords: [
      "website hacked",
      "what to do if website is hacked",
      "report cyber attack nz",
      "privacy breach notification nz",
      "this site may be hacked",
      "hacked website recovery",
    ],
    published: "2026-10-08",
    updated: REVISED_1020,
    minutes: 10,
    cover: PHOTOS["cover-hacked"],
    faq: [
      {
        q: "How do I know if my website has been hacked?",
        a: "Signs include “This site may be hacked” beside your site in Google or a browser warning page, an alert in Search Console’s Security issues report, and pages, links or admin users nobody created, such as pages in another language when you search Google for site: and your address. Not every warning is a hack: a lapsed certificate or a hosting fault can look alarming too. If your host emails you about a problem, check the message really comes from them before clicking anything.",
      },
      {
        q: "Do we have to tell customers if our website was hacked?",
        a: "You must if personal information was involved and it’s reasonable to believe the breach has caused, or is likely to cause, serious harm. Then the Privacy Act requires you to notify the Privacy Commissioner as soon as practicable (the Commissioner asks for it ideally within 72 hours) and to tell the people affected, unless an exception applies. Failing to notify the Commissioner without a reasonable excuse is an offence with a fine of up to $10,000.",
      },
      {
        q: "How long until Google removes the warning?",
        a: "Fix every issue across the whole site first, then choose Request Review in Search Console’s Security issues report and describe your fixes. Google says a review can take from a few days to a few weeks, and that warnings go within a few days of it finding the site clean, though browsers can lag a day or two. Asking before the site is truly clean only prolongs the warning.",
      },
    ],
    related: { services: ["websites"], work: ["practice-website"], articles: ["after-launch-ownership", "redesign-or-improve", "diy-website-or-hire"] },
    sources: [
      {
        title: "IT risks and scams",
        publisher: "Business.govt.nz",
        url: "https://www.business.govt.nz/operations/it-risks-and-scams",
        accessed: "2026-10-20",
      },
      {
        title: "Fix the Japanese keyword hack",
        publisher: "web.dev (Google)",
        url: "https://web.dev/articles/fix-the-japanese-keyword-hack",
        accessed: "2026-10-20",
      },
      {
        title: "Protect your business from a data breach",
        publisher: "Own Your Online (NCSC)",
        url: "https://www.ownyouronline.govt.nz/business/get-protected/guides/protect-your-business-from-a-data-breach/",
        accessed: "2026-10-20",
      },
      {
        title: "Create an incident response plan",
        publisher: "Own Your Online (NCSC)",
        url: "https://www.ownyouronline.govt.nz/business/get-protected/guides/create-an-incident-response-plan/",
        accessed: "2026-10-20",
      },
      {
        title: "Quarantine your site",
        publisher: "web.dev (Google)",
        url: "https://web.dev/articles/quarantine-your-site",
        accessed: "2026-10-20",
      },
      {
        title: "Report a cyber security issue",
        publisher: "National Cyber Security Centre",
        url: "https://www.ncsc.govt.nz/report/",
        accessed: "2026-10-20",
      },
      {
        title: "Contact us",
        publisher: "National Cyber Security Centre",
        url: "https://www.ncsc.govt.nz/who-we-are/contact-us/",
        accessed: "2026-10-20",
      },
      {
        title: "NotifyUs of a serious privacy breach",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/responsibilities/privacy-breaches/notify-us/",
        accessed: "2026-10-20",
      },
      {
        title: "Breach Management",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/responsibilities/poupou-matatapu-doing-privacy-well/breach-management/",
        accessed: "2026-10-20",
      },
      {
        title: "Why is my site labeled as dangerous in Google Search?",
        publisher: "Search Console Help (Google)",
        url: "https://support.google.com/webmasters/answer/6347750",
        accessed: "2026-10-20",
      },
      {
        title: "Security issues report",
        publisher: "Search Console Help (Google)",
        url: "https://support.google.com/webmasters/answer/9044101",
        accessed: "2026-10-20",
      },
      {
        title: "Privacy Act 2020, sections 112 to 118 (notifiable privacy breaches)",
        publisher: "New Zealand Legislation (Parliamentary Counsel Office)",
        url: "https://www.legislation.govt.nz/act/public/2020/31/en/latest/#LMS23502",
        accessed: "2026-10-20",
      },
      {
        title: "Protect your business against ransomware",
        publisher: "Own Your Online (NCSC)",
        url: "https://www.ownyouronline.govt.nz/business/get-protected/guides/protect-your-business-against-ransomware/",
        accessed: "2026-10-20",
      },
      {
        title: "Reporting cyber incidents now easier with the completed integration of CERT NZ and the NCSC",
        publisher: "National Cyber Security Centre",
        url: "https://www.ncsc.govt.nz/news/reporting-cyber-incidents-now-easier-with-the-completed-integration-of-cert-nz-and-the-ncsc/",
        accessed: "2026-10-20",
      },
      {
        title: "Enquiry form",
        publisher: "Domain Name Commission",
        url: "https://dnc.org.nz/enquiry-form/",
        accessed: "2026-10-20",
      },
      {
        title: "Communicating in a cyber security incident",
        publisher: "National Cyber Security Centre",
        url: "https://www.ncsc.govt.nz/protect-your-organisation/communicating-in-a-cyber-security-incident/",
        accessed: "2026-10-20",
      },
      {
        title: "Top ways sites get hacked by spammers",
        publisher: "web.dev (Google)",
        url: "https://web.dev/articles/top-ways-sites-get-hacked-by-spammers",
        accessed: "2026-10-20",
      },
      {
        title: "Protect your business with two-factor authentication (2FA)",
        publisher: "Own Your Online (NCSC)",
        url: "https://www.ownyouronline.govt.nz/business/get-protected/guides/protect-your-business-with-2fa/",
        accessed: "2026-10-20",
      },
      {
        title: "Protect your website",
        publisher: "Own Your Online (NCSC)",
        url: "https://www.ownyouronline.govt.nz/business/get-protected/guides/protect-your-website/",
        accessed: "2026-10-20",
      },
      {
        title: "Back up your business data",
        publisher: "Own Your Online (NCSC)",
        url: "https://www.ownyouronline.govt.nz/business/get-protected/guides/backups-for-your-business/",
        accessed: "2026-10-20",
      },
      {
        title: "Secure your website’s domain name",
        publisher: "Own Your Online (NCSC)",
        url: "https://www.ownyouronline.govt.nz/business/get-protected/guides/secure-your-domain-name/",
        accessed: "2026-10-20",
      },
    ],
    status: "published",
  },
  {
    slug: "website-chat-assistant",
    title: "Should our website have a chat assistant?",
    // No seoTitle: the title plus " | Nerodyn" is 51 characters.
    description:
      "A test for whether your website needs a chat assistant, why you answer for what it says, what it costs, and the checks and privacy steps before launch.",
    short:
      "Add a chat assistant only if the same questions keep arriving, you have written answers you would stand behind, and someone will read its conversations every week. Whatever it tells visitors, your business has said, so it should answer only from approved wording and pass particular bookings, refund requests, health and legal questions to a person. If the questions come from information missing on your website, fix the pages first.",
    audience: {
      for: "Owners hearing “you need a chatbot” who want an honest test before spending on one.",
      skip: "Your pages and your team already answer visitors’ questions well. Keep improving the pages instead.",
    },
    tools: [
      { title: "Should you build one: the test", kind: "Decision path", id: "test" },
      { title: "Keeping a live assistant safe", kind: "Checklist", id: "harm" },
      { title: "A privacy notice for the chat box", kind: "Template", id: "privacy" },
      { title: "Four ways to answer visitors’ questions", kind: "Comparison", id: "costs" },
      { title: "Test it like a difficult customer", kind: "Test", id: "live" },
    ],
    keywords: ["chatbot for website", "should I add a chatbot", "AI chat assistant for small business", "website chatbot cost", "chatbot Fair Trading Act", "chatbot privacy NZ"],
    updated: REVISED_1020,
    minutes: 9,
    faq: [
      {
        q: "Are we responsible for what our website chatbot says?",
        a: "Treat it as if you are. In a 2024 Canadian case, a tribunal held Air Canada responsible for the information its chatbot gave, saying it made no difference whether information came from a static page or a chatbot. In New Zealand the Fair Trading Act prohibits misleading conduct in trade, so keep the assistant to approved wording and hand anything it’s unsure of to a person.",
      },
      {
        q: "What does a website chat assistant cost to run?",
        a: "Three things: the provider’s fees, any plan or seats, and your team’s time reading conversations and updating answers. Read how fees are counted: Intercom, for example, prices its AI agent, Fin, at US$0.99 per “outcome”, and a visitor who doesn’t ask for more help after its reply counts as one. Work out a monthly figure from your own traffic, and ask for a cap before you commit.",
      },
      {
        q: "Is a chatbot bad for privacy?",
        a: "It depends on the design. Ask visitors not to share personal details in the chat and take them through a form, use a tool you have confirmed doesn’t keep or disclose what it is given, tell visitors plainly, and read the conversations regularly: a live assistant answers before anyone can check it. The Privacy Commissioner also expects a privacy impact assessment first.",
      },
    ],
    sources: [
      {
        title: "Generative Artificial Intelligence",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/resources-and-learning/a-z-topics/ai/generative-artificial-intelligence/",
        accessed: "2026-10-20",
      },
      {
        title: "Responsible AI Guidance for Businesses: Investing with confidence",
        publisher: "Ministry of Business, Innovation and Employment",
        url: "https://www.mbie.govt.nz/assets/responsible-ai-guidance-for-businesses.pdf",
        accessed: "2026-10-20",
      },
      {
        title: "Artificial intelligence guide for small businesses",
        publisher: "National Cyber Security Centre",
        url: "https://www.ncsc.govt.nz/protect-your-organisation/ai-guide-for-small-businesses/",
        accessed: "2026-10-20",
      },
      {
        title: "Artificial intelligence and the Information Privacy Principles",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/assets/New-order/Resources-/Publications/Guidance-resources/AI-Guidance-Resources-/AI-and-the-Information-Privacy-Principles.pdf",
        accessed: "2026-10-20",
      },
      {
        title: "Understanding Success Criterion 2.4.11: Focus Not Obscured (Minimum)",
        publisher: "W3C Web Accessibility Initiative",
        url: "https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html",
        accessed: "2026-10-20",
      },
      {
        title: "Moffatt v. Air Canada, 2024 BCCRT 149",
        publisher: "Civil Resolution Tribunal, British Columbia",
        url: "https://decisions.civilresolutionbc.ca/crt/crtd/en/item/525448/index.do",
        accessed: "2026-10-20",
      },
      {
        title: "Fair Trading Act",
        publisher: "Consumer Protection (Ministry of Business, Innovation and Employment)",
        url: "https://www.consumerprotection.govt.nz/general-help/consumer-laws/fair-trading-act/",
        accessed: "2026-10-20",
      },
      {
        title: "Fair Trading Act 1986, sections 9 and 13",
        publisher: "New Zealand Legislation",
        url: "https://www.legislation.govt.nz/act/public/1986/0121/latest/DLM96907.html",
        accessed: "2026-10-20",
      },
      {
        title: "Privacy Act 2020: the privacy principles",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/privacy-principles/",
        accessed: "2026-10-20",
      },
      {
        title: "Principle 3: Collection of information directly from subject (what to tell the individual)",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/privacy-principles/3/",
        accessed: "2026-10-20",
      },
      {
        title: "Working with third-party providers: understanding your privacy responsibilities",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/resources-and-learning/a-z-topics/working-with-third-party-providers/",
        accessed: "2026-10-20",
      },
      {
        title: "Principle 9: Retention of personal information",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/privacy-principles/9/",
        accessed: "2026-10-20",
      },
      {
        title: "Privacy Impact Assessments",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/responsibilities/privacy-impact-assessments/",
        accessed: "2026-10-20",
      },
      {
        title: "Privacy Act 2020, section 201: Privacy officers",
        publisher: "New Zealand Legislation",
        url: "https://www.legislation.govt.nz/act/public/2020/0031/latest/whole.html",
        accessed: "2026-10-20",
      },
      {
        title: "What’s the difference between a privacy statement, notice and policy?",
        publisher: "Office of the Privacy Commissioner",
        url: "https://www.privacy.org.nz/resources-and-learning/a-z-topics/whats-the-difference-between-a-privacy-statement-notice-and-policy/",
        accessed: "2026-10-20",
      },
      {
        title: "Pricing",
        publisher: "Intercom",
        url: "https://www.intercom.com/pricing",
        accessed: "2026-10-20",
      },
    ],
    topic: "automation",
    published: "2026-10-08",
    cover: PHOTOS["cover-chat"],
    related: { services: ["ai-automation"], work: ["enquiry-desk"], articles: ["ai-automation-workflows", "what-is-seo"] },
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
