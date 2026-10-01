/**
 * THE WORK — one record per project, rendered by /work, /work/[slug] and the
 * home page's work section. For now all three are STUDIO DEMONSTRATIONS:
 * fictional businesses, built to show how we would present and build real
 * work — no invented clients, testimonials or results (CLAUDE.md). A real
 * client project takes the same shape with `kind: "client"` and `results`.
 */
import type { Item, Service } from "./services";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export type Project = {
  slug: string;
  kind: "demo" | "client";
  /** The (here fictional) business. */
  client: string;
  title: string;
  summary: string;
  services: Service["slug"][];
  /** The address shown in the browser frame (the reserved .example domain for demonstrations). */
  url: string;
  year: string;
  cover: string;
  /** A 4:5 cover (the phone view), for a tall card. */
  coverTall?: string;
  coverAlt: string;
  context: { lede: string; audience: string };
  scope: string[];
  approach: Item[];
  /** What a demonstration shows (a client project would carry measured results instead). */
  demonstrates: string[];
  limits: string[];
};

export const WORK_ITEMS: Project[] = [
  {
    slug: "practice-website",
    kind: "demo",
    client: "Tarn & Wick",
    title: "A website for an owner-run accounting practice",
    summary:
      "A fictional practice, and a website built around the questions its customers ask: who it is for, how fees work, and how to book a first conversation.",
    services: ["websites"],
    url: "tarnandwick.example",
    year: "2026",
    cover: `${BASE}/work/practice-website.webp`,
    coverAlt: "The Tarn & Wick home page: a deep green and cream accounting practice website with a booking call to action.",
    context: {
      lede: "Small practices win clients by referral, then lose some of them at the website: a list of services, a phone number and a contact form that goes quiet. People choosing an accountant want three answers quickly — do you work with businesses like mine, roughly what will it cost, and how do I start?",
      audience: "Owners of small businesses choosing or switching accountants — often reading on a phone, often in the evening.",
    },
    scope: [
      "Positioning and a plan for every page",
      "Copy for the key pages",
      "A visual identity for the site: type, colour, components",
      "A booking flow connected to the adviser's calendar",
      "Service and insight pages the practice edits itself",
      "Search foundations and analytics",
    ],
    approach: [
      {
        title: "Lead with who it's for",
        body: "The first screen says who the practice serves and what changes for them, then offers one action: a 20-minute call.",
      },
      {
        title: "Say how fees work, early",
        body: "A fixed monthly fee is the practice's advantage over hourly billing, so the home page says it before anyone has to ask.",
      },
      {
        title: "A booking flow, not a contact form",
        body: "Three steps — topic, time, name — replace a form that waits for a reply. Only open times are offered, in New Zealand time.",
      },
      {
        title: "Components, so it grows cleanly",
        body: "Cards, lists and the booking widget share reusable components, so new pages can follow the same design.",
      },
    ],
    demonstrates: [
      "A home page that answers the three questions buyers ask first",
      "Booking in three steps, using sample availability",
      "One layout that works on a phone as well as on a desk",
      "Reusable layouts for home and service pages",
    ],
    limits: [
      "Tarn & Wick is fictional: there are no real clients, fees or results here.",
      "The booking flow uses sample availability and sends nothing. A live site would connect to the adviser's calendar and send a confirmation.",
      "The demonstration has no content editor. Editing tools would be part of the live website's scope.",
      "Search performance can only be measured on a live site with real visitors.",
    ],
  },
  {
    slug: "operations-portal",
    kind: "demo",
    client: "Kerrow",
    title: "A client and operations portal for a maintenance company",
    summary:
      "A fictional building-maintenance firm, and the portal we would build to replace its spreadsheets and phone calls: one job board for the team, and one place for clients to approve quotes, follow their jobs and pay.",
    services: ["platforms"],
    url: "portal.kerrow.example",
    year: "2026",
    cover: `${BASE}/work/operations-portal.webp`,
    coverTall: `${BASE}/work/operations-portal-tall.webp`,
    coverAlt: "The Kerrow portal: a navy sidebar and a board of maintenance jobs with their status.",
    context: {
      lede: "A maintenance company runs dozens of small jobs across many sites. Jobs arrive by phone and email, quotes go out as PDFs, approvals come back days later, and the office spends its afternoons answering one question: when is someone coming?",
      audience: "The office team and the technicians in the field; property and facility managers as clients.",
    },
    scope: [
      "Mapping a job from request to invoice",
      "A team job board, schedule and job records",
      "A client portal for jobs, quotes, invoices and messages",
      "Roles and permissions between the two",
      "Invoices and payments through the accounting software's own integration",
      "Onboarding for the team and the first clients",
    ],
    approach: [
      {
        title: "One record per job, from request to invoice",
        body: "Every call, quote, photo and invoice hangs off the same job, so anyone can say where things are.",
      },
      {
        title: "Clients see their jobs, not the system",
        body: "A short, plain view: what's waiting for them, what's happening, what they owe — and one button for each.",
      },
      {
        title: "Colour only where it means something",
        body: "Status colours mark the states that need action — waiting for approval, waiting for parts — so a busy board still reads at a glance.",
      },
      {
        title: "Built for the phone in the van",
        body: "Technicians work from phones on site, so the same screens fold into a single column with the job's checklist first.",
      },
    ],
    demonstrates: [
      "A job board shared by the office and the field",
      "A client approval that moves the job on at once — try it above",
      "Team and client views of the same sample jobs",
      "Screens that work on a technician's phone",
    ],
    limits: [
      "Kerrow and its clients are fictional; the jobs, quotes and invoices are sample data.",
      "Payments and accounting are simulated here. A live portal connects to the company's accounting software through its official integration.",
      "The view switch demonstrates the screens, not sign-in or access controls. Those would be required in a live portal.",
      "No results are claimed: a real portal is judged on the time it saves the office, measured after launch.",
    ],
  },
  {
    slug: "enquiry-desk",
    kind: "demo",
    client: "Pellow",
    title: "An enquiry desk that drafts its own replies — and knows when not to",
    summary:
      "A fictional physiotherapy clinic, and the automation we would build for its inbox: enquiries read and organised, the diary checked, replies drafted in the clinic's own words — and a person approving every one.",
    services: ["ai-automation"],
    url: "desk.pellow.example",
    year: "2026",
    cover: `${BASE}/work/enquiry-desk.webp`,
    coverAlt: "The Pellow enquiry desk: an inbox of sample emails, a step-by-step view of one being organised, and a log.",
    context: {
      lede: "A clinic's reception spends much of the day on email: booking requests, changes, questions about cover and cost. Most need the same few steps — read, find the details, check the diary, reply. A few need a clinician straight away.",
      audience: "The reception team, and the patients who write in.",
    },
    scope: [
      "Mapping the kinds of enquiry and the clinic's rules",
      "The automation that reads, organises and drafts",
      "An approval screen and a log of every step",
      "Hand-over rules for anything clinical or uncertain",
      "Testing on past enquiries before launch",
      "A privacy review: what the system may see, where it runs, what it keeps",
    ],
    approach: [
      {
        title: "Organise first, write second",
        body: "The system pulls out who, what and when before it drafts a word, and shows its working — so a person can check it in seconds.",
      },
      {
        title: "The clinic's words, not the model's",
        body: "Replies are built from approved wording for bookings, changes and cover, then fitted to the enquiry.",
      },
      {
        title: "A person approves every reply",
        body: "Nothing leaves without a click from reception, and every step is logged.",
      },
      {
        title: "Lines it never crosses",
        body: "Anything that could be clinical goes straight to a person. The system never gives advice and never confirms cover.",
      },
    ],
    demonstrates: [
      "Enquiries turned into organised details a person can check",
      "Diary checks that respect what the patient asked for",
      "Draft replies that reception edits and approves",
      "A hard stop for anything that needs a clinician",
    ],
    limits: [
      "Pellow and its patients are fictional; the emails, names and times are samples.",
      "This page runs locally and sends nothing. A live system connects to the clinic's email and diary, with access agreed in writing.",
      "AI can misread a message. That is why a person approves every reply and every step is logged.",
    ],
  },
];

export const project = (slug: string) => WORK_ITEMS.find((p) => p.slug === slug);
