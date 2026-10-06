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

type CreditIn = Omit<Credit, "checked" | "licence"> & { licence?: Licence };

/** A photo in public/<path>.webp (w × h) with its half size beside it. */
function photo(path: string, w: number, h: number, alt: string, credit: CreditIn, position?: string): Photo {
  const half = Math.round(w / 2);
  return {
    src: `${BASE}/${path}.webp`,
    srcSet: `${BASE}/${path}-${half}.webp ${half}w, ${BASE}/${path}.webp ${w}w`,
    width: w,
    height: h,
    alt,
    credit: { licence: "CC0 1.0", ...credit, checked: CHECKED },
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

const LIGHTHOUSE = unsplash("California lighthouse", "DesignCue", "designcue", "California_lighthouse_(Unsplash).jpg", "11 June 2016");
const OCULUS = unsplash(
  "Commuters in terminal station",
  "Luca Bravo",
  "lucabravo",
  "Commuters_in_terminal_station_(Unsplash).jpg",
  "31 May 2017"
);
const LAPTOP = iso("Laptop Close up Computer", "Birch Landing Home", "birch-landing-home", "laptop-close-up-computer");
const CLEANROOM: CreditIn = {
  title: "Reinraum BBS Automation Blaichach",
  author: "Clemenspool",
  authorUrl: "https://commons.wikimedia.org/wiki/User:Clemenspool",
  page: "https://commons.wikimedia.org/wiki/File:Reinraum_BBS_Automation_Blaichach.jpg",
  source: "Wikimedia Commons",
};

export const PHOTOS = {
  // The blog's covers (24:11).
  "cover-redesign": cover("redesign-or-improve", "A building under construction, wrapped in scaffolding, with a crane’s jib crossing the blue sky above it.", iso("Construction Cranes", "U Leone", "u-leone", "construction-cranes-2")),
  "cover-quote": cover(
    "website-quote-checklist",
    "A hand ticking off a handwritten checklist in a squared notebook.",
    unsplash("Plan a lifetime adventure", "Glenn Carstens-Peters", "glenncarstenspeters", "Plan_a_lifetime_adventure_(Unsplash).jpg", "15 January 2017"),
    "72% 50%"
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
    "A brass and steel viewing telescope looking out over a hazy town.",
    iso("Telescope", "Michael Schwarzenberger", "michael-schwarzenberger", "telescope")
  ),
  "method-define": stage(
    "define",
    "A hand holding up a compass against wooded hills.",
    unsplash("Photograph of a compass being held upright", "Heidi Sandstrom", "sandstromfilm", "Photograph_of_a_compass_being_held_upright.jpg", "6 August 2016")
  ),
  "method-design": stage(
    "design",
    "Website wireframes sketched in blue pen across an open notebook on a wooden table.",
    iso("Notebook Wireframe Sketch", "Jeffrey Betts", "jeffrey-betts", "open-notebook-wireframe-sketch")
  ),
  "method-build": stage(
    "build",
    "A spiral staircase seen from above, its steps turning down into the centre.",
    unsplash("Infinite spiral stairs", "Ludde Lorentz", "luddelorentz", "Infinite_spiral_stairs_(Unsplash).jpg", "25 November 2015")
  ),
  "method-live": stage("live", "A white lighthouse on a rocky headland above the surf.", LIGHTHOUSE),

  // The services: banners (24:11) and their cards (4:5).
  "svc-websites": photo("services/websites-wide", 2400, 1100, "The keyboard and trackpad of an open laptop resting on a soft white blanket.", LAPTOP, "56% 50%"),
  "svc-websites-card": photo("services/websites", 1200, 1500, "An open laptop’s keyboard on a soft white blanket.", LAPTOP),
  "svc-platforms": photo("services/platforms-wide", 2400, 1100, "The white ribbed hall of a transport hub, people crossing its floor far below.", OCULUS),
  "svc-platforms-card": photo("services/platforms", 1200, 1500, "White ribs rising above the busy floor of a transport hub.", OCULUS),
  "svc-ai": photo(
    "services/ai-automation-wide",
    2400,
    1100,
    "A white industrial robot arm in a clean room, a technician in protective clothing checking a tablet beside it.",
    CLEANROOM,
    "62% 50%"
  ),
  "svc-ai-card": photo("services/ai-automation", 1200, 1500, "A white industrial robot arm in a clean room.", CLEANROOM),
} satisfies Record<string, Photo>;

export type PhotoKey = keyof typeof PHOTOS;
