/**
 * THE STORY'S WORDS (/story/, docs/STORY.md): the film's type, the hover
 * labels, the counters and the transcript under the film all read this one
 * file. Plain New Zealand English, second person, no em dashes, nothing
 * invented about a real business. This is an illustrative story, with its
 * one research finding cited on screen and in the transcript.
 * docs/BLOG-GUIDE.md applies.
 */

export type SourceId = "google" | "hbr";

/** Source records. The transcript lists only sources cited by a chapter. */
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
    checked: "12 October 2026",
  },
  hbr: {
    short: "Harvard Business Review, The Short Life of Online Sales Leads, 2011",
    title: "The Short Life of Online Sales Leads",
    publisher: "Harvard Business Review",
    authors: "James B. Oldroyd, Kristina McElheran and David Elkington",
    date: "March 2011",
    url: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    checked: "12 October 2026",
  },
};

export const STORY_TITLE = "The quiet leak";

/** The door: what the film is, and how to watch it. */
export const DOOR = {
  kicker: "A short film by Nerodyn",
  title: STORY_TITLE,
  line: "Follow one customer through the gaps, then see a better route take shape.",
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
    name: "One customer",
    kicker: "Prologue",
    title: "Someone chose you.",
    line: "They need a job done. You have spent years building the business that can do it.",
    beat: "Every light is a person. Stay with this one.",
    scene:
      "An iron machine rises through a dark cathedral. Its tracks, trays and gears have accumulated around a central tower. Warm lights enter at the top. One burns brighter than the others. The camera moves close to it: this is the customer we will follow.",
    machine: "old",
  },
  {
    id: "website",
    name: "Your website",
    kicker: "01 Your website",
    title: "They arrive. The door stays shut.",
    line: "On their phone, a page loads slowly. They wait for a way to ask.",
    fact: { text: "Google’s 2016 global data put likely abandonment at 53% when a mobile page took over three seconds.", source: "google" },
    beat: "Our customer stays. Watch the others fall.",
    scene:
      "Amber light catches the teeth of a heavy iron gate. The customers queue while a loading gauge passes three seconds. Lights leave the track and fall through the machine. The one we follow waits until the gate opens, then slips underneath it.",
    machine: "old",
  },
  {
    id: "inbox",
    name: "Your inbox",
    kicker: "02 Your inbox",
    title: "They send a message. Then wait.",
    line: "7:40pm. The form says sent. Your inbox says nothing back.",
    beat: "The night moves. They’re still waiting.",
    scene:
      "The track empties into a broad inbox tray. A clock reads 7:40pm. The great wheel above it carries the sun out of sight and the moon across the room. The waiting lights dim. Some drift over the rim. Our customer is still there when morning reaches the tray.",
    machine: "old",
  },
  {
    id: "admin",
    name: "Your admin",
    kicker: "03 Your admin",
    title: "They told you once.",
    line: "You copy their details into a spreadsheet, a quote, an invoice. The person becomes a stack of entries.",
    beat: "Our customer makes it through. Others don’t.",
    scene:
      "Green lights flicker over three disconnected trays: spreadsheet, quote and invoice. Metal claws carry each customer across the gaps while typewriters strike. Some lights slip through the claws. The one we follow reaches the invoice tray and is stamped gold. The job is paid.",
    machine: "old",
  },
  {
    id: "followup",
    name: "Your follow-up",
    kicker: "04 Your follow-up",
    title: "The invoice is paid. The track ends.",
    line: "The job is done. Nothing in this machine remembers to ask how it went.",
    beat: "You watch them fall. You can’t reach them.",
    scene:
      "The camera follows our gold light along the last track. Red light rises from below. Ahead, the rail stops in open air. The customer rolls beyond it. For a moment the light hangs alone, then falls. The camera dives after it into the pit. The person we followed joins the lights lost from every floor.",
    machine: "old",
  },
  {
    id: "you",
    name: "You",
    kicker: "05 You",
    title: "11:47pm. Still turning.",
    line: "The last email. The unpaid invoice. Another night at the desk, making all these parts behave.",
    beat: "Tomorrow asks you to do it again.",
    scene:
      "The camera rises from the lost lights and pulls back until the whole tower is visible. Each floor leaks into the same red pit. At the foot of the machine, one small figure sits under a desk lamp. A clock reads 11:47pm. The figure turns a hand crank. The weight of the whole tower depends on that motion.",
    machine: "old",
  },
  {
    id: "turn",
    name: "The turn",
    title: "Take your hand off the crank.",
    beat: "Rebuild the route. Give the evening back.",
    scene:
      "The crank stops. The lights and gears hold still. Silence gives us time to see the machine as a whole. Then its joints open. Rust and iron fall away; great gears tumble past the camera into the dark. A white flash clears the frame. Glass channels and indigo rings assemble around the same route, each connection locking into the next.",
    machine: "none",
  },
  {
    id: "new-website",
    name: "Website",
    kicker: "Website",
    title: "This time, the door opens.",
    line: "The same customer. A clear page on their phone. A visible way to ask for the job.",
    scene: "We return to the top of the rebuilt machine and follow the same warm light. Where the iron gate stood, an open ring pulses as the customer passes through. There is no queue at the entrance.",
    machine: "new",
  },
  {
    id: "new-ai",
    name: "AI automation",
    kicker: "AI automation",
    title: "This time, they get a reply.",
    line: "The assistant handles the first questions. It gathers the job details and leaves the judgement with your team.",
    scene:
      "The moon crosses the same space where the inbox once waited. A glass turbine catches our customer and sends the light into the next channel. The light keeps its warmth. The route continues while the desk below is quiet.",
    machine: "new",
  },
  {
    id: "new-platform",
    name: "Platform",
    kicker: "Platform",
    title: "The person stays in the picture.",
    line: "Their details travel with the job. The quote becomes a booking, then an invoice, without another copy.",
    scene: "One continuous glass channel replaces the disconnected trays. Our customer passes through the quote, booking and invoice nodes. Each node lights in turn. No claw has to lift the customer across an open gap.",
    machine: "new",
  },
  {
    id: "new-followup",
    name: "Follow-up",
    kicker: "Follow-up",
    title: "The end becomes a way back.",
    line: "The job closes with a thank-you. A check-in follows. When they need you again, the way back is clear.",
    scene: "The camera chases the same gold light towards the place where the old rail ended. This time the track curves upward. The customer enters a gold spiral, climbs around the tower and returns to the first door. The fall has become a return.",
    machine: "new",
  },
  {
    id: "new-you",
    name: "You",
    kicker: "You",
    title: "6pm. The light goes out.",
    line: "The work has a route of its own. You finish for the day. The machine keeps turning.",
    scene: "The camera pulls back to the desk again. A flywheel turns where the hand crank used to be. The rebuilt tower carries the lights above it. At 6pm, the owner switches off the lamp. The small pool of light at the desk disappears; the light in the machine continues.",
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
  body: "Send us your website. Within two days, we’ll reply with the gaps we found and a clear order for fixing them.",
  cta: "Get your free audit",
  again: "Watch it again",
  watch: "Watch the film",
  back: "Back to the site",
};

