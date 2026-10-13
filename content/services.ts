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
  /** Everything a project includes, in groups: the full specification. */
  includes: { group: string; items: string[] }[];
  /** How a project runs, step by step (`when` for a website is the days; otherwise the order). */
  runs: { title: string; lede: string; steps: { when: string; title: string; body: string }[] };
  /** How it is built, in plain words. */
  built: Item[];
  /** What looking after it means, after launch. */
  care: string[];
};

export const SERVICES: Service[] = [
  {
    slug: "websites",
    n: "01",
    name: "Websites",
    h1: ["Your business,", "properly presented."],
    line: "A clear presence for your business, with an easy next step for your customers.",
    lede: "We design websites that give your business a clear presence and make the next step easy. From the wording to the enquiry form, every part is built around the people using it. Your team gets a site it can keep up to date.",
    description:
      "Website design and development in Auckland. Distinctive design, clear content and a careful build, with the code and accounts in your name.",
    seoTitle: "Website design and development, Auckland",
    photo: PHOTOS["svc-websites"],
    cardPhoto: PHOTOS["svc-websites-card"],
    signs: [
      {
        title: "Your site no longer says what you do",
        body: "The business has moved on and the website hasn’t. A visitor can’t tell in a few seconds what you offer, who it is for and how to start.",
      },
      {
        title: "The right people aren’t getting in touch",
        body: "The site attracts visitors, but the enquiry route is hard to find, the message is unclear or the questions people need answered are missing.",
      },
      {
        title: "Every change needs a developer",
        body: "Editing a page, adding a service or publishing news means waiting on someone else, so it doesn’t happen.",
      },
    ],
    deliver: [
      {
        title: "Design with a point of view",
        body: "Layout, type and interaction developed around your business. Enough character to be remembered, with a clear path through each page.",
      },
      {
        title: "A careful build for small screens",
        body: "We design for phones from the start, size the images properly and test the pages on a slow connection.",
      },
      {
        title: "Search foundations built in",
        body: "A clear page structure, considered titles and descriptions, structured data and a sitemap. We set up search tools and check the move from your current site.",
      },
      {
        title: "Content your team edits itself",
        body: "Change text, add pages and publish updates without a developer, in an editor set up around your content.",
      },
      {
        title: "Accessible by design",
        body: "Readable type, checked contrast, keyboard navigation and labelled forms. We test these as part of the build.",
      },
      {
        title: "Enquiries that reach you",
        body: "Contact forms and booking routes connected to the right inbox or system, with confirmation for the customer and a tested handover to you.",
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
        body: "We map old addresses, set up redirects and check the pages, forms and search settings before the site goes live.",
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
      { title: "What it connects to", body: "Booking, payments, customer records or a newsletter each need their own design and testing." },
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
        a: "We can’t promise that rankings will stay the same. We map old addresses to the right new pages, keep useful content and check the search setup at launch. Your scope includes the migration work your site needs.",
      },
      {
        q: "How long does it take?",
        a: "Most websites go live in about fourteen days from the agreed scope. Larger sites take longer; your quote gives the date, and that is the date we work to.",
      },
      {
        q: "Can we update the site ourselves?",
        a: "Yes. The site comes with an editor set up around your content, and a short session to show your team how it works. Words, photos and new pages from the existing layouts need no developer.",
      },
      {
        q: "Who hosts it?",
        a: "We set the hosting up in your name and can look after it for you. The account is yours, so the site can move whenever you want it to.",
      },
    ],
    work: ["butter-days", "blackridge", "outbound", "practice-website"],
    includes: [
      {
        group: "Plan and words",
        items: [
          "A plan of every page, built around your customers’ questions",
          "Copy written with you, or your own words edited",
          "The words your customers search with, worked into the pages",
          "A map of old addresses and the redirects they need",
        ],
      },
      {
        group: "Design",
        items: [
          "A look made for your business: type, colour and layout",
          "Every page designed for a phone first",
          "A clickable prototype with your real words in it",
          "A small set of parts, so new pages match the old",
        ],
      },
      {
        group: "Build",
        items: [
          "Clean, fast code, in your name",
          "An editor your team can use without us",
          "Forms, booking or payments that reach the right place",
          "Analytics and search tools set up and connected",
        ],
      },
      {
        group: "Checked before launch",
        items: [
          "Tried on real phones, tablets and computers",
          "Keyboard use, contrast, labels and screen-reader structure checked",
          "Speed tested on a slow phone connection",
          "Every link, form and redirect tried by hand",
        ],
      },
      {
        group: "Launch and handover",
        items: [
          "Domain, hosting and every account in your name",
          "Old addresses redirected and search engines told",
          "A short training session for your team",
          "Plain notes on how it all works",
        ],
      },
    ],
    runs: {
      title: "From first call to live.",
      lede: "About fourteen days is a typical programme for a focused website, once the scope and content are ready. Your quote sets the dates for your project.",
      steps: [
        { when: "Days 1–2", title: "Discover", body: "A call and the free audit: what you have, and what your customers need from it." },
        { when: "By day 3", title: "Define", body: "The written scope, the fixed price and the launch date. Nothing is built until you sign it." },
        { when: "From day 3", title: "Design", body: "The page plan, the words and a clickable prototype. You approve it before it is built." },
        { when: "To day 11", title: "Build", body: "The real site on a review link: built, connected, tested and checked." },
        { when: "Day 14", title: "Launch", body: "Live, in your name, with old addresses redirected. Then looked after as long as you want." },
      ],
    },
    built: [
      {
        title: "Tools chosen for the job",
        body: "A five-page brochure, a site with hundreds of articles and a site that takes bookings need different tools. We choose them in the scope and tell you why.",
      },
      {
        title: "Code any good developer can pick up",
        body: "We use well-documented tools and hand over the code with plain notes. Another capable team can pick up the work.",
      },
      {
        title: "Light by default",
        body: "Images sized for the screen and scripts added when they do a useful job. We check performance on the finished pages.",
      },
    ],
    care: [
      "Updates and security fixes, applied and checked",
      "Site and form checks, with an agreed response when something fails",
      "Changes when you need them, quoted before we start",
      "A regular look at what visitors do, and what to improve next",
    ],
  },
  {
    slug: "platforms",
    n: "02",
    name: "Platforms",
    h1: ["Your everyday work,", "better organised."],
    line: "Client portals and internal tools that give the work a clear place to happen.",
    lede: "We build client portals and internal tools around the way your business runs. Give clients a place to check progress. Give your team a clear view of the work, connected to the software they already use.",
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
        body: "Progress, documents and approvals live with your team. Clients need to call or email to find out what is happening.",
      },
      {
        title: "Off-the-shelf software almost fits",
        body: "Your team has settled into workarounds because the system doesn’t match an important part of the job.",
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
        body: "Connections to your accounting, customer records, calendar or email, with clear rules for where each record lives and how it is shared.",
      },
      {
        title: "Roles and permissions",
        body: "Everyone sees what they need and nothing more: staff, clients, contractors and administrators.",
      },
      {
        title: "A handover your team can use",
        body: "Training on the real tasks, clear notes and an agreed support plan. Your team knows how to run it and where to get help.",
      },
    ],
    approach: [
      {
        title: "Map the work first",
        body: "We follow a job, booking or client from start to finish and write down every step, system and handover.",
      },
      {
        title: "Build the smallest useful version",
        body: "Choose a useful first release, test it with the team and add the next part when the need is clear.",
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
      { title: "What it connects to", body: "Accounting, customer records, calendar and payment connections each need mapping and testing." },
      { title: "What moves in", body: "Clients, jobs and records brought over from spreadsheets or an old system." },
    ],
    faq: [
      {
        q: "Why not just use an off-the-shelf tool?",
        a: "Often you should, and we will say so. Custom work makes sense when the part a tool doesn’t fit is the part that makes your business different, or when several tools need to act as one.",
      },
      {
        q: "Can it connect to our accounting software?",
        a: "We check your software’s supported connections during scoping. You’ll know what can be shared, how often it updates and any limits before you commit.",
      },
      {
        q: "Who owns the platform and the data?",
        a: "You do: the code, the data and the accounts it runs on. If you ever move to another team, everything moves with you.",
      },
      {
        q: "Can we start small?",
        a: "Yes. We define a first release around one useful piece of work, then test it with the people using it. Later releases are scoped and priced separately.",
      },
      {
        q: "How is client information kept safe?",
        a: "We define access for each role, protect sign-in and agree the backup and record-keeping plan. Before the build, we document what personal information the platform holds and how it will be handled.",
      },
      {
        q: "What happens to our spreadsheets?",
        a: "Their data is brought across into the platform as part of the scope and checked with you. The old files stay with you as a backup.",
      },
    ],
    work: ["operations-portal"],
    includes: [
      {
        group: "Mapping the work",
        items: [
          "Every step of a job, booking or client, written down",
          "Who does what, and what each person needs to see",
          "The systems involved, and what passes between them",
        ],
      },
      {
        group: "The platform",
        items: [
          "Screens for your team, built around their day",
          "A portal for your clients, if you need one",
          "Bookings, quotes, approvals and payments, on your rules",
          "Search, filters and reports on your own data",
        ],
      },
      {
        group: "Connections",
        items: [
          "Supported connections to your accounting, customer records, calendar or email",
          "Each piece of data entered once, then shared where it is needed",
          "Your spreadsheets or old system brought across, and checked with you",
        ],
      },
      {
        group: "Security",
        items: [
          "Accounts and permissions for every role",
          "Protected sign-in, with two-step verification where it matters",
          "Backups, and a record of who changed what",
          "Hosting and data in your name",
        ],
      },
      {
        group: "Delivery",
        items: [
          "A practice copy to try changes before they go live",
          "Released in stages, the most useful part first",
          "Training for your team, and plain notes on how it works",
        ],
      },
    ],
    runs: {
      title: "In stages, the useful part first.",
      lede: "We agree a useful first release and build from there. Each stage has its own scope, price and review, so you can decide what should come next.",
      steps: [
        { when: "First", title: "Map", body: "We follow the work from start to finish with the people who do it, and write down every step and system." },
        { when: "Then", title: "Scope", body: "The first release defined: what it does, who uses it, what it connects to, the price and the date." },
        { when: "First release", title: "Build and launch", body: "The part that removes the most friction, live for real users, with training." },
        { when: "In stages", title: "Grow", body: "The rest, release by release, each one quoted and dated before it starts." },
        { when: "Ongoing", title: "Look after", body: "Monitoring, updates and changes as the business changes." },
      ],
    },
    built: [
      {
        title: "Built on tools that last",
        body: "Well-documented technology, with the choice explained in your scope and the code handed over to you.",
      },
      {
        title: "Your data, where you can reach it",
        body: "Hosted in your name, backed up, and exportable whenever you want it. Nothing is held in a system only we can open.",
      },
      {
        title: "Connected properly",
        body: "Supported connections, documented field mappings and checks for failed updates. We make the handovers between systems visible.",
      },
    ],
    care: [
      "Security updates and monitoring",
      "Backups taken and restoration checked",
      "New features as the business changes, quoted before we start",
      "Help for your team when they need it",
    ],
  },
  {
    slug: "ai-automation",
    n: "03",
    name: "AI automation",
    h1: ["Less repetitive work.", "More room to think."],
    line: "Assistants and automations for repeat tasks, with clear limits and human review.",
    lede: "We build assistants and automations for the tasks your team keeps repeating. They read enquiries, prepare replies or move records between tools, within limits you approve. We trial them on your own work before they touch a live process.",
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
        body: "An assistant using your approved information to answer questions, gather details and help with bookings, with a clear route to your team.",
      },
      {
        title: "Inbox, document and data work",
        body: "Incoming email sorted and summarised, details read from forms and PDFs, records updated in the systems you use.",
      },
      {
        title: "Work inside your existing tools",
        body: "Automations connected to email, shared drives and customer records, so the output reaches the people and systems that need it.",
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
        body: "Approval steps, clear handovers and logs, so the automation supports your team instead of surprising them.",
      },
      {
        title: "Protect the data",
        body: "We agree what the system may read, where that information is processed and how long it is kept before the trial starts.",
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
      { title: "How much it processes", body: "We estimate service fees from your expected volumes and show the assumptions in the quote." },
    ],
    faq: [
      {
        q: "Is it safe to put AI in front of customers?",
        a: "It depends on the task and the cost of a wrong answer. We test common and difficult questions, restrict what the assistant can do and give customers a clear route to a person. Some tasks should stay with your team.",
      },
      {
        q: "What does it cost to run?",
        a: "The quote separates the build from ongoing service fees. We estimate those fees from your expected workload and agree limits and alerts before launch.",
      },
      {
        q: "Will it replace our staff?",
        a: "That is not the aim. It takes the repetitive part of the work, so your people spend their time where judgement and relationships matter.",
      },
      {
        q: "What happens when it gets something wrong?",
        a: "Human review can miss mistakes too. We keep a record of the work, limit the actions it can take and agree how to pause it. When an error appears, we investigate the cause and test the change before restarting that task.",
      },
      {
        q: "Where does our data go?",
        a: "We document the services involved, where they process information and what they retain before the trial. We check the chosen account settings and terms with you, including whether the information can be used for training.",
      },
      {
        q: "Do we need a lot of data to start?",
        a: "No. Real examples of the work, enough to cover its common cases, are enough to trial it. We tell you what to gather.",
      },
    ],
    work: ["enquiry-desk"],
    includes: [
      {
        group: "Choosing the work",
        items: [
          "The tasks worth automating, and the ones that aren’t",
          "The rules your team follows, written down",
          "The points where a person must decide, marked clearly",
        ],
      },
      {
        group: "The automation",
        items: [
          "Emails, forms and documents read and sorted",
          "Replies drafted in your approved wording",
          "Your customer records, calendar or job system updated",
          "An assistant on your website that answers from your own information",
        ],
      },
      {
        group: "Control",
        items: [
          "An approval step wherever it matters",
          "A record of every step it takes",
          "Limits on what it can read, change and send",
          "A clear handover to a person for anything uncertain",
        ],
      },
      {
        group: "Testing",
        items: [
          "A trial on your own past examples before anything goes live",
          "The results reviewed with you, one by one",
          "Checked again after launch, and whenever the model changes",
        ],
      },
      {
        group: "Privacy and cost",
        items: [
          "What it may see, where it runs and what it keeps, agreed in writing",
          "The chosen providers, account settings and retention terms documented",
          "Running costs estimated from your volumes, with limits and alerts",
        ],
      },
    ],
    runs: {
      title: "Tried on your own work first.",
      lede: "We start with one task and a trial using your own examples. The results decide what goes live, what needs review and what should stay with a person.",
      steps: [
        { when: "First", title: "Choose", body: "One task that is frequent, follows rules and can be checked." },
        { when: "Then", title: "Trial", body: "It runs on your past examples, and we review every result with you before anything is live." },
        { when: "Live", title: "Approve", body: "It works on real enquiries, and a person approves what goes out." },
        { when: "After review", title: "Extend", body: "Review the results before changing permissions or adding another task." },
        { when: "Ongoing", title: "Look after", body: "Checked, tuned and updated as your business and the models change." },
      ],
    },
    built: [
      {
        title: "The right model for the task",
        body: "We compare accuracy, data handling and cost using your examples. Model choices and account settings are recorded in the scope.",
      },
      {
        title: "Inside the tools you already use",
        body: "We connect the automation to the systems your team uses and make its output easy to review. Any new screen has a clear purpose.",
      },
      {
        title: "Every step on the record",
        body: "Inputs, outputs and actions recorded to support review and investigation, with a retention period agreed before launch.",
      },
    ],
    care: [
      "Its results checked regularly against real work",
      "Updated when the models or your rules change",
      "Running costs watched, with alerts",
      "New tasks added when you’re ready",
    ],
  },
];

export const service = (slug: string) => SERVICES.find((s) => s.slug === slug);
