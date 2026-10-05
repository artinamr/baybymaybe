/**
 * THE THREE DISCIPLINES: one record each, rendered by /services and
 * /services/[slug]. Plain, specific, no invented numbers and no em dashes
 * (CLAUDE.md); the promises match lib/content.ts (a fixed written quote,
 * "about fourteen days" for most websites, everything in the client's name).
 * For the client's sign-off with the rest of the copy.
 */

import { PHOTOS, type Photo } from "@/content/images";

export type Item = { title: string; body: string };

export type Service = {
  slug: "websites" | "platforms" | "ai-automation";
  n: string;
  name: string;
  /** The page title, in two voices: ink, then indigo. */
  h1: [string, string];
  /** One line for cards and menus. */
  line: string;
  lede: string;
  /** For search results: under 160 characters. */
  description: string;
  /** The page's title in search results (the name is added after it): under 50 characters. */
  seoTitle: string;
  /** The wide banner (24:11) and the 4:5 card on /services/ (content/images.ts). */
  photo: Photo;
  cardPhoto: Photo;
  /** When it is the right call. */
  signs: Item[];
  /** What you get. */
  deliver: Item[];
  /** How we approach it. */
  approach: Item[];
  /** What you bring. */
  bring: string[];
  /** How long it takes, for the "at a glance" panel beside the title. */
  timeline: string;
  /** What decides the size of the job, for this discipline (the pricing page has the whole picture). */
  price: Item[];
  faq: { q: string; a: string }[];
  /** Case studies (slugs in content/work.ts) that show it. */
  work: string[];
};

