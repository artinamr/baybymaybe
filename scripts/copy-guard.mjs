// THE COPY GUARD: runs after `next build` (npm run build, and so every deploy) and
// fails the build when the site's writing rules are broken. The rules are the
// client's and are written out in docs/BLOG-GUIDE.md:
//   - no em dashes anywhere a reader or a search engine sees (pages, attributes,
//     structured data, the feed, llms.txt), and no spaced en dashes doing their job;
//   - articles: none of the stock phrases that make writing sound machine-made,
//     UK/NZ spelling, a sources list, and a credit for the cover photograph;
//   - every image has alt text.
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
  "utilize", "authorize", "authorized", "apologize", "specialize", "specialized", "standardize", "license fee",
];

const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) {
      if (f !== "_next") walk(p);
    } else if (/\.(html|xml|txt)$/.test(f) && !/^__next|^index\.txt$/.test(f)) files.push(p);
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

  // Articles: the writing rules proper.
  const isArticle = /^blog\/[^/]+\/index\.html$/.test(rel);
  if (isArticle) {
    if (!/class="ar-sources"/.test(raw)) fail(rel, "no Sources section");
    else if ((raw.match(/id="source-\d+"/g) || []).length < 2) fail(rel, "fewer than two sources");
    if (!/class="ar-credit"/.test(raw)) fail(rel, "no credit for the cover photograph");
    // The sources' own titles are quoted as published, so they are not held to our spelling.
    const body = textOf(raw.replace(/<section class="ar-sources"[\s\S]*?<\/section>/, " ")).toLowerCase();
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
