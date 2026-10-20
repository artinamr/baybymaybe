/**
 * THE PHOTOGRAPHS — every photo on the site, with where it came from and its
 * licence, so the record travels with the files. Every one is free of
 * copyright restrictions: CC0 1.0 (a public domain dedication) or the Public
 * Domain Mark. Free to use for any purpose, no attribution required, no
 * watermarks. We credit the photographer anyway where a page lists its
 * sources (the blog). Before adding one, read docs/BLOG-GUIDE.md ("Images").
 *
 * Sources (round 20): ISO Republic (every photo CC0), Wikimedia Commons (files
 * whose licence record is CC0, including photographs first published on
 * Unsplash before 5 June 2017, while Unsplash used CC0: the upload date is in
 * the image address on Unsplash, and is recorded below as `via`) and Flickr
 * (Public Domain Mark only). Each photo's page was opened and its licence read
 * on the date in `checked`.
 *
 * Files live in public/<dir>/: the large size as <name>.webp and a half size
 * as <name>-<w>.webp, cropped, graded and sharpened by tools/qa/photos/
 * (mkimages.py: a little colour taken out, the full tonal range kept, the
 * whites leaning toward the paper) so photos from different photographers
 * sit together on the page.
 */

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export type Licence = "CC0 1.0" | "Public Domain Mark 1.0";

export const LICENCE_URL: Record<Licence, string> = {
  "CC0 1.0": "https://creativecommons.org/publicdomain/zero/1.0/",
  "Public Domain Mark 1.0": "https://creativecommons.org/publicdomain/mark/1.0/",
};

/** Kept for older imports: the CC0 deed. */
export const CC0_URL = LICENCE_URL["CC0 1.0"];

export type Credit = {
  /** The photo's title on its source page. */
  title: string;
  author: string;
  authorUrl: string;
  /** The page the licence was checked on (and the file downloaded from). */
  page: string;
  source: "ISO Republic" | "Wikimedia Commons" | "Flickr" | "StockSnap";
  licence: Licence;
  /** Where it was first published, when that is not `source` (shown in the article's credit line). */
  via?: string;
  /** The author is an organisation, not a person (structured data). */
  org?: boolean;
  /** ISO date the licence page was checked. */
  checked: string;
};

export type Photo = {
  src: string;
  /** The same picture at its sizes, for the browser to choose from. */
  srcSet: string;
  width: number;
  height: number;
  alt: string;
  credit: Credit;
  /** Where the subject sits (CSS object-position), so a narrower crop (a phone's banner, a card) keeps it. */
  position?: string;
};

const CHECKED = "2026-10-06";

type CreditIn = Omit<Credit, "checked" | "licence"> & { licence?: Licence; checked?: string };

/** A photo in public/<path>.webp (w × h) with its half size beside it. */
function photo(path: string, w: number, h: number, alt: string, credit: CreditIn, position?: string): Photo {
  const half = Math.round(w / 2);
  return {
    src: `${BASE}/${path}.webp`,
    srcSet: `${BASE}/${path}-${half}.webp ${half}w, ${BASE}/${path}.webp ${w}w`,
    width: w,
    height: h,
    alt,
    credit: { licence: "CC0 1.0", ...credit, checked: credit.checked ?? CHECKED },
    ...(position ? { position } : {}),
  };
}

const cover = (slug: string, alt: string, credit: CreditIn, position?: string) => photo(`blog/${slug}`, 2400, 1100, alt, credit, position);
const stage = (name: string, alt: string, credit: CreditIn) => photo(`method/${name}`, 1296, 1620, alt, credit);

/** A photograph first published on Unsplash (while it used CC0), as kept on Wikimedia Commons. */
const unsplash = (title: string, author: string, handle: string, file: string, published: string): CreditIn => ({
  title,
  author,
  authorUrl: `https://unsplash.com/@${handle}`,
  page: `https://commons.wikimedia.org/wiki/File:${file}`,
  source: "Wikimedia Commons",
  via: `first published on Unsplash on ${published} under CC0`,
});