export const SERVICES: Service[] = [
  {
    slug: "websites",
    n: "01",
    name: "Websites",
    h1: ["Websites that turn visits", "into enquiries."],
    line: "Custom-designed, fast on every phone, found in search, and yours.",
    lede: "Designed around your customers, fast on every phone and built on clean code you own. Clear about what you do, easy to find in search, and simple for your team to keep up to date.",
    description:
      "Custom website design and development for New Zealand businesses: fast on every phone, built for search and accessibility, easy to edit, and yours.",
    seoTitle: "Website design and development, Auckland",
    photo: PHOTOS["svc-websites"],
    cardPhoto: PHOTOS["svc-websites-card"],
    signs: [
      {
        title: "Your site no longer says what you do",
        body: "The business has moved on and the website hasn’t. A visitor can’t tell in a few seconds what you offer, who it is for and how to start.",
      },
      {
        title: "It looks fine, but brings in little",
        body: "People visit and leave. Enquiries are few, or they arrive by phone because the site gives no easy way in.",
      },
      {
        title: "Every change needs a developer",
        body: "Editing a page, adding a service or publishing news means waiting on someone else, so it doesn’t happen.",
      },
    ],
    deliver: [
      {
        title: "Custom design, no templates",
        body: "Designed for your business and your customers from the first sketch, not a theme adjusted to fit.",
      },
      {
        title: "Fast on every phone and screen",
        body: "Built mobile-first with lean code, so pages load quickly on a phone signal as well as office broadband.",
      },
      {
        title: "Search foundations built in",
        body: "Clean structure, titles and descriptions, structured data, a sitemap and fast pages: the groundwork search engines look for.",
      },
      {
        title: "Content your team edits itself",
        body: "Change text, add pages and publish updates without a developer, in an editor set up around your content.",
      },
      {
        title: "Accessible by design",
        body: "Readable type, sound contrast, keyboard navigation and proper labels, so the site works for everyone who needs it.",
      },
      {
        title: "Enquiries that reach you",
        body: "Forms, booking and contact routes that land in the right inbox or system, with nothing lost on the way.",
      },
    ],
    approach: [
      {
        title: "Start from the customer",
        body: "What are people trying to find out, or do? We plan every page around those questions before anything is designed.",
      },
      {
        title: "Words and design together",
        body: "Content is designed with the layout, not poured in afterwards, so each page says one thing clearly.",
      },
      {
        title: "Prototype, then build",
        body: "You click through a working prototype with your real words and approve it before production code is written.",
      },
      {
        title: "Launch with the groundwork done",
        body: "Old addresses redirected, analytics and search set up and every page checked, so you keep what your old site had earned.",
      },
    ],
    bring: [
      "Your goals, and who your customers are",
      "Your content, or time with us to write it",
      "Access to your domain and current site",
      "One person who can make decisions",
    ],
    timeline: "About fourteen days for most websites. Larger sites take longer, and the quote gives the date.",
    price: [
      { title: "How many kinds of page", body: "Many pages built from a few layouts cost less than pages that each need a design of their own." },
      { title: "Who writes the words", body: "Finished words and photos from you, or writing and shaping them together with us." },
      { title: "What it connects to", body: "Booking, payments, a CRM or a newsletter each add design, building and testing." },
      { title: "What moves across", body: "Pages and posts brought over from the current site, and its old addresses redirected." },
    ],
    faq: [
      {
        q: "Can you work with our existing brand?",
        a: "Yes. We work with your logo, colours and type, and refine them where the website needs more than the brand currently gives it.",
      },
      {
        q: "Who writes the words?",
        a: "Usually you give us the facts and we shape them into pages, or you write and we edit. Either way, you approve every word before it goes live.",
      },
      {
        q: "Will a new site lose our search rankings?",
        a: "Not when the move is handled properly: we map every old address to its new page, keep the content that works and check it all at launch.",
      },
      {
        q: "How long does it take?",
        a: "Most websites go live in about fourteen days from the agreed scope. Larger sites take longer; your quote gives the date, and that is the date we work to.",
      },
    ],
    work: ["practice-website"],
  },
  {
    slug: "platforms",
    n: "02",
    name: "Platforms",
    h1: ["Platforms your team", "and your clients run on."],
    line: "Portals, bookings, dashboards and internal tools, built around how you work.",
    lede: "Client portals, booking and payment flows, dashboards and internal tools, built around the way your business actually works and connected to the software you already use.",
    description:
      "Client portals, booking systems, dashboards and internal tools for New Zealand businesses, connected to the software you already use and owned by you.",
    seoTitle: "Client portals, booking and web platforms",
    photo: PHOTOS["svc-platforms"],
    cardPhoto: PHOTOS["svc-platforms-card"],
    signs: [
      {
        title: "Work lives in spreadsheets and inboxes",
        body: "Bookings, jobs, client files and approvals are spread across tools that don’t talk to each other, and someone copies between them.",
      },
      {
        title: "Clients keep asking for updates",
        body: "Where is it, what’s next, what do I owe? The same questions take up hours that a portal would answer for them.",
      },
      {
        title: "Off-the-shelf software almost fits",
        body: "You pay for a tool and work around it. The part it doesn’t fit is exactly where your business is different.",
      },
    ],
    deliver: [
      {
        title: "Client portals and dashboards",
        body: "A secure place for clients to see progress, files, invoices and messages, and for you to see the whole picture.",
      },
      {
        title: "Booking, payments and accounts",
        body: "Scheduling, deposits and payments, customer accounts and reminders, built around your own rules.",
      },
      {
        title: "Internal tools and admin",
        body: "The screens your team uses every day (job lists, approvals, stock, rosters), shaped to the way they work.",
      },
      {
        title: "Connected to the software you use",
        body: "Linked to your accounting, CRM, calendar and email through their official integrations, so data is entered once.",
      },
      {
        title: "Roles and permissions",
        body: "Everyone sees what they need and nothing more: staff, clients, contractors and administrators.",
      },
      {
        title: "Looked after after launch",
        body: "Monitoring, updates and improvements as your business changes, for as long as you want us.",
      },
    ],
    approach: [
      {
        title: "Map the work first",
        body: "We follow a job, booking or client from start to finish and write down every step, system and hand-over.",
      },
      {
        title: "Build the smallest useful version",
        body: "Launch the part that removes the most friction first, then add to it, rather than running a year-long project.",
      },
      {
        title: "Connect, don’t duplicate",
        body: "Use the official integrations of the tools you keep, so each piece of data has one home.",
      },
      {
        title: "Secure from the first version",
        body: "Accounts, permissions, backups and an audit trail are part of the first release, not a later phase.",
      },
    ],
    bring: [
      "Someone who knows the process end to end",
      "Access to the systems it connects to",
      "Example data, forms and documents",
      "Time to test it with the people who will use it",
    ],
    timeline: "Released in stages: the smallest useful version first, then the rest. The quote gives each date.",
    price: [
      { title: "Who uses it", body: "Each role (staff, clients, contractors, administrators) needs its own screens and permissions." },
      { title: "The steps it runs", body: "A job, booking or approval with more stages and more rules takes more to build and test." },
      { title: "What it connects to", body: "Every system (accounting, CRM, calendar, payments) is mapped, built and tested against real data." },
      { title: "What moves in", body: "Clients, jobs and records brought over from spreadsheets or an old system." },
    ],
    faq: [
      {
        q: "Why not just use an off-the-shelf tool?",
        a: "Often you should, and we will say so. Custom work makes sense when the part a tool doesn’t fit is the part that makes your business different, or when several tools need to act as one.",
      },
      {
        q: "Can it connect to our accounting software?",
        a: "Usually, yes. Most modern accounting, CRM and booking tools offer official integrations. We confirm what is possible during scoping, before you commit.",
      },
      {
        q: "Who owns the platform and the data?",
        a: "You do: the code, the data and the accounts it runs on. If you ever move to another team, everything moves with you.",
      },
    ],
    work: ["operations-portal"],
  },
  {
    slug: "ai-automation",
    n: "03",
    name: "AI automation",
    h1: ["AI that does the work,", "and knows when to ask."],
    line: "Assistants and automations in your website and your team’s tools, with a person in the loop.",
    lede: "Assistants and automations that take repetitive work off your team: answering and booking on your website, sorting the inbox, reading documents, moving data between systems. A person stays in the loop wherever it matters.",
    description:
      "AI automation for New Zealand businesses: website assistants, inbox and document work, and agents in your tools, tested on real work, with a person in charge.",
    seoTitle: "AI automation for New Zealand businesses",
    photo: PHOTOS["svc-ai"],
    cardPhoto: PHOTOS["svc-ai-card"],
    signs: [
      {
        title: "The same task, over and over",
        body: "Reading enquiries, copying details into a system, writing the same reply with small changes: work a person should check, but shouldn’t have to do from scratch.",
      },
      {
        title: "Enquiries arrive out of hours",
        body: "Questions come in at night and at weekends, and wait until someone is back at a desk.",
      },
      {
        title: "Information is locked in documents",
        body: "Quotes, forms, emails and PDFs hold the details you need, but pulling them out is slow and easy to get wrong.",
      },
    ],
    deliver: [
      {
        title: "Site assistants that answer and book",
        body: "An assistant on your website that answers from your own information, collects details and books the next step, and hands over to a person when it should.",
      },
      {
        title: "Inbox, document and data work",
        body: "Incoming email sorted and summarised, details read from forms and PDFs, records updated in the systems you use.",
      },
      {
        title: "Agents inside your team’s tools",
        body: "Automations that run where your team already works (email, shared drives, your CRM) rather than in yet another app.",
      },
      {
        title: "A person in the loop where it matters",
        body: "Drafts wait for approval, uncertain cases go to a person, and every action is logged so you can see what happened.",
      },
      {
        title: "Clear boundaries",
        body: "Each automation has a written scope: what it can read, what it can change and what it must never do.",
      },
      {
        title: "Checked and maintained",
        body: "Tested against real examples before launch and checked after it. Models and tools change, and the automation should keep up.",
      },
    ],
    approach: [
      {
        title: "Pick the right task",
        body: "We look for work that is frequent, follows rules and can be checked, and we say plainly when a task isn’t a good fit for AI.",
      },
      {
        title: "Test on your real examples",
        body: "Before anything goes live we run it on past enquiries, emails or documents, and review the results with you.",
      },
      {
        title: "Keep people in control",
        body: "Approval steps, clear hand-overs and logs, so the automation supports your team instead of surprising them.",
      },
      {
        title: "Protect the data",
        body: "We agree with you what the system may see, where it is processed and how long anything is kept, in line with New Zealand’s Privacy Act 2020.",
      },
    ],
    bring: [
      "Real examples of the work: past emails, enquiries, documents",
      "The rules your team follows now",
      "Access to the tools involved",
      "Someone to review results before launch",
    ],
    timeline: "A trial on your own past examples first, then live. The quote gives the dates.",
    price: [
      { title: "How many steps and systems", body: "Reading one inbox is a smaller job than reading, deciding and updating three systems." },
      { title: "How much review it needs", body: "Work with more at stake needs more approval steps, more logging and more testing." },
      { title: "How varied the work is", body: "The more kinds of enquiry or document it handles, the more real examples it is tested on." },
      { title: "How much it processes", body: "AI services charge by volume, so running costs follow yours. We estimate them from your numbers." },
    ],
    faq: [
      {
        q: "Is it safe to put AI in front of customers?",
        a: "With limits, yes. The assistant answers from information you have approved, says when it doesn’t know and hands over to a person. We test it on real questions before it goes live.",
      },
      {
        q: "What does it cost to run?",
        a: "Besides the build, AI services charge for what they process. We estimate the running cost from your real volumes during scoping, and set limits and alerts so there are no surprises.",
      },
      {
        q: "Will it replace our staff?",
        a: "That is not the aim. It takes the repetitive part of the work, so your people spend their time where judgement and relationships matter.",
      },
    ],
    work: ["enquiry-desk"],
  },
];

export const service = (slug: string) => SERVICES.find((s) => s.slug === slug);
