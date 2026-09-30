/**
 * THE PAGE'S WORDS AND ITEMS — every list the home page renders, in one place,
 * so the client's real material drops straight in. Plain, specific, no
 * invented numbers (CLAUDE.md). Items marked `placeholder` are layout slots
 * waiting for the client's real case studies.
 */

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Where the site lives, for absolute URLs (share cards, the sitemap). Set
 * NEXT_PUBLIC_SITE_URL when it moves to its own domain (https://nerodyn.com).
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || (BASE ? `https://artinamr.github.io${BASE}` : "http://localhost:3000")
).replace(/\/$/, "");

/** What each discipline actually delivers (the "What we build" panels). */
export const DELIVERABLES: Record<"websites" | "platforms" | "ai", string[]> = {
  websites: ["Custom design, no templates", "Fast on every phone and screen", "Search foundations built in", "Content your team edits itself"],
  platforms: ["Client portals and dashboards", "Booking, payments and accounts", "Internal tools and admin", "Connected to the software you use"],
  ai: ["Site assistants that answer and book", "Inbox, document and data work", "Agents inside your team's tools", "A person in the loop where it matters"],
};

export type WorkItem = {
  id: string;
  /** Which of the three disciplines it shows. */
  kind: "Website" | "Platform" | "AI automation";
  name: string;
  client: string;
  line: string;
  cover: string;
  href?: string;
  /** A layout slot, not a real project yet. */
  placeholder?: boolean;
};

/** Selected work. PLACEHOLDERS until the client supplies three real projects. */
export const WORK: WorkItem[] = [
  {
    id: "w1",
    kind: "Website",
    name: "Project name",
    client: "Client · sector",
    line: "One line on what we built, and what changed for the business once it was live.",
    cover: `${BASE}/work/cover-1.jpg`,
    placeholder: true,
  },
  {
    id: "w2",
    kind: "Platform",
    name: "Project name",
    client: "Client · sector",
    line: "One line on the system we built, who uses it every day, and what it replaced.",
    cover: `${BASE}/work/cover-2.jpg`,
    placeholder: true,
  },
  {
    id: "w3",
    kind: "AI automation",
    name: "Project name",
    client: "Client · sector",
    line: "One line on the work the automation now does, and the time it gave back to the team.",
    cover: `${BASE}/work/cover-3.jpg`,
    placeholder: true,
  },
];

/** How we work — the methodology page's four steps. */
export const PROCESS = [
  {
    day: "Day 1",
    title: "Discover",
    body: "A thirty-minute call. You tell us what is broken; we map the fix — the business, the people, the systems.",
    note: "Call · audit · scope",
  },
  {
    day: "Day 3",
    title: "Design",
    body: "A clickable prototype you approve before a line of code is written. No surprises later.",
    note: "Prototype · sign-off",
  },
  {
    day: "Day 11",
    title: "Build",
    body: "Native code on solid infrastructure, with AI wired in where it removes real work. Tested on every device.",
    note: "Engineering · AI · testing",
  },
  {
    day: "Day 14",
    title: "Live",
    body: "A clean launch. You own the code, the domain and every asset — and we stay on to look after it.",
    note: "Launch · handover · care",
  },
];

/** Questions a buyer asks before the first call. (For the client's sign-off.) */
export const FAQ = [
  {
    q: "What does it cost?",
    a: "It depends on what you need, so there is no price list. After the free audit you get a fixed quote in writing — scope, price and timeline — before anything starts.",
  },
  {
    q: "How long does it take?",
    a: "Most websites go live in about fourteen days. Platforms and automation depend on the systems involved; the quote says how long, and that is the date we work to.",
  },
  {
    q: "Who owns the website and the code?",
    a: "You do. The code, the domain, the content and every account are in your name. No licence to keep paying, and nothing that locks you to us.",
  },
  {
    q: "Can you work with the tools we already use?",
    a: "Yes. We connect to what you have — your CRM, accounting, booking and email — instead of asking you to replace it.",
  },
  {
    q: "Is AI safe to put in front of our customers?",
    a: "When it is built with limits, yes. Every assistant has clear rules on what it may say and do, a person in the loop for anything that matters, and your data stays yours.",
  },
  {
    q: "What happens after launch?",
    a: "We stay on: fixes, updates and improvements, and for AI, tuning as it learns your business. You decide how much looking after you want.",
  },
];

const QA = Object.fromEntries(FAQ.map((f) => [f.q, f])) as Record<string, { q: string; a: string }>;

