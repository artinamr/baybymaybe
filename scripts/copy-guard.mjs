// THE COPY GUARD: runs after `next build` (npm run build, and so every deploy) and
// fails the build when the site's writing rules are broken. The rules are the
// client's and are written out in docs/BLOG-GUIDE.md:
//   - no em dashes anywhere a reader or a search engine sees (pages, attributes,
//     structured data, the feed, llms.txt, JSON), and no spaced en dashes doing their job;
//   - the blog (articles, the glossary, how we write): none of the stock phrases
//     that make writing sound machine-made, and UK/NZ spelling; articles also
//     need a sources list, a credit for the cover photograph, the short answer
//     and who it's for; the glossary its sources;
//   - every image has alt text, no id is used twice on a page, and every link
//     to a page of the site (and to a #section of it) lands somewhere real.
// Softer things (long titles and descriptions, words to use sparingly) are warnings.
// usage: node scripts/copy-guard.mjs [outDir=out]
import fs from "node:fs";
import path from "node:path";

const root = process.argv[2] || "out";
if (!fs.existsSync(root)) {
  console.error(`copy-guard: ${root}/ not found; build first.`);
  process.exit(1);
}

const failures = [];
const warnings = [];
const fail = (file, msg) => failures.push(`${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`${file}: ${msg}`);

// Phrases that mark writing as generated or padded. Never in an article.
const BANNED = [
  "delve", "tapestry", "testament to", "embark", "unleash", "game-changer", "game changer", "cutting-edge",
  "revolutionise", "revolutionize", "seamless", "synergy", "fast-paced world", "ever-evolving", "ever-changing landscape",
  "it's worth noting", "it’s worth noting", "it is worth noting", "it's important to note", "it’s important to note",
  "in conclusion", "unlock the power", "unlock the potential", "look no further", "elevate your", "supercharge",
  "next-level", "world-class", "state-of-the-art", "best-in-class", "in today's digital", "in today’s digital",
  "navigating the", "dive into", "deep dive", "a myriad of", "plethora", "harness the power",
];
// Words that are fine once in a while but read as filler when they pile up.
const SPARING = ["robust", "leverage", "crucial", "pivotal", "landscape", "journey", "empower", "streamline", "holistic", "comprehensive", "furthermore", "moreover", "additionally", "ensure"];
// American spellings that slip in. The blog is written in New Zealand English.
const US = [
  "organize", "organized", "organizing", "organization", "color", "colors", "center", "centers", "optimize", "optimized",
  "optimizing", "optimization", "analyze", "analyzed", "behavior", "behaviors", "favorite", "catalog", "traveling", "traveled",
  "canceled", "canceling", "labeled", "modeling", "fulfill", "enrollment", "defense", "gray", "realize", "realized",
  "recognize", "recognized", "prioritize", "prioritized", "customize", "customized", "minimize", "maximize", "summarize",
  "utilize", "authorize", "authorized", "apologize", "specialize", "specialized", "standardize", "license fee", "judgment",
];

const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) {
      if (f !== "_next") walk(p);
    } else if (/\.(html|xml|txt|json)$/.test(f) && !/^__next|^index\.txt$/.test(f)) files.push(p);
  }
})(root);

const textOf = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&rsquo;|&#x27;|&#39;/g, "’")
    .replace(/\s+/g, " ");

const context = (t, i) => t.slice(Math.max(0, i - 50), i + 50).replace(/\s+/g, " ").trim();

// Internal links: every href to a page of the site, and every #section on it.
const BASE = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
const idsCache = new Map();
const idsOf = (file) => {
  if (!idsCache.has(file)) idsCache.set(file, new Set([...fs.readFileSync(file, "utf8").matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  return idsCache.get(file);
};
const pageFile = (p) => {
  const clean = decodeURIComponent(p.replace(/[?#].*$/, ""));
  const cands = clean.endsWith("/") ? [`${clean}index.html`] : [clean, `${clean}.html`, `${clean}/index.html`];
  return cands.map((c) => path.join(root, c)).find((c) => fs.existsSync(c) && fs.statSync(c).isFile());
};

for (const f of files) {
  const rel = path.relative(root, f).replace(/\\/g, "/");
  let raw = fs.readFileSync(f, "utf8");
  // What a reader or a crawler sees: page text and attributes, structured data, feeds.
  let seen = raw;
  if (f.endsWith(".html")) {
    seen = raw.replace(/<script(?![^>]*application\/ld\+json)[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ");
  }
  seen = seen.replace(/&mdash;|&#8212;|&#x2014;/gi, "—").replace(/&ndash;|&#8211;|&#x2013;/gi, "–");
  for (const m of seen.matchAll(/—/g)) fail(rel, `em dash: “…${context(seen, m.index)}…”`);
  for (const m of seen.matchAll(/\s–\s/g)) fail(rel, `spaced en dash used as a dash: “…${context(seen, m.index)}…”`);

  if (!f.endsWith(".html")) continue;

  // Images: alt text on every one (alt="" is right for decoration).
  for (const m of raw.matchAll(/<img\b[^>]*>/g)) if (!/\salt=/.test(m[0])) fail(rel, `image without alt: ${m[0].slice(0, 90)}`);

  // Head: one title and description, within what search results show.
  const title = raw.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
  const desc = raw.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "";
  if (!/404|cookies/.test(rel)) {
    if (title.length > 68) warn(rel, `title is ${title.length} characters (search shows about 60): ${title}`);
    if (!desc) warn(rel, "no meta description");
    else if (desc.length > 165) warn(rel, `description is ${desc.length} characters (aim for 155): ${desc.slice(0, 60)}…`);
    const h1s = (raw.match(/<h1\b/g) || []).length;
    if (h1s !== 1) warn(rel, `${h1s} h1 headings (one per page)`);
  }

  // One id per page: a glossary term is linked once per article (components/blog/Term.tsx).
  const seenIds = new Set();
  for (const m of raw.matchAll(/\sid="([^"]+)"/g)) {
    if (seenIds.has(m[1])) fail(rel, `id "${m[1]}" is used twice on the page`);
    seenIds.add(m[1]);
  }

  // Links within the site land on a real page, and on a real section of it.
  for (const m of raw.matchAll(/\shref="([^"]+)"/g)) {
    let href = m[1].replace(/&amp;/g, "&");
    if (/^(https?:|mailto:|tel:|data:|javascript:)/.test(href)) continue;
    if (href.startsWith("#")) {
      if (href.length > 1 && !seenIds.has(href.slice(1)) && !idsOf(f).has(href.slice(1))) fail(rel, `link to #${href.slice(1)}: no such section on the page`);
      continue;
    }
    if (!href.startsWith("/")) continue;
    if (BASE && href.startsWith(`${BASE}/`)) href = href.slice(BASE.length);
    if (href.startsWith("/_next/")) continue;
    const target = pageFile(href);
    if (!target) {
      fail(rel, `link to ${href}: no such page or file`);
      continue;
    }
    const frag = href.includes("#") ? decodeURIComponent(href.split("#")[1]) : "";
    // The home page's #chapters are places in the film, found by its own script (lib/chapters.ts), not ids.
    const home = path.relative(root, target).replace(/\\/g, "/") === "index.html";
    if (frag && !home && target.endsWith(".html") && !idsOf(target).has(frag)) fail(rel, `link to ${href}: no section #${frag} there`);
  }

  // The blog: the writing rules proper. Articles are the pages built from components/blog/Article.tsx.
  const isBlog = /^blog\//.test(rel) && !/feed\.xml$/.test(rel);
  const isArticle = /<article class="ar"/.test(raw);
  if (/^blog\/glossary\//.test(rel)) {
    if (!/class="ar-sources[ "]/.test(raw)) fail(rel, "no Sources section");
  }
  if (isArticle) {
    if (!/class="ar-sources[ "]/.test(raw)) fail(rel, "no Sources section");
    else if ((raw.match(/id="source-\d+"/g) || []).length < 2) fail(rel, "fewer than two sources");
    if (!/class="ar-credit"/.test(raw)) fail(rel, "no credit for the cover photograph");
    if (!/class="ar-short"/.test(raw)) fail(rel, "no short answer");
    if (!/class="ar-for"/.test(raw)) fail(rel, "doesn't say who it's for (audience in the registry)");
  }
  if (isBlog) {
    // The sources' own titles are quoted as published, so they are not held to our spelling.
    const body = textOf(raw.replace(/<section class="ar-sources[^"]*"[\s\S]*?<\/section>/, " ")).toLowerCase();
    for (const p of BANNED) {
      const i = body.indexOf(p.toLowerCase());
      if (i >= 0) fail(rel, `stock phrase “${p}”: “…${context(body, i)}…”`);
    }
    for (const w of US) {
      const m = body.match(new RegExp(`\\b${w}\\b`));
      if (m) fail(rel, `US spelling “${w}”: “…${context(body, m.index)}…”`);
    }
    for (const w of SPARING) {
      const n = (body.match(new RegExp(`\\b${w}\\b`, "g")) || []).length;
      if (n > 1) warn(rel, `“${w}” ${n} times (use it sparingly)`);
    }
  }
}

for (const w of warnings) console.warn(`copy-guard (warning) ${w}`);
if (failures.length) {
  for (const x of failures) console.error(`copy-guard ${x}`);
  console.error(`\ncopy-guard: ${failures.length} problem(s). The rules are in docs/BLOG-GUIDE.md.`);
  process.exit(1);
}
console.log(`copy-guard: ${files.length} files clean${warnings.length ? ` (${warnings.length} warnings)` : ""}.`);
