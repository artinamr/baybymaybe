/**
 * THE GLOSSARY: the words that come up when a business plans a website, a
 * platform or automation, each explained in a sentence or two of plain New
 * Zealand English. Rendered at /blog/glossary/ (with DefinedTermSet data),
 * searched from the blog's index, and linked from articles with
 * `<Term id="…">` (components/blog/Term.tsx), which shows the definition on
 * hover or focus.
 *
 * The same rules as the articles (docs/BLOG-GUIDE.md): no em dashes, plain
 * words, and any fact that is more than a definition (a number, a rule, the
 * law) cited to a source checked on the date given. A definition must stand
 * on its own: AI assistants quote them whole.
 */

import type { Source } from "./index";

const CHECKED = "2026-10-05";

/** The pages the definitions rest on. Numbered on the page in the order the terms first cite them. */
export const GLOSSARY_SOURCES = {
  dnc: {
    title: "A ready reference for registrants",
    publisher: "Domain Name Commission",
    url: "https://dnc.org.nz/assets/DocumentLibrary/a_ready_reference_for_registrants.pdf",
    accessed: CHECKED,
  },
  ransom: {
    title: "Protect your business against ransomware",
    publisher: "Own Your Online (NCSC)",
    url: "https://www.ownyouronline.govt.nz/business/get-protected/guides/protect-your-business-against-ransomware/",
    accessed: CHECKED,
  },
  vitals: { title: "Web Vitals", publisher: "web.dev (Google)", url: "https://web.dev/articles/vitals", accessed: CHECKED },
  psi: {
    title: "About PageSpeed Insights",
    publisher: "Google for Developers",
    url: "https://developers.google.com/speed/docs/insights/v5/about",
    accessed: CHECKED,
  },
  console: {
    title: "About Search Console",
    publisher: "Search Console Help (Google)",
    url: "https://support.google.com/webmasters/answer/9128668",
    accessed: CHECKED,
  },
  titles: {
    title: "Influencing your title links in search results",
    publisher: "Google Search Central",
    url: "https://developers.google.com/search/docs/appearance/title-link",
    accessed: CHECKED,
  },
  snippet: {
    title: "Control your snippets in search results",
    publisher: "Google Search Central",
    url: "https://developers.google.com/search/docs/appearance/snippet",
    accessed: CHECKED,
  },
  moves: {
    title: "Site moves with URL changes",
    publisher: "Google Search Central",
    url: "https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes",
    accessed: CHECKED,
  },
  sd: {
    title: "Introduction to structured data markup in Google Search",
    publisher: "Google Search Central",
    url: "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data",
    accessed: CHECKED,
  },
  wcag: {
    title: "WCAG 2 Overview",
    publisher: "W3C Web Accessibility Initiative",
    url: "https://www.w3.org/WAI/standards-guidelines/wcag/",
    accessed: CHECKED,
  },
  genai: {
    title: "Generative Artificial Intelligence",
    publisher: "Office of the Privacy Commissioner",
    url: "https://www.privacy.org.nz/resources-and-learning/a-z-topics/ai/generative-artificial-intelligence/",
    accessed: "2026-10-08",
  },
  ipps: {
    title: "Privacy Act 2020: the privacy principles",
    publisher: "Office of the Privacy Commissioner",
    url: "https://www.privacy.org.nz/privacy-principles/",
    accessed: CHECKED,
  },
  ipp3a: {
    title: "Principle 3A: Collection of information from another source",
    publisher: "Office of the Privacy Commissioner",
    url: "https://www.privacy.org.nz/privacy-principles/3a/",
    accessed: CHECKED,
  },
  notify: {
    title: "NotifyUs of a serious privacy breach",
    publisher: "Office of the Privacy Commissioner",
    url: "https://www.privacy.org.nz/responsibilities/privacy-breaches/notify-us/",
    accessed: CHECKED,
  },
  uema: {
    title: "Three steps to ensure you are not spamming",
    publisher: "Department of Internal Affairs",
    url: "https://www.dia.govt.nz/Spam-Three-Steps",
    accessed: CHECKED,
  },
  tfa: {
    title: "Protect your business with two-factor authentication (2FA)",
    publisher: "Own Your Online (NCSC)",
    url: "https://www.ownyouronline.govt.nz/business/get-protected/guides/protect-your-business-with-2fa/",
    accessed: "2026-10-08",
  },
  starter: {
    title: "Search Engine Optimization (SEO) Starter Guide",
    publisher: "Google Search Central",
    url: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide",
    accessed: "2026-10-07",
  },
  gbp: {
    title: "Get started with Google Business Profile",
    publisher: "Google Business Profile Help",
    url: "https://support.google.com/business/answer/7039811",
    accessed: "2026-10-07",
  },
} satisfies Record<string, Source>;

