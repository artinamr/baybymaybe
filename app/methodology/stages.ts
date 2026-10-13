import { STAGES, type Stage } from "@/lib/content";

// This page can develop independently while the homepage is being built.
const COPY: Pick<Stage, "line" | "happens" | "bring" | "produce">[] = [
  {
    line: "Start with the business and the people using it.",
    happens: "We talk through how your business works, then follow the route a customer takes through your website. The audit identifies what to keep, where people get stuck and which changes deserve attention first.",
    bring: ["Half an hour to talk", "Your website and the tools your team uses", "A few real enquiries and the problems behind them"],
    produce: ["A practical audit, with changes in order of priority", "Your goals and constraints, written down"],
  },
  {
    line: "Make the important decisions before the build.",
    happens: "We agree the pages, features and connections, who supplies the content and how we’ll judge the result. You receive a written scope, a fixed quote and a launch date. Work starts once you approve them.",
    bring: ["Your priorities", "One person to approve the work", "Any dates that can’t move"],
    produce: ["A scope with clear inclusions and exclusions", "A fixed quote and a launch date", "A plan for content and approvals"],
  },
  {
    line: "Try the design with your own content.",
    happens: "We develop the page structure, write with you and design a clickable prototype. You can follow the main tasks on a phone and a computer, see how the words and layout work together, and approve the design before we build it.",
    bring: ["Your brand files and business knowledge", "Feedback at the agreed points"],
    produce: ["Page layouts and copy", "A clickable prototype for your approval"],
  },
  {
    line: "Build it carefully. Check the details.",
    happens: "We build the approved design and connect the tools it needs. You get a private review link while we check forms, permissions, accessibility and speed. Your team tries the tasks they’ll use every day before launch.",
    bring: ["Access to the tools we’re connecting", "Suitable test data", "Time for your team to try it"],
    produce: ["A working site or platform on a private review link", "Test results and resolved review feedback"],
  },
  {
    line: "Launch with a proper handover.",
    happens: "We run the launch checklist, redirect old addresses where needed and check that enquiries arrive in the right place. Then we hand over the code, accounts and notes, show your team how to use it, and agree any ongoing care.",
    bring: ["Domain and hosting access", "The people who will manage it"],
    produce: ["The live site and a completed launch checklist", "The code, content and accounts under your control", "Training and plain notes for your team"],
  },
];

export const METHOD_STAGES: Stage[] = STAGES.map((stage, i) => ({ ...stage, ...COPY[i] }));

export const METHOD_PRINCIPLES = [
  { name: "Ownership", line: "The code and content are yours. Your domain and accounts stay under your control, with a clear handover." },
  { name: "Craft", line: "We design around your business, paying attention to the words, the screens and the way they work together." },
  { name: "Clarity", line: "You see the scope, price and decisions in writing. We explain the trade-offs and keep you involved." },
  { name: "Proof", line: "We look at the problem first. You try the design and the working build before either is signed off." },
];