/** The questions page: everything a buyer asks, grouped. (For the client's sign-off.) */
export const FAQ_ALL: { group: string; items: { q: string; a: string }[] }[] = [
  {
    group: "Getting started",
    items: [
      {
        q: "What does the free audit include?",
        a: "We look at your website the way your customers do — on a phone, on a laptop, in search. Within two days you get a short, plain write-up: what is working, what is costing you enquiries, and what we would build instead. No pitch, and no obligation.",
      },
      {
        q: "What do you need from us to start?",
        a: "A thirty-minute call, and access to what you already have — your current site, your brand files, the tools your team uses. We take it from there and tell you exactly what we need from you, and when.",
      },
      {
        q: "Can you take over our existing website?",
        a: "Yes. We start with the audit, keep what is working, and rebuild or improve the rest — without taking your site offline while we do it.",
      },
    ],
  },
  {
    group: "Price and time",
    items: [
      QA["What does it cost?"],
      QA["How long does it take?"],
      {
        q: "How do payments work?",
        a: "The written quote sets out the price and when each part is paid, before anything starts. What is in the quote is what you pay.",
      },
    ],
  },
  {
    group: "Working together",
    items: [
      {
        q: "Who will we be working with?",
        a: "The people who build it. There are no account managers in between: you talk to the team designing and engineering your project, you see progress as it happens, and you approve each stage.",
      },
      QA["Can you work with the tools we already use?"],
      {
        q: "Do you write the content?",
        a: "We can. We work from what you know about your business and write in plain language; you approve every word before it goes live.",
      },
    ],
  },
  {
    group: "Ownership and after launch",
    items: [
      QA["Who owns the website and the code?"],
      {
        q: "Where is the site hosted?",
        a: "On modern, secure infrastructure — set up in your name, so it stays fast, stays yours, and can move with you if you ever want it to.",
      },
      QA["What happens after launch?"],
    ],
  },
  {
    group: "AI automation",
    items: [
      {
        q: "What can AI automation actually do for us?",
        a: "Take repetitive work off your team: answering and routing enquiries, booking, handling documents and data, drafting replies — inside your website and inside the tools your team already uses.",
      },
      QA["Is AI safe to put in front of our customers?"],
      {
        q: "Will it replace our staff?",
        a: "That is not the aim. It takes the repetitive work off your people, so they spend their time on the work that needs a person.",
      },
    ],
  },
];

/** The methodology page's four stages, in depth. */
export const STAGES = [
  {
    day: "Day 1",
    title: "Discover",
    lede: "A thirty-minute call. You tell us what is broken; we map the fix — the business, the people, the systems.",
    points: ["The free audit of what you have", "What your customers need to find, and do", "A written scope, price and date"],
    image: `${BASE}/method/discover.webp`,
  },
  {
    day: "Day 3",
    title: "Design",
    lede: "A clickable prototype of the real thing, with your words in it, that you approve before a line of code is written.",
    points: ["Every page planned, piece by piece", "Designed for your business, never a theme", "Your sign-off before we build"],
    image: `${BASE}/method/design.webp`,
  },
  {
    day: "Day 11",
    title: "Build",
    lede: "Native code on solid infrastructure, with AI wired in where it removes real work. Tested on every phone and screen.",
    points: ["Engineered by the people who designed it", "Connected to the tools you already use", "Fast, accessible, found in search"],
    image: `${BASE}/method/build.webp`,
  },
  {
    day: "Day 14",
    title: "Live",
    lede: "A careful launch. You own the code, the domain and every asset — and we stay on to look after it.",
    points: ["Everything handed over in your name", "Plain notes on how it all works", "Looked after, as much as you want"],
    image: `${BASE}/method/live.webp`,
  },
];

/** How we work, in four words (methodology, studio). */
export const PRINCIPLES = [
  { name: "Ownership", line: "You own it all — code, domain, every asset. No platform holds you hostage." },
  { name: "Craft", line: "Made to fit your business, not stamped from a theme ten others bought." },
  { name: "Clarity", line: "Straight answers in plain language, tied to your bottom line. Never left guessing." },
  { name: "Proof", line: "Useful first: we audit what you have before you spend anything — free." },
];

/** Contact. The social profiles show only once they are filled in (the client supplies them). */
export const CONTACT = {
  email: "artin@nerodyn.com",
  linkedin: "",
  instagram: "",
};

/**
 * Where the audit form posts (JSON, CORS). The static site has no server of its
 * own: by default it goes through FormSubmit to CONTACT.email (the address
 * confirms once — FormSubmit emails an "Activate Form" link on the first
 * submission). NEXT_PUBLIC_FORM_ENDPOINT overrides it with any JSON endpoint.
 */
export const FORM_ENDPOINT = process.env.NEXT_PUBLIC_FORM_ENDPOINT || `https://formsubmit.co/ajax/${CONTACT.email}`;

/** The site's own pages. */
export const PAGES = {
  home: `${BASE}/`,
  services: `${BASE}/services/`,
  service: (slug: string) => `${BASE}/services/${slug}/`,
  work: `${BASE}/work/`,
  project: (slug: string) => `${BASE}/work/${slug}/`,
  methodology: `${BASE}/methodology/`,
  studio: `${BASE}/studio/`,
  pricing: `${BASE}/pricing/`,
  blog: `${BASE}/blog/`,
  article: (slug: string) => `${BASE}/blog/${slug}/`,
  contact: `${BASE}/contact/`,
  faq: `${BASE}/faq/`,
  privacy: `${BASE}/privacy/`,
  terms: `${BASE}/terms/`,
};

/**
 * Search engines index the site only on its real domain (NEXT_PUBLIC_SITE_URL
 * set). The GitHub Pages preview says noindex, so it never competes with
 * nerodyn.com; links shared from it still show their cards.
 */
export const INDEXABLE = Boolean(process.env.NEXT_PUBLIC_SITE_URL);

/** A page's absolute URL (for structured data) from its href (which carries the base path). */
export const abs = (href: string) => `${SITE_URL}${href.slice(BASE.length)}`;

