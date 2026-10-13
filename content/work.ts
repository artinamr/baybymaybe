/**
 * THE WORK — one record per project, rendered by /work, /work/[slug], the
 * home page's work section and the service pages. Two kinds so far, both
 * fictional businesses and labelled so (no invented clients, testimonials or
 * results, CLAUDE.md):
 *   - CONCEPT WEBSITES (`kind: "site"`, content/sites.ts): complete websites
 *     the studio designed and built, served as they are from public/sites/
 *     (tools/showcase/import.py) and pictured by tools/showcase/;
 *   - STUDIO DEMONSTRATIONS (`kind: "demo"`, below): working pieces of a
 *     platform, an automation and a website, running inside their case study.
 * A real client project takes the same shape with `kind: "client"`, its
 * measured results in `limits`' place.
 */
import type { Item, Service } from "./services";
import { SITE_PROJECTS } from "./sites";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** A picture of a site: its file, its half-size copy for small screens, its size and what it shows. */
export type Shot = { src: string; half?: string; w: number; h: number; alt: string; label?: string };

/** A concept website: the site itself (hosted with this one) and how it was built. */
export type SiteBuild = {
  /** Where the site is served (public/sites/<slug>/), ending in a slash. */
  live: string;
  /** What the business is, and where (both fictional). */
  sector: string;
  place: string;
  /** The first screen: the poster before the live site loads. */
  home: Shot;
  /** What the website had to do for the business. */
  jobs: string[];
  /** Every main page: its name, its file under `live`, what it is for, its first screen. */
  pages: { name: string; path: string; what: string; shot: string }[];
  /** How many pages in all (the grid may show fewer). */
  pageCount: number;
  /** The features, in use: one or more pictures each, what to notice, and the page to try it on. */
  features: { title: string; body: string; shots: Shot[]; notes: string[]; path: string; tall?: boolean }[];
  /** Phone views, captioned. */
  phones: (Shot & { caption: string })[];
  palette: { name: string; hex: string; role: string }[];
  type: { name: string; role: string }[];
  /** Measured (tools/showcase, 2026-10-06): a figure and what it counts. */
  facts: { value: string; label: string }[];
  /** The details that make it work for everyone, each checked in the site's code. */
  craft: string[];
  /** Where its photographs come from. */
  photos: string;
};

export type Project = {
  slug: string;
  kind: "demo" | "site" | "client";
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
  /** A demonstration: the proposed scope for a live version. A concept website: what was built. */
  scope: string[];
  approach: Item[];
  /** What a demonstration shows (a client project would carry measured results instead). */
  demonstrates: string[];
  limits: string[];
  /** A concept website's own material. */
  site?: SiteBuild;
};

/** How a project is labelled wherever it appears. */
export const KIND_LABEL: Record<Project["kind"], string> = {
  site: "Concept website",
  demo: "Studio demonstration",
  client: "Client project",
};

