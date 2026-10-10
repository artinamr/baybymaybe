/**
 * THE STORY'S WORDS (/story/, docs/STORY.md): the film's type, the hover
 * labels, the counters and the transcript under the film all read this one
 * file. Plain New Zealand English, second person, no em dashes, nothing
 * invented: the only facts are the two below, cited on screen and in the
 * transcript (docs/BLOG-GUIDE.md applies).
 */

export type SourceId = "google" | "hbr";

/** The two facts the film uses, and where they come from. */
export const SOURCES: Record<
  SourceId,
  { short: string; title: string; publisher: string; authors: string; date: string; url: string; checked: string }
> = {
  google: {
    short: "Google, The need for mobile speed, 2016",
    title: "The need for mobile speed",
    publisher: "Google",
    authors: "Alex Shellhammer and Juliette Neel",
    date: "8 September 2016",
    url: "https://blog.google/products/admanager/the-need-for-mobile-speed/",
    checked: "10 October 2026",
  },
  hbr: {
    short: "Harvard Business Review, The Short Life of Online Sales Leads, 2011",
    title: "The Short Life of Online Sales Leads",
    publisher: "Harvard Business Review",
    authors: "James B. Oldroyd, Kristina McElheran and David Elkington",
    date: "March 2011",
    url: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    checked: "10 October 2026",
  },
};

export const STORY_TITLE = "The quiet leak";

/** The door: what the film is, and how to watch it. */
export const DOOR = {
  kicker: "A short film by Nerodyn",
  title: STORY_TITLE,
  line: "Four minutes on the customers you lose without ever seeing them go.",
  sound: "Start with sound",
  silent: "Start in silence",
  how: "Scroll, drag or use the arrow keys. Or press play and sit back.",
  read: "Rather read it?",
  loading: "Getting the film ready",
};

export type ChapterId =
  | "open"
  | "website"
  | "inbox"
  | "admin"
  | "followup"
  | "you"
  | "turn"
  | "new-website"
  | "new-ai"
  | "new-platform"
  | "new-followup"
  | "new-you"
  | "end";

export type StoryChapter = {
  id: ChapterId;
  /** The progress bar's name for it. */
  name: string;
  /** The small line over the title ("01 Your website"). */
  kicker?: string;
  /** The line that lands. */
  title: string;
  /** One plain line under it. */
  line?: string;
  /** A cited fact, when the chapter has one. */
  fact?: { text: string; source: SourceId };
  /** The closing beat, as the picture makes its point. */
  beat?: string;
  /** What the picture shows, for the transcript (and anyone listening to it). */
  scene: string;
  /** Which machine is on screen. */
  machine: "old" | "new" | "none";
};

export const CHAPTERS: StoryChapter[] = [
  {
    id: "open",
    name: "Your business",
    title: "This is your business.",
    line: "Built up over years. A part here, a patch there. It works, mostly.",
    beat: "Every light is a customer, someone who wants what you sell. Follow one.",
    scene:
      "A machine the size of a cathedral stands in the dark, an iron tower in a nave of pointed arches. Warm lights roll out of a door at the top and down its tracks.",
    machine: "old",
  },
  {
    id: "website",
    name: "Your website",
    kicker: "01 Your website",
    title: "They found you. Now they wait.",
    line: "Your site is slow on their phone, and it isn’t clear what to do next.",
    fact: { text: "53% of mobile visits are likely to be abandoned if a page takes longer than 3 seconds to load.", source: "google" },
    beat: "More than half of them never get in.",
    scene:
      "Amber dusk. The lights queue at an iron gate that rises slowly while a gauge above it creeps past 3 seconds. More than half give up and drop into the dark. Ours waits, and gets through.",
    machine: "old",
  },
  {
    id: "inbox",
    name: "Your inbox",
    kicker: "02 Your inbox",
    title: "You’ll get back to them tomorrow.",
    line: "They filled in your form at 7:40pm. It landed in an inbox nobody checks until morning.",
    fact: { text: "Firms that answered within an hour were nearly seven times as likely to qualify the lead.", source: "hbr" },
    beat: "By morning, they’ve asked someone else.",
    scene:
      "Midnight blue. The lights pour into a wide dish and sit. Above it a great wheel turns from evening through the night to morning. The longer they wait, the dimmer they get, and some roll over the rim.",
    machine: "old",
  },
  {
    id: "admin",
    name: "Your admin",
    kicker: "03 Your admin",
    title: "Then someone types it all again.",
    line: "Into the spreadsheet, then the quote, then the invoice. Every copy is a chance to drop something.",
    beat: "Some never make it across.",
    scene:
      "Flickering green light. Old claws lift the lights from tray to tray, stencilled spreadsheet, quote and invoice, to the clatter of typewriters. Some slip from the claws and fall. Ours is stamped gold in the invoice tray: a sale.",
    machine: "old",
  },
  {
    id: "followup",
    name: "Your follow-up",
    kicker: "04 Your follow-up",
    title: "They paid. Then nothing.",
    line: "No thank-you. No check-in. No reminder when they’re due again.",
    beat: "So they never come back.",
    scene:
      "Blood red. The last track runs out over a drop and simply ends. The customer we followed rolls off the edge and falls into the pit with all the others.",
    machine: "old",
  },
  {
    id: "you",
    name: "You",
    kicker: "05 You",
    title: "And it all runs on you.",
    line: "It’s 11:47pm. You’re still answering emails and chasing invoices.",
    beat: "You never see them go.",
    scene:
      "The camera rises out of the pit and pulls back. Rivers of light fall from every level of the tower into a dim red lake far below. At its foot, under one desk lamp, a small figure turns a hand crank that keeps the whole machine going.",
    machine: "old",
  },
  {
    id: "turn",
    name: "The turn",
    title: "Stop patching it.",
    beat: "Build it to keep them.",
    scene:
      "Everything stops. Silence. Then the old machine tears itself apart: rust flakes off, gears tumble past in slow motion, and the tower falls away into the pit. A white flash, and a new machine assembles around us in glass and indigo light, each piece locking into place.",
    machine: "none",
  },
  {
    id: "new-website",
    name: "Website",
    kicker: "Website",
    title: "They find you. They’re straight in.",
    line: "A fast site, built for the phone in their hand, with one clear next step.",
    scene: "Where the gate was, a ring of light. Every customer passes straight through it, and it pulses as they go.",
    machine: "new",
  },
  {
    id: "new-ai",
    name: "AI automation",
    kicker: "AI automation",
    title: "Answered in seconds. Even at 3am.",
    line: "An assistant replies straight away, books the job, and passes anything tricky to a person.",
    scene:
      "Where the inbox was, a turbine of glass spins under the moon. Each light is caught and sent on the moment it arrives, still bright.",
    machine: "new",
  },
  {
    id: "new-platform",
    name: "Platform",
    kicker: "Platform",
    title: "Typed once. Used everywhere.",
    line: "Their details flow from the enquiry to the quote, the booking and the invoice. Nobody retypes a thing.",
    scene: "One glass channel carries each light through three glowing nodes, quote, booking and invoice, without a stop. Nothing falls.",
    machine: "new",
  },
  {
    id: "new-followup",
    name: "Follow-up",
    kicker: "Follow-up",
    title: "They paid. Then they came back.",
    line: "A thank-you, a check-in, a reminder when they’re due. The track loops back, and every lap brings more of them round.",
    scene: "The end of the track no longer ends. It curves up into a gold spiral round the tower and carries customers back to the top.",
    machine: "new",
  },
  {
    id: "new-you",
    name: "You",
    kicker: "You",
    title: "And you go home at six.",
    line: "It runs without you holding it together.",
    scene: "The whole tower glows. The hand crank is a flywheel now, turning on its own. At 6:00pm the desk lamp clicks off.",
    machine: "new",
  },
  {
    id: "end",
    name: "Find your leaks",
    title: "Find your leaks.",
    line: "Free audit in two days.",
    scene: "The light fills the frame and settles to warm paper white.",
    machine: "none",
  },
];

