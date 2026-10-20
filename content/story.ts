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
  line: "Follow one customer from the first search to the finished job and beyond. Then watch the same evening go another way.",
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
  /** Which way of working is on screen. */
  machine: "old" | "new" | "none";
};

export const CHAPTERS: StoryChapter[] = [
  {
    id: "open",
    name: "One customer",
    kicker: "Prologue",
    title: "Someone chose you.",
    line: "Sam needs a new deck. Out of every business in town, they’re looking at yours.",
    beat: "Every lit window is someone who might need you. Stay with Sam.",
    scene:
      "A small town at dusk, built like an architect’s model: white houses, dark roofs, streetlights coming on. The camera comes down to one lit living room. On the sofa sits Sam, a plain white figure, lit by a phone. Outside the open doors is an old deck, grey, with a board missing. Sam searches for deck builders and taps your business.",
    machine: "old",
  },
  {
    id: "website",
    name: "Your website",
    kicker: "01 Your website",
    title: "They tap. The page takes its time.",
    line: "On a phone, every second of loading is a chance to give up.",
    fact: { text: "Google’s 2016 global data put likely abandonment at 53% when a mobile page took over three seconds.", source: "google" },
    beat: "Sam waits it out. Most people don’t.",
    scene:
      "The phone’s screen lifts into the air beside Sam: a blank page, a spinner, a timer counting the seconds. Above the town, a hundred other phones are loading the same page. Past three seconds, more than half of them tip over and go dark. Sam waits. The page arrives, a pop-up gets in the way, and a small contact link sits at the very bottom. Sam fills in a long form and presses submit.",
    machine: "old",
  },
  {
    id: "inbox",
    name: "Your inbox",
    kicker: "02 Your inbox",
    title: "7:40pm. Sent. Then nothing.",
    line: "Sam’s message lands in your inbox. All night, more mail piles up on top of it.",
    beat: "Sam waited all night. Others went elsewhere.",
    scene:
      "The form folds into an envelope of light and flies across the dark town to your workshop. It becomes the first strip of an inbox that grows into a pile in the air: suppliers, the bank, newsletters, and other people asking for quotes. As the clock runs through the night, some of those customers give up and their emails slide off the pile. At 9:13am you arrive, find Sam’s message at the bottom and reply.",
    machine: "old",
  },
  {
    id: "admin",
    name: "Your admin",
    kicker: "03 Your admin",
    title: "Then you type it all again.",
    line: "Into the spreadsheet. Into the quote. Into the invoice. The same details, three times, by hand.",
    beat: "The job’s done. Paid in full.",
    scene:
      "At your desk, behind your shoulder, three cards lift off the laptop one after another: a spreadsheet, a quote typed at night, an invoice. Each holds the same name, email and job, typed out again. In the spreadsheet, other jobs go cold: a quote that was never sent, an email address with a typo. Sam says yes, the deck gets built, and you stamp the invoice paid.",
    machine: "old",
  },
  {
    id: "followup",
    name: "Your follow-up",
    kicker: "04 Your follow-up",
    title: "Paid. Then nothing.",
    line: "No thank-you. No check-in. A year later Sam needs you again and can’t remember your name.",
    beat: "They’d have come back. Nobody asked.",
    scene:
      "The camera crosses the town to Sam’s garden as the last boards of the new deck drop into place. Sam steps out onto it. Then a year passes in a few seconds: the sun circles, the timber turns grey. Sam searches for someone to oil the deck, taps the first result, and another company’s van pulls up outside.",
    machine: "old",
  },
  {
    id: "you",
    name: "You",
    kicker: "05 You",
    title: "11:47pm. Still typing.",
    line: "Every enquiry, quote and invoice still goes through you, by hand, after hours.",
    beat: "Tomorrow, the same again.",
    scene:
      "Night again. Through the workshop window you sit at the desk under a lamp, typing, with cards crowding the air around you: quotes to write, an overdue invoice, a call to return. The camera pulls back over the sleeping town until yours is the only lit window, the inbox pile still standing beside it.",
    machine: "old",
  },
  {
    id: "turn",
    name: "The turn",
    title: "Take your hands off the keyboard.",
    beat: "Same customer. Same evening. A different route.",
    scene:
      "Your hands stop and lift off the keys. Silence. The jobs round the desk hold still, then burn away from their edges, and the room goes dark. When the picture comes back it is high over the sleeping town, and the night runs backward: the clock turns back to 7:37pm and the town lights up at dusk.",
    machine: "none",
  },
  {
    id: "new-website",
    name: "Website",
    kicker: "Website",
    title: "This time, the page is ready.",
    line: "Fast on a phone, with one clear button: Get a free quote. Three questions and it’s sent.",
    scene:
      "The same evening, from above. A hundred phones over the town load your new page, and almost every one stays lit. Then the picture divides down the middle like a page: on one side Sam on the sofa, on the other your office, empty, its lamp off. Sam answers three short questions on a page that was there at once, adds a photo of the old deck and sends it.",
    machine: "new",
  },
  {
    id: "new-ai",
    name: "AI automation",
    kicker: "AI automation",
    title: "This time, they hear back in a minute.",
    line: "An assistant replies at 7:41pm, asks what you’d ask and offers times to measure up. Anything it can’t answer, it passes to you.",
    scene:
      "In the empty office the laptop wakes. Sam’s enquiry comes in and a reply writes itself: thanks for getting in touch, and three times for a free measure-up. It goes at 7:41pm, and on the other side Sam’s phone lights up with it. Sam taps Wednesday at 2pm and the booking appears in your week. At 3am a window lights up next door: Aroha asks whether a deck needs council consent. The reply goes, and the question it can’t answer is kept for you.",
    machine: "new",
  },
  {
    id: "new-platform",
    name: "Platform",
    kicker: "Platform",
    title: "Typed once. Used everywhere.",
    line: "The enquiry fills in the booking, the quote and the invoice. Sam accepts and pays from their phone.",
    scene:
      "Morning. You come in, the question is waiting, and you answer it. Sam’s quote is already filled in from the enquiry, so you add the price and send it, and Sam, out on the old deck, accepts it on the phone. A week later the new deck goes in, board by board. The invoice is made from the quote and goes on its own, and Sam pays it online, standing on the new deck.",
    machine: "new",
  },
  {
    id: "new-followup",
    name: "Follow-up",
    kicker: "Follow-up",
    title: "The end becomes a way back.",
    line: "A thank-you, a review, and a reminder a year on when the deck needs oiling. Sam books again.",
    scene:
      "Two days after the job, a thank-you goes to Sam with a question: how did it go? Five stars come back. A year passes in both pictures at once, the garden turning through its seasons. Then a reminder goes on its own: it’s been a year, time for an oil. Sam books, and on the Saturday you come out onto the deck and the grey goes out of it.",
    machine: "new",
  },
  {
    id: "new-you",
    name: "You",
    kicker: "You",
    title: "6pm. Laptop closed.",
    line: "The work keeps moving without you at the keyboard. You go home.",
    scene:
      "Six o’clock a year on, and golden light in the office. The laptop shows the day: enquiries answered, measure-ups booked, quotes accepted, invoices paid, nothing waiting on you. You close the laptop, switch off the lamp and drive home, while Sam is out on the deck in the evening. Then the two pictures come back together as one: the town at dusk, with both places in it.",
    machine: "new",
  },
  {
    id: "end",
    name: "Find your leaks",
    title: "Find your leaks.",
    line: "Free audit in two days.",
    scene:
      "The camera rises over the town in the evening light, until the picture settles to warm paper white.",
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
  lost: "Customers lost in this film",
  kept: "Customers kept",
  note: "Illustrative film counters",
  leaks: {
    website: "At the website",
    inbox: "In the inbox",
    admin: "In the admin",
    followup: "After the job",
  },
  yours: "Yours",
  drop: "Send an enquiry",
  dropShort: "Send one",
};

export type PartId = "phone" | "inbox" | "owner" | "admin" | "deck" | "van" | "site" | "reply" | "booking" | "quote" | "invoice" | "followup";

/** Hover a part of the picture: what it really is in your business. */
export const PARTS: Record<PartId, { name: string; line: string }> = {
  phone: { name: "Sam’s phone", line: "Where most of your customers meet your business first." },
  inbox: { name: "Your inbox", line: "Every enquiry waits here until someone gets to it." },
  owner: { name: "You", line: "The one person every job passes through, by hand." },
  admin: { name: "Your admin", line: "The same details typed into the spreadsheet, the quote and the invoice." },
  deck: { name: "The job", line: "The work you’re good at. The admin shouldn’t stand in its way." },
  van: { name: "The next visit", line: "Whoever the customer calls when they need help again." },
  site: { name: "Your new website", line: "Fast on a phone, with one clear next step." },
  reply: { name: "AI automation", line: "First replies in a minute, any hour. Questions it can’t answer go to you." },
  booking: { name: "Online booking", line: "The customer picks a time that suits you both." },
  quote: { name: "Quotes", line: "Filled in from the enquiry. You check the price and send." },
  invoice: { name: "Invoices", line: "Made from the quote and paid online." },
  followup: { name: "Follow-up", line: "A thank-you, a review and a reminder when it’s time again." },
};

/** The transcript's opening, and the controls' words. */
export const TRANSCRIPT = {
  title: "The story, in words",
  intro: "A customer called Sam finds a slow website, sends an enquiry that waits all night, and has their details typed out three times. The job gets done and paid, then nothing, and the owner is still at the desk at 11:47pm. Then the same evening plays again, another way.",
  note: "The business, its customers, timings and outcomes are illustrative. The counters describe this film. The cited finding comes from Google’s global research in 2016; it does not measure your website or predict your results.",
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
