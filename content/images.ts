/**
 * THE PHOTOGRAPHS — every photo on the site, with where it came from and its
 * licence, so the record travels with the files. All are CC0 1.0 (public
 * domain dedication): free to use for any purpose, no attribution required,
 * no watermarks. We credit the photographer anyway where a page lists its
 * sources (the blog). Before adding one, read docs/BLOG-GUIDE.md ("Images").
 *
 * Files live in public/<dir>/: the large size as <name>.webp and a half size
 * as <name>-<w>.webp. They are cropped and graded by the image tool (muted
 * colour, whites taken to the paper, blacks to the ink) so photos from
 * different photographers sit together on the page.
 */

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export type Credit = {
  /** The photo's title on its source page. */
  title: string;
  author: string;
  authorUrl: string;
  /** The page the licence was checked on (and the file downloaded from). */
  page: string;
  source: "StockSnap";
  licence: "CC0 1.0";
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
};

export const CC0_URL = "https://creativecommons.org/publicdomain/zero/1.0/";

const CHECKED = "2026-10-04";

/** A photo in public/<path>.webp (w × h) with its half size beside it. */
function photo(path: string, w: number, h: number, alt: string, credit: Omit<Credit, "source" | "licence" | "checked">): Photo {
  const half = Math.round(w / 2);
  return {
    src: `${BASE}/${path}.webp`,
    srcSet: `${BASE}/${path}-${half}.webp ${half}w, ${BASE}/${path}.webp ${w}w`,
    width: w,
    height: h,
    alt,
    credit: { ...credit, source: "StockSnap", licence: "CC0 1.0", checked: CHECKED },
  };
}

const cover = (slug: string, alt: string, credit: Omit<Credit, "source" | "licence" | "checked">) => photo(`blog/${slug}`, 2400, 1100, alt, credit);
const stage = (name: string, alt: string, credit: Omit<Credit, "source" | "licence" | "checked">) => photo(`method/${name}`, 1296, 1620, alt, credit);