export const chapterById = (id: ChapterId) => CHAPTERS.find((c) => c.id === id)!;

/** The offer at the end. */
export const ENDING = {
  title: "Find your leaks.",
  line: "Free audit in two days.",
  body: "Send us your website. In two days you get a plain answer: where customers slip away, and what we would build instead.",
  cta: "Get your free audit",
  again: "Watch it again",
  watch: "Watch the film",
  back: "Back to the site",
};

/** The counters: the film's own customers, and it says so. */
export const COUNTER = {
  lost: "Lost while you watched",
  kept: "Kept while you watched",
  note: "Customers in this film",
  leaks: {
    website: "At the website",
    inbox: "In the inbox",
    admin: "In the admin",
    followup: "After the sale",
  },
  yours: "Yours",
  drop: "Drop a customer in",
  dropShort: "Drop one in",
};

export type PartId =
  | "door"
  | "gate"
  | "dish"
  | "wheel"
  | "admin"
  | "cliff"
  | "crank"
  | "pit"
  | "portal"
  | "turbine"
  | "channel"
  | "loop"
  | "flywheel";

/** Hover a part of the machine: what it really is in your business. */
export const PARTS: Record<PartId, { name: string; line: string }> = {
  door: { name: "The way in", line: "Search, ads and word of mouth: how people find you." },
  gate: { name: "Your website", line: "Slow on a phone, and unclear about what to do next." },
  dish: { name: "Your inbox", line: "Enquiries wait here until someone gets to them." },
  wheel: { name: "The hours", line: "Evening, night and morning go by while they wait." },
  admin: { name: "Your admin", line: "The same details copied into the spreadsheet, the quote and the invoice." },
  cliff: { name: "No follow-up", line: "After the sale, nothing brings them back." },
  crank: { name: "You", line: "Holding it all together, after hours." },
  pit: { name: "The ones you lost", line: "Every customer the machine dropped, at every stage." },
  portal: { name: "Your new website", line: "Fast on a phone, with one clear next step." },
  turbine: { name: "AI automation", line: "Every enquiry answered straight away, day or night, with a person for anything tricky." },
  channel: { name: "Your platform", line: "Details entered once and used everywhere: quote, booking, invoice." },
  loop: { name: "Follow-up", line: "Thank-yous, check-ins and reminders that run themselves." },
  flywheel: { name: "The system", line: "It keeps running without you holding it together." },
};

/** The transcript's opening, and the controls' words. */
export const TRANSCRIPT = {
  title: "The story, in words",
  intro: "Everything the film shows and says, for reading, for screen readers, and for anyone watching in silence.",
  sources: "Sources",
};

export const CONTROLS = {
  play: "Play",
  pause: "Pause",
  soundOn: "Sound on",
  soundOff: "Sound off",
  back: "Back to the site",
  skip: "Skip to the end",
  hint: "Scroll",
};