type SourceKey = keyof typeof GLOSSARY_SOURCES;

export type TermGroup = { key: string; title: string; line: string };

export const TERM_GROUPS: TermGroup[] = [
  { key: "site", title: "Your website and its address", line: "What a website is made of, and what should be in your name." },
  { key: "search", title: "Search and speed", line: "How people find a site, and how it feels to use." },
  { key: "platforms", title: "Platforms and connections", line: "The systems behind the website, and how they talk to each other." },
  { key: "ai", title: "AI and automation", line: "Software that does repeated work, and the checks it needs." },
  { key: "privacy", title: "Privacy, consent and security", line: "New Zealand’s rules, and the basics that keep accounts safe." },
];

export type GlossaryTerm = {
  /** The anchor (/blog/glossary/#udai) and the `<Term id>` key. */
  id: string;
  term: string;
  /** Another name it goes by, or what the letters stand for. */
  also?: string;
  group: TermGroup["key"];
  /** The definition: one to three plain sentences that stand on their own. */
  def: string;
  /** The sources for any fact in the definition beyond the meaning of the word. */
  cite?: SourceKey[];
  /** Where an article goes further: its slug and a section id from its `toc`. */
  see?: { slug: string; id: string };
};

export const GLOSSARY = [
  // ---- Your website and its address ----
  {
    id: "domain-name",
    term: "Domain name",
    group: "site",
    def: "Your website’s address, such as yourbusiness.co.nz. You register it through a registrar and renew it every year or few years. If someone registers a .nz name for you, they must register it in your name, not theirs.",
    cite: ["dnc"],
    see: { slug: "after-launch-ownership", id: "owning" },
  },
  {
    id: "registrar",
    term: "Registrar",
    group: "site",
    def: "The company you register and renew a domain name through. For .nz names, registrars must meet criteria set by the Domain Name Commission, which monitors them, and you can move to another registrar at any time except in the first five days after registering.",
    cite: ["dnc"],
    see: { slug: "after-launch-ownership", id: "leaving" },
  },
  {
    id: "udai",
    term: "UDAI",
    also: "Unique Domain Authentication ID",
    group: "site",
    def: "The code that confirms a request to move a .nz domain to another registrar. Your registrar must give it to you promptly and at no cost, and it is valid for 30 days.",
    cite: ["dnc"],
    see: { slug: "after-launch-ownership", id: "leaving" },
  },
  {
    id: "dns",
    term: "DNS",
    also: "Domain Name System",
    group: "site",
    def: "The internet’s address book. Your domain’s DNS records tell browsers which server holds your website and tell other mail servers where to deliver your email, so whoever controls them controls both.",
    see: { slug: "after-launch-ownership", id: "hosting" },
  },
  {
    id: "hosting",
    term: "Hosting",
    group: "site",
    def: "The servers that store your website and send it to each visitor. You rent them from a hosting provider, usually by the month or the year, and the account should be in your business’s name.",
    see: { slug: "after-launch-ownership", id: "hosting" },
  },
  {
    id: "https",
    term: "HTTPS and SSL certificates",
    group: "site",
    def: "The secure way a browser talks to a website: the connection is encrypted, so nobody else on the network can read or change what passes along it. A site needs a certificate (often still called an SSL certificate) to use it.",
  },
  {
    id: "cms",
    term: "CMS",
    also: "Content management system",
    group: "site",
    def: "The editor your team uses to change words, add pages and publish without touching code.",
  },
  {
    id: "handover",
    term: "Handover",
    group: "site",
    def: "When a provider passes a finished site to you: every account in your business’s name, your own logins rather than shared ones, and plain notes on how it all fits together.",
    see: { slug: "after-launch-ownership", id: "handover" },
  },
  {
    id: "backup",
    term: "Backup",
    group: "site",
    def: "A separate copy of your site and its data that you can restore from if something goes wrong. New Zealand’s National Cyber Security Centre advises keeping backups offline or disconnected, so an attacker can’t delete them, and testing them.",
    cite: ["ransom"],
    see: { slug: "after-launch-ownership", id: "backups" },
  },

  // ---- Search and speed ----
  {
    id: "seo",
    term: "SEO",
    also: "Search engine optimisation",
    group: "search",
    def: "The work of making a website easy for search engines to find, understand and recommend when someone searches for what the business does. It is mostly plain work on the site itself: clear pages, useful words, descriptive titles and a fast load.",
    see: { slug: "what-is-seo", id: "what-it-is" },
  },
  {
    id: "google-business-profile",
    term: "Google Business Profile",
    also: "formerly Google My Business",
    group: "search",
    def: "The free listing a business keeps with Google, shown on Search and Maps with its hours, services, photos and reviews. Only businesses that meet customers face to face are eligible for one.",
    cite: ["gbp"],
    see: { slug: "google-business-profile", id: "what-it-is" },
  },
  {
    id: "core-web-vitals",
    term: "Core Web Vitals",
    group: "search",
    def: "Google’s three measures of how a page feels to use: how quickly the main content appears (LCP), how quickly the page responds to a tap or click (INP) and how much the layout shifts while it loads (CLS). Google counts a page as good when three-quarters of visits are within 2.5 seconds, 200 milliseconds and 0.1.",
    cite: ["vitals"],
    see: { slug: "redesign-or-improve", id: "diagnosis" },
  },
  {
    id: "pagespeed-insights",
    term: "PageSpeed Insights",
    group: "search",
    def: "A free Google tool that tests a page’s speed. Where a site has enough visitors it shows what real Chrome users experienced over the previous 28 days, alongside a lab test that helps find the causes.",
    cite: ["psi"],
    see: { slug: "redesign-or-improve", id: "diagnosis" },
  },
  {
    id: "search-console",
    term: "Google Search Console",
    group: "search",
    def: "Google’s free service for site owners. It shows which searches your pages appear in, how often people click through, and any problems Google found crawling or indexing your site.",
    cite: ["console"],
    see: { slug: "redesign-or-improve", id: "diagnosis" },
  },
  {
    id: "title-and-description",
    term: "Title and meta description",
    group: "search",
    def: "The title is a page’s clickable headline in search results, and the description is the summary that can appear under it. Write one of each for every page; Google may still show other wording from the page when it describes the page better.",
    cite: ["titles", "snippet"],
    see: { slug: "redesign-or-improve", id: "fixes" },
  },
  {
    id: "redirect",
    term: "301 redirect",
    also: "Permanent redirect",
    group: "search",
    def: "An instruction that sends people and search engines from an old address to its new one, for good. When pages move, Google recommends permanent redirects (301 or 308), kept for as long as possible and generally at least a year.",
    cite: ["moves"],
    see: { slug: "redesign-or-improve", id: "protect" },
  },
  {
    id: "sitemap",
    term: "Sitemap",
    group: "search",
    def: "A file that lists the pages of a website so search engines can find them all. Google’s starter guide says submitting one can help a site be discovered, but is not required.",
    cite: ["starter"],
    see: { slug: "what-is-seo", id: "five-jobs" },
  },
  {
    id: "structured-data",
    term: "Structured data",
    group: "search",
    def: "Labels in a page’s code that tell search engines what the page contains: an article and its author, a business and its address, a list of questions and answers. Complete, accurate structured data can make a page eligible for richer results, and it must only describe what visitors can see on the page.",
    cite: ["sd"],
  },
  {
    id: "wcag",
    term: "WCAG",
    also: "Web Content Accessibility Guidelines",
    group: "search",
    def: "The international standard for making websites usable by people with disabilities, published by the W3C. A website quote should name the version and level it will meet, such as WCAG 2.2 level AA.",
    cite: ["wcag"],
    see: { slug: "website-quote-checklist", id: "the-lines" },
  },
  {
    id: "analytics",
    term: "Analytics",
    group: "search",
    def: "Software that counts visits and what people do on your site: which pages they arrive on, where they go next and where they leave. Keep the same analytics account through a redesign, so you can compare before and after.",
    see: { slug: "redesign-or-improve", id: "protect" },
  },

  // ---- Platforms and connections ----
  {
    id: "crm",
    term: "CRM",
    also: "Customer relationship management system",
    group: "platforms",
    def: "Where a business keeps its contacts and enquiries, and the history of every conversation with each customer.",
    see: { slug: "connect-website-crm-booking", id: "common" },
  },
  {
    id: "client-portal",
    term: "Client portal",
    group: "platforms",
    def: "A private area behind a login where each client sees their own work with you: progress, documents, approvals and invoices. Your team sees every client in the same system.",
    see: { slug: "when-you-need-a-client-portal", id: "what-it-is" },
  },
  {
    id: "off-the-shelf",
    term: "Off-the-shelf software",
    also: "SaaS",
    group: "platforms",
    def: "Software you subscribe to rather than have built, usually paid per user per month. It is often the right first step, and stops fitting when your work has steps the product doesn’t allow for.",
    see: { slug: "when-you-need-a-client-portal", id: "off-the-shelf" },
  },
  {
    id: "website-builder",
    term: "Website builder",
    group: "platforms",
    def: "A subscription product for building a website from ready-made templates in a browser editor, with the hosting handled for you. It suits simple sites, and moving a site out of one later takes planning.",
    see: { slug: "diy-website-or-hire", id: "diy" },
  },
  {
    id: "integration",
    term: "Integration",
    group: "platforms",
    def: "A connection that passes information between two systems automatically, such as a website form creating an enquiry in your CRM, so nobody types it twice.",
    see: { slug: "connect-website-crm-booking", id: "three-ways" },
  },
  {
    id: "api",
    term: "API",
    also: "Application programming interface",
    group: "platforms",
    def: "The documented way one piece of software lets another read or change its data. Most integrations are built on one; use the official API, because connections made any other way break more easily.",
    see: { slug: "connect-website-crm-booking", id: "three-ways" },
  },
  {
    id: "webhook",
    term: "Webhook",
    group: "platforms",
    def: "A message one system sends to another the moment something happens, such as a new booking, so the other system can act straight away instead of checking every few minutes.",
  },
  {
    id: "field-map",
    term: "Field map",
    group: "platforms",
    def: "A table of which piece of information goes where between two systems: the form’s email field into the CRM’s email field, the service chosen into the right job type, and so on. Writing one down prevents most integration mistakes.",
    see: { slug: "connect-website-crm-booking", id: "field-map" },
  },
  {
    id: "source-of-truth",
    term: "Source of truth",
    group: "platforms",
    def: "The one system whose copy of a piece of information counts when two systems disagree. Decide it for every piece of information you connect.",
    see: { slug: "connect-website-crm-booking", id: "field-map" },
  },

  // ---- AI and automation ----
  {
    id: "automation",
    term: "Automation",
    group: "ai",
    def: "Software carrying out a repeated task by rules, such as filing a form submission or sending a reminder, without a person doing each step.",
    see: { slug: "ai-automation-workflows", id: "good-fit" },
  },
  {
    id: "generative-ai",
    term: "Generative AI",
    group: "ai",
    def: "AI that produces new text, images or other content in response to an instruction (a prompt). The tools that draft emails and summarise documents are built on large language models.",
  },
  {
    id: "llm",
    term: "Large language model",
    also: "LLM",
    group: "ai",
    def: "The kind of AI model behind chat assistants and writing tools, trained on very large amounts of text to produce fluent language. Fluent isn’t the same as correct, which is why its output needs checking.",
  },
  {
    id: "hallucination",
    term: "Hallucination",
    group: "ai",
    def: "When an AI tool states something false as if it were true, such as a policy you don’t have or a price you don’t charge. The Privacy Commissioner warns that generative AI tools often produce very confident errors of fact, and advises checking output before relying on it.",
    cite: ["genai"],
    see: { slug: "ai-automation-workflows", id: "assistant" },
  },
  {
    id: "human-in-the-loop",
    term: "Human in the loop",
    group: "ai",
    def: "A way of designing automation where a person reviews and approves what the system proposes before anything important happens. The Privacy Commissioner suggests having a person review generative AI output before an organisation acts on it.",
    cite: ["genai"],
    see: { slug: "ai-automation-workflows", id: "good-fit" },
  },
  {
    id: "chat-assistant",
    term: "Chat assistant",
    also: "Website chatbot",
    group: "ai",
    def: "Software on a website that answers visitors’ questions in conversation. The kind built on generative AI drafts its own answers, so the Privacy Commissioner’s guidance applies: it should answer from approved material, say what it is, and hand over to a person rather than improvise.",
    cite: ["genai"],
    see: { slug: "website-chat-assistant", id: "harm" },
  },

  // ---- Privacy, consent and security ----
  {
    id: "privacy-act",
    term: "Privacy Act 2020",
    group: "privacy",
    def: "New Zealand’s privacy law. It sets out information privacy principles for collecting, storing, using and sharing personal information: 13 of them, plus principle 3A, in force from 1 May 2026, on what to tell people when you collect their information from someone else.",
    cite: ["ipps", "ipp3a"],
    see: { slug: "ai-automation-workflows", id: "privacy" },
  },
  {
    id: "privacy-breach",
    term: "Notifiable privacy breach",
    group: "privacy",
    def: "A privacy breach that has caused, or might cause, serious harm. The business must notify the Privacy Commissioner as soon as practicable; the Commissioner says ideally within 72 hours of becoming aware of it.",
    cite: ["notify"],
    see: { slug: "when-you-need-a-client-portal", id: "security" },
  },
  {
    id: "uema",
    term: "Unsolicited Electronic Messages Act 2007",
    also: "New Zealand’s anti-spam law",
    group: "privacy",
    def: "The law on commercial emails and texts. Each one needs the person’s consent (express, inferred or deemed), must say clearly who sent it and how to contact them, and must have a working unsubscribe, with requests honoured within five working days.",
    cite: ["uema"],
    see: { slug: "connect-website-crm-booking", id: "consent" },
  },
  {
    id: "two-factor",
    term: "Two-factor authentication",
    also: "2FA",
    group: "privacy",
    def: "Signing in with a password plus a second proof: something you have, such as a code on your phone, or something you are, such as a fingerprint. Someone who steals a password is unlikely to have your phone as well.",
    cite: ["tfa"],
    see: { slug: "when-you-need-a-client-portal", id: "security" },
  },
  {
    id: "malware",
    term: "Malware",
    group: "privacy",
    def: "Software put on a system without the owner’s consent to damage it, spy on it or use it. On a website it is usually the reason a host or a browser warns visitors away, and the clean-up is to remove it, restore a clean backup and close the way in.",
    see: { slug: "website-hacked", id: "restore" },
  },
] as const satisfies readonly GlossaryTerm[];

export type TermId = (typeof GLOSSARY)[number]["id"];

export const term = (id: TermId): GlossaryTerm => GLOSSARY.find((t) => t.id === id)!;

/** The glossary's sources, numbered in the order the terms (in page order) first cite them. */
export const glossarySources = () => {
  const order: SourceKey[] = [];
  for (const g of TERM_GROUPS)
    for (const t of GLOSSARY as readonly GlossaryTerm[])
      if (t.group === g.key) for (const k of t.cite ?? []) if (!order.includes(k)) order.push(k);
  return order.map((k) => ({ key: k, ...GLOSSARY_SOURCES[k] }));
};