export const PHOTOS = {
  // The blog's covers (24:11).
  "cover-redesign": cover("redesign-or-improve", "Seen from above: a laptop showing a website, a hand with a pen on the trackpad, an open notebook and a phone on a white desk.", {
    title: "Man Work",
    author: "Burst",
    authorUrl: "https://stocksnap.io/author/burstshopify",
    page: "https://stocksnap.io/photo/man-work-DZ7DC58DSV",
  }),
  "cover-quote": cover("website-quote-checklist", "A glass of water, a notepad and a pen on a dark table, striped with light through a window blind.", {
    title: "Notepad Pen",
    author: "Steve Johnson",
    authorUrl: "https://stocksnap.io/author/stevejohnson",
    page: "https://stocksnap.io/photo/notepad-pen-A4GPO5BBZD",
  }),
  "cover-portal": cover("when-you-need-a-client-portal", "A laptop and a phone on a dark desk; the phone shows a dashboard of figures and charts.", {
    title: "Computer Analytics",
    author: "Shotstash.com",
    authorUrl: "https://stocksnap.io/author/56839",
    page: "https://stocksnap.io/photo/computer-analytics-39LQYJSLI0",
  }),
  "cover-connect": cover("connect-website-crm-booking", "Two hands holding a tablet that shows a year’s calendar.", {
    title: "Ipad Tablet",
    author: "Marc Chouinard",
    authorUrl: "https://stocksnap.io/author/marc",
    page: "https://stocksnap.io/photo/ipad-tablet-4SGERWWL1U",
  }),
  "cover-ai": cover("ai-automation-workflows", "A laptop on a stand under a desk lamp in a dark room, a globe and books beside it.", {
    title: "Macbook Computer",
    author: "Burst",
    authorUrl: "https://stocksnap.io/author/burstshopify",
    page: "https://stocksnap.io/photo/macbook-computer-JPZDGEMDH3",
  }),
  "cover-ownership": cover("after-launch-ownership", "A set of keys hanging from the lock of an open door, a garden out of focus beyond it.", {
    title: "Keys Door",
    author: "WDnet Studio",
    authorUrl: "https://stocksnap.io/author/30770",
    page: "https://stocksnap.io/photo/keys-door-Z1TKDI29FZ",
  }),

  // The methodology: its banner (24:11) and the five stages (4:5).
  "method-hero": photo("method/hero", 2400, 1100, "The corner of a laptop, a pen and a sheet of handwritten notes on a desk.", {
    title: "Laptop Desk",
    author: "Matt Moloney",
    authorUrl: "https://stocksnap.io/author/mattmoloney",
    page: "https://stocksnap.io/photo/laptop-desk-2BJQISGWND",
  }),
  "method-discover": stage("discover", "A hand writing notes in an open planner with a silver pen.", {
    title: "Woman Writing",
    author: "JESHOOTS.com",
    authorUrl: "https://stocksnap.io/author/jeshootscom",
    page: "https://stocksnap.io/photo/woman-writing-FFSUL8TZD3",
  }),
  "method-define": stage("define", "A desk in afternoon light: a calculator, an open notebook with a pen, and a laptop.", {
    title: "Chair Notebook",
    author: "Oliver Klein",
    authorUrl: "https://stocksnap.io/author/34842",
    page: "https://stocksnap.io/photo/chair-notebook-7ZPSYLVQNC",
  }),
  "method-design": stage("design", "A hand drawing a website’s plan on a whiteboard: a dashboard branching into pages.", {
    title: "Whiteboard Web design",
    author: "Christina Morillo",
    authorUrl: "https://stocksnap.io/author/morillo",
    page: "https://stocksnap.io/photo/whiteboard-webdesign-NUEH6AWK1X",
  }),
  "method-build": stage("build", "A laptop showing code on a bright white desk, a phone resting on its keyboard.", {
    title: "Macbook Laptop",
    author: "Negative Space",
    authorUrl: "https://stocksnap.io/author/4440",
    page: "https://stocksnap.io/photo/macbook-laptop-7ULJ7GRFDB",
  }),
  "method-live": stage("live", "Two hands holding a phone over a white table.", {
    title: "Browsing Smartphone",
    author: "Kristin Hardwick",
    authorUrl: "https://stocksnap.io/author/kristinhardwick",
    page: "https://stocksnap.io/photo/browsing-smartphone-LNKN1UZWY3",
  }),

  // The services: banners (24:11) and their cards (4:5).
  "svc-websites": photo("services/websites-wide", 2400, 1100, "Pencil sketches of a website’s pages in an open notebook on a wooden desk.", {
    title: "Design Mockups",
    author: "Jeffrey Betts",
    authorUrl: "https://stocksnap.io/author/403",
    page: "https://stocksnap.io/photo/design-mockups-P6HXICOTZ5",
  }),
  "svc-websites-card": photo("services/websites", 1200, 1500, "Pencil sketches of a website’s pages in an open notebook.", {
    title: "Design Mockups",
    author: "Jeffrey Betts",
    authorUrl: "https://stocksnap.io/author/403",
    page: "https://stocksnap.io/photo/design-mockups-P6HXICOTZ5",
  }),
  "svc-platforms": photo("services/platforms-wide", 2400, 1100, "A laptop showing a dashboard of charts, a phone beside it, in soft daylight.", {
    title: "Analytics Charts",
    author: "Negative Space",
    authorUrl: "https://stocksnap.io/author/4440",
    page: "https://stocksnap.io/photo/analytics-charts-JVSII4KCCK",
  }),
  "svc-platforms-card": photo("services/platforms", 1200, 1500, "A laptop showing a dashboard of charts.", {
    title: "Analytics Charts",
    author: "Negative Space",
    authorUrl: "https://stocksnap.io/author/4440",
    page: "https://stocksnap.io/photo/analytics-charts-JVSII4KCCK",
  }),
  "svc-ai": photo("services/ai-automation-wide", 2400, 1100, "A laptop showing code in a quiet room, sunlight falling across the wall behind it.", {
    title: "Laptop Computer",
    author: "Émile Perron",
    authorUrl: "https://stocksnap.io/author/41229",
    page: "https://stocksnap.io/photo/laptop-computer-W0RUS6FWBJ",
  }),
  "svc-ai-card": photo("services/ai-automation", 1200, 1500, "Code on a laptop screen, sunlight falling across the wall behind it.", {
    title: "Laptop Computer",
    author: "Émile Perron",
    authorUrl: "https://stocksnap.io/author/41229",
    page: "https://stocksnap.io/photo/laptop-computer-W0RUS6FWBJ",
  }),
} satisfies Record<string, Photo>;

export type PhotoKey = keyof typeof PHOTOS;