/** The counters: the film's own customers, and it says so. */
export const COUNTER = {
  lost: "Lights lost in this run",
  kept: "Lights carried through",
  note: "Illustrative film counters",
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
  gate: { name: "Your website", line: "The first door. In this story, it keeps people waiting." },
  dish: { name: "Your inbox", line: "Enquiries wait here until someone gets to them." },
  wheel: { name: "The hours", line: "Evening, night and morning go by while they wait." },
  admin: { name: "Your admin", line: "The same details copied into the spreadsheet, the quote and the invoice." },
  cliff: { name: "No follow-up", line: "The job ends here. The relationship has no route back." },
  crank: { name: "You", line: "The owner’s evening keeps the old machine turning." },
  pit: { name: "The lost lights", line: "The people this film’s machine dropped along the way." },
  portal: { name: "Your new website", line: "Fast on a phone, with one clear next step." },
  turbine: { name: "AI automation", line: "First questions answered, job details gathered, judgement left with your team." },
  channel: { name: "Your platform", line: "Details entered once and used everywhere: quote, booking, invoice." },
  loop: { name: "Follow-up", line: "A thank-you and a check-in. A clear way to return when the customer needs you." },
  flywheel: { name: "The system", line: "Connected parts carry the work after the desk lamp goes out." },
};

/** The transcript's opening, and the controls' words. */
export const TRANSCRIPT = {
  title: "The story, in words",
  intro: "A customer arrives, an enquiry waits and the same details are copied between tools. The business takes another evening to keep running. Then the route changes.",
  note: "The business, timings and outcomes are illustrative. The lights and counters describe this film. The cited finding comes from Google’s global research in 2016; it does not measure your website or predict your results.",
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