const iso = (title: string, author: string, authorSlug: string, pageSlug: string): CreditIn => ({
  title,
  author,
  authorUrl: `https://isorepublic.com/media-author/${authorSlug}/`,
  page: `https://isorepublic.com/photo/${pageSlug}/`,
  source: "ISO Republic",
});

const FOLDERS: CreditIn = {
  ...unsplash("Folder stack", "Beatriz Pérez Moya", "beatriz_perez", "Folder_stack_(Unsplash).jpg", "17 July 2016"),
  checked: "2026-10-12",
};
const WEBSITE_DESK: CreditIn = { ...iso("Keyboard Desk", "Birch Landing Home", "birch-landing-home", "keyboard-desk"), checked: "2026-10-12" };
const MAIL: CreditIn = { ...iso("Envelope Invites", "Photo AC", "photo-ac", "envelope-invites"), checked: "2026-10-12", org: true };

export const PHOTOS = {
  // The blog's covers (24:11).
  "cover-redesign": cover("redesign-or-improve", "A building under construction, wrapped in scaffolding, with a crane’s jib crossing the blue sky above it.", iso("Construction Cranes", "U Leone", "u-leone", "construction-cranes-2")),
  "cover-quote": cover(
    "website-quote-checklist",
    "A blank checklist beside a white keyboard and mouse on a pale desk.",
    { ...iso("Computer Office Keyboard", "Lenharth Systems", "lenharth-systems", "computer-office-keyboard-keys"), checked: "2026-10-12", org: true },
    "68% 50%"
  ),
  "cover-portal": cover(
    "when-you-need-a-client-portal",
    "Six different letterboxes in a row on a wooden stand, against native bush at Muriwai, west of Auckland.",
    unsplash("Muriwai mailboxes", "Mathyas Kurmann", "mathyaskurmann", "Muriwai_mailboxes_(Unsplash).jpg", "16 June 2016")
  ),
  "cover-connect": cover(
    "connect-website-crm-booking",
    "A suspension bridge seen from below, crossing between two wooded hills in soft morning haze.",
    iso("City Suspension Bridge", "Bob Richards", "bob-richards", "city-suspension-bridge")
  ),
  "cover-ai": cover("ai-automation-workflows", "A white robotic arm lifting a blue component in a bright clean room.", {
    title: "Clean Room Robotic Arm Cavity Assembly",
    author: "Jefferson Lab",
    authorUrl: "https://www.flickr.com/photos/jeffersonlab/",
    page: "https://www.flickr.com/photos/53950384@N02/55153403055",
    source: "Flickr",
    licence: "Public Domain Mark 1.0",
    org: true,
  }),
  "cover-ownership": cover(
    "after-launch-ownership",
    "An open hand holding out a set of house keys, new homes out of focus behind it.",
    iso("House Keys", "Master Senaiper", "master-senaiper", "house-keys")
  ),
  "cover-seo": cover(
    "what-is-seo",
    "Rows of wooden library catalogue drawers with printed alphabetical index labels.",
    {
      ...unsplash("Boston Public Library, Boston, United States", "Sanwal Deen", "sanwaldeen", "Boston_Public_Library,_Boston,_United_States_(Unsplash).jpg", "17 May 2016"),
      checked: "2026-10-12",
    },
    "50% 50%"
  ),
  "cover-gbp": cover(
    "google-business-profile",
    "A green OPEN sign hanging on a dark wooden shop door.",
    {
      ...unsplash("Open", "Tim Mossholder", "timmossholder", "Open_(Unsplash).jpg", "13 December 2016"),
      checked: "2026-10-12",
    },
    "50% 52%"
  ),
  "cover-diy": cover(
    "diy-website-or-hire",
    "Hands sanding a new wooden board on a sawdust-covered workshop floor.",
    {
      ...unsplash("Woodworker in a workshop", "Ian Schneider", "goian", "Woodworker_in_a_workshop_(Unsplash).jpg", "12 May 2016"),
      checked: "2026-10-07",
    },
    "55% 50%"
  ),
  "cover-hacked": cover(
    "website-hacked",
    "Red network cables connected to a black patch panel, with empty ports beside them.",
    {
      title: "Server Network",
      author: "Chris Ciapala",
      authorUrl: "https://isorepublic.com/media-author/chris-ciapala/",
      page: "https://isorepublic.com/photo/server-network/",
      source: "ISO Republic",
      checked: "2026-10-12",
    },
    "50% 65%"
  ),
  "cover-chat": cover(
    "website-chat-assistant",
    "Matte black headphones with a red lead, resting on a plain white surface.",
    {
      title: "Headphones Headset",
      author: "Matthew Henry",
      authorUrl: "https://stocksnap.io/author/200",
      page: "https://stocksnap.io/photo/headphones-headset-NV7H1CLTC2",
      source: "StockSnap",
      checked: "2026-10-12",
    },
    "50% 55%"
  ),

  // The methodology: its banner (24:11) and the five stages (4:5).
  "method-hero": photo(
    "method/hero",
    2400,
    1100,
    "A white marble staircase curving up along a white stone wall.",
    unsplash("Curve in white marble stairs", "Daniel von Appen", "daniel_von_appen", "Curve_in_white_marble_stairs_(Unsplash).jpg", "3 June 2017"),
    "74% 50%"
  ),
  "method-discover": stage(
    "discover",
    "An open blank notebook and a black pen, ready for the first conversation.",
    { ...iso("Notebook Desk Above", "Artsy Crafty", "artsy-crafty", "notebook-desk-above"), checked: "2026-10-12" }
  ),
  "method-define": stage(
    "define",
    "Page structures sketched in a notebook, with blank orange tabs marking the sections.",
    { ...iso("Sketch Wireframe Notes", "Jeffrey Betts", "jeffrey-betts", "sketch-wireframe-notes-2"), checked: "2026-10-12" }
  ),
  "method-design": stage(
    "design",
    "Website wireframes sketched in blue pen across an open notebook on a wooden table.",
    iso("Notebook Wireframe Sketch", "Jeffrey Betts", "jeffrey-betts", "open-notebook-wireframe-sketch")
  ),
  "method-build": stage(
    "build",
    "A close view of black keyboard keys and their aluminium edges.",
    { ...iso("Laptop Keyboard Buttons", "One Idea LLC", "one-idea-llc", "laptop-keyboard-buttons"), checked: "2026-10-12", org: true }
  ),
  "method-live": stage("live", "A wireless mouse beside a closed silver laptop on a wooden desk.", { ...iso("Mouse Laptop and Desk", "50Fish", "50fish", "mouse-laptop-and-desk"), checked: "2026-10-12" }),

  // The services: banners (24:11) and their cards (4:5).
  "svc-websites": photo("services/websites-wide", 2400, 1100, "A white keyboard on a wooden work desk, photographed from above.", WEBSITE_DESK, "50% 42%"),
  "svc-websites-card": photo("services/websites", 1200, 1500, "White keyboard keys on a warm wooden desk.", WEBSITE_DESK),
  "svc-platforms": photo("services/platforms-wide", 2400, 1100, "A neatly organised stack of white folders, each holding a separate set of records.", FOLDERS, "76% 50%"),
  "svc-platforms-card": photo("services/platforms", 1200, 1500, "White folders stacked in an orderly row.", FOLDERS),
  "svc-ai": photo(
    "services/ai-automation-wide",
    2400,
    1100,
    "Blank coral, yellow and pale green envelopes arranged on a white surface.",
    MAIL,
    "50% 50%"
  ),
  "svc-ai-card": photo("services/ai-automation", 1200, 1500, "Overlapping blank envelopes in coral, yellow and pale green.", MAIL),

  // The studio: its banner (24:11), the place the team works from. Phones keep the island on the left.
  "studio-hero": photo(
    "studio/hero",
    2400,
    1100,
    "A purple sky with a band of pink light over the sea and a dark island on the horizon, seen from Mt Victoria in Auckland.",
    {
      ...unsplash("Mt Victoria, Auckland, New Zealand", "Kyle Myburgh", "kylemyburgh", "Mt_Victoria,_Auckland,_New_Zealand_(Unsplash).jpg", "8 June 2016"),
      checked: "2026-10-20",
    },
    "8% 50%"
  ),
} satisfies Record<string, Photo>;

export type PhotoKey = keyof typeof PHOTOS;
