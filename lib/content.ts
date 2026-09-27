/**
 * THE PAGE'S WORDS AND ITEMS — every list the home page renders, in one place,
 * so the client's real material drops straight in. Plain, specific, no
 * invented numbers (CLAUDE.md). Items marked `placeholder` are layout slots
 * waiting for the client's real case studies.
 */

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

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

/** Contact (placeholders: the client confirms the real inbox and profiles before launch). */
export const CONTACT = {
  email: "hello@nerodyn.com",
  linkedin: "https://www.linkedin.com/",
  instagram: "https://www.instagram.com/",
};

export const METHODOLOGY_HREF = `${BASE}/methodology/`;