const DEMOS: Project[] = [
  {
    slug: "practice-website",
    kind: "demo",
    client: "Tarn & Wick",
    title: "A website for an owner-run accounting practice",
    summary:
      "A website demonstration for a fictional accounting practice. Clear services, fees explained and a first conversation booked in three steps.",
    services: ["websites"],
    url: "tarnandwick.example",
    year: "2026",
    cover: `${BASE}/work/practice-website.webp`,
    coverAlt: "The Tarn & Wick home page: a deep green and cream accounting practice website with a booking call to action.",
    context: {
      lede: "The brief for this fictional accounting practice was to make a referral easy to act on. A visitor should be able to see who the practice works with, understand how fees are charged and book a first conversation without waiting for an email reply.",
      audience: "Owners of small businesses choosing or switching accountants, often reading on a phone, often in the evening.",
    },
    scope: [
      "Positioning and a plan for every page",
      "Copy for the key pages",
      "A visual identity for the site: type, colour, components",
      "A booking flow connected to the adviser’s calendar",
      "Service and insight pages the practice edits itself",
      "Search foundations and analytics",
    ],
    approach: [
      {
        title: "Lead with who it’s for",
        body: "The first screen says who the practice serves and what changes for them, then offers one action: a 20-minute call.",
      },
      {
        title: "Say how fees work, early",
        body: "A fixed monthly fee is the practice’s advantage over hourly billing, so the home page says it before anyone has to ask.",
      },
      {
        title: "Book a conversation in three steps",
        body: "Choose a topic, choose a time, then leave your name. The demonstration uses sample availability and shows every time in New Zealand time.",
      },
      {
        title: "Layouts ready for more pages",
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
      "The booking flow uses sample availability and sends nothing. A live site would connect to the adviser’s calendar and send a confirmation.",
      "The demonstration has no content editor. Editing tools would be part of the live website’s scope.",
      "Search performance can only be measured on a live site with real visitors.",
    ],
  },
  {
    slug: "operations-portal",
    kind: "demo",
    client: "Kerrow",
    title: "A client and operations portal for a maintenance company",
    summary:
      "A portal demonstration for a fictional maintenance firm: a team job board, client quote approvals and sample invoices, connected by one job record.",
    services: ["platforms"],
    url: "portal.kerrow.example",
    year: "2026",
    cover: `${BASE}/work/operations-portal.webp`,
    coverTall: `${BASE}/work/operations-portal-tall.webp`,
    coverAlt: "The Kerrow portal: a navy sidebar and a board of maintenance jobs with their status.",
    context: {
      lede: "For this concept, the maintenance team takes requests by phone and email, sends quotes as PDFs and tracks jobs in spreadsheets. We set a brief for one shared job record, so the office, technician and client can each see what needs to happen next.",
      audience: "The office team and the technicians in the field; property and facility managers as clients.",
    },
    scope: [
      "Mapping a job from request to invoice",
      "A team job board, schedule and job records",
      "A client portal for jobs, quotes, invoices and messages",
      "Roles and permissions between the two",
      "Invoices and payments through the accounting software’s own integration",
      "Onboarding for the team and the first clients",
    ],
    approach: [
      {
        title: "One record per job, from request to invoice",
        body: "Every call, quote, photo and invoice hangs off the same job, so anyone can say where things are.",
      },
      {
        title: "A clear view for each client",
        body: "A short, plain view: what’s waiting for them, what’s happening, what they owe, and one button for each.",
      },
      {
        title: "Colour only where it means something",
        body: "Colour marks jobs waiting for approval or parts. Written labels carry the same information, so status remains clear without relying on colour.",
      },
      {
        title: "Built for the phone in the van",
        body: "Technicians work from phones on site, so the same screens fold into a single column with the job’s checklist first.",
      },
    ],
    demonstrates: [
      "A job board shared by the office and the field",
      "A client approval that moves the job on at once (try it above)",
      "Team and client views of the same sample jobs",
      "Screens that work on a technician’s phone",
    ],
    limits: [
      "Kerrow and its clients are fictional; the jobs, quotes and invoices are sample data.",
      "Payments and accounting are simulated here. A live portal connects to the company’s accounting software through its official integration.",
      "The view switch demonstrates the screens, not sign-in or access controls. Those would be required in a live portal.",
      "No results are claimed: a real portal is judged on the time it saves the office, measured after launch.",
    ],
  },
  {
    slug: "enquiry-desk",
    kind: "demo",
    client: "Pellow",
    title: "An enquiry desk with drafts your team can check",
    summary:
      "An enquiry desk demonstration for a fictional physio clinic. Sample messages become organised details and editable drafts, with reception in control.",
    services: ["ai-automation"],
    url: "desk.pellow.example",
    year: "2026",
    cover: `${BASE}/work/enquiry-desk.webp`,
    coverAlt: "The Pellow enquiry desk: an inbox of sample emails, a step-by-step view of one being organised, and a log.",
    context: {
      lede: "The brief was an enquiry desk for a fictional physio clinic. Reception needs the booking details and a useful draft in one place. Messages that could need clinical judgement must be handed to a person, with no reply drafted.",
      audience: "The reception team, and the patients who write in.",
    },
    scope: [
      "Mapping the kinds of enquiry and the clinic’s rules",
      "The automation that reads, organises and drafts",
      "An approval screen and a log of every step",
      "Hand-over rules for anything clinical or uncertain",
      "Testing on past enquiries before launch",
      "A privacy review: what the system may see, where it runs, what it keeps",
    ],
    approach: [
      {
        title: "Organise first, write second",
        body: "The enquiry’s name, request and preferred time appear before the draft, so reception can check the details against the original message.",
      },
      {
        title: "Approved wording for routine questions",
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
      "This page runs locally and sends nothing. A live system connects to the clinic’s email and diary, with access agreed in writing.",
      "The examples are scripted; this demonstration does not connect to an AI model, a live diary or an email account.",
      "A live version would need tests against the clinic’s enquiries, agreed handover rules and a person approving replies.",
    ],
  },
];

/** Every project, in the order the work page shows them: the concept websites first. */
export const WORK_ITEMS: Project[] = [...SITE_PROJECTS, DEMOS[1], DEMOS[2], DEMOS[0]];

export const project = (slug: string) => WORK_ITEMS.find((p) => p.slug === slug);

/** The home page's selected work: the three concept websites (the middle one tall, its phone view). */
export const HOME_WORK = ["butter-days", "blackridge", "outbound"].map((s) => project(s)!);

/** One project per discipline, for the services page. */
export const FEATURED: Record<Service["slug"], string> = {
  websites: "butter-days",
  platforms: "operations-portal",
  "ai-automation": "enquiry-desk",
};
