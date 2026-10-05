// The share cards (public/og/<name>.jpg, 1200×630): what a link to a page shows on
// LinkedIn, Facebook, Slack, iMessage. Rendered in the local site so the type is the
// site's own Inter, with the page's photograph (content/images.ts) where it has one.
// usage: node ogcards.mjs <base> [outDir=public/og]   (serve a PLAIN build of out/ first)
// Keep the list in step with the pages' ogCard(...) calls (lib/content.ts → ogCard).
import puppeteer from "file:///C:/Nerodyn/baybymaybe/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";

const [, , base = "http://127.0.0.1:3100", out = "C:/Nerodyn/baybymaybe/public/og"] = process.argv;
fs.mkdirSync(out, { recursive: true });

// [name, kicker, ink line, indigo line, photo path or null]
const CARDS = [
  ["blog-redesign-or-improve", "Blog · Websites", "Website redesign or targeted improvements: how to decide", "", "/blog/redesign-or-improve.webp"],
  ["blog-website-quote-checklist", "Blog · Websites", "What a business website quote should include", "", "/blog/website-quote-checklist.webp"],
  ["blog-when-you-need-a-client-portal", "Blog · Platforms", "When your business needs a client portal", "", "/blog/when-you-need-a-client-portal.webp"],
  ["blog-connect-website-crm-booking", "Blog · Platforms", "Connecting your website to your CRM and booking tools", "", "/blog/connect-website-crm-booking.webp"],
  ["blog-ai-automation-workflows", "Blog · Automation", "Five practical AI automation workflows for NZ businesses", "", "/blog/ai-automation-workflows.webp"],
  ["blog-after-launch-ownership", "Blog · Websites", "After launch: website ownership, hosting and support", "", "/blog/after-launch-ownership.webp"],
  ["services-websites", "Services · Websites", "Websites that turn visits", "into enquiries.", "/services/websites-wide.webp"],
  ["services-platforms", "Services · Platforms", "Platforms your team", "and your clients run on.", "/services/platforms-wide.webp"],
  ["services-ai-automation", "Services · AI automation", "AI that does the work,", "and knows when to ask.", "/services/ai-automation-wide.webp"],
  ["methodology", "Methodology", "From first call to live,", "in about fourteen days.", "/method/hero.webp"],
  ["services", "Services", "Three disciplines.", "One system.", "/services/websites.webp"],
  ["blog", "Blog", "Questions owners ask,", "answered properly.", "/blog/website-quote-checklist.webp"],
  ["blog-glossary", "Blog · Glossary", "Web words,", "in plain English.", null],
  ["blog-how-we-write", "Blog · How we write", "How we write", "and check our articles.", null],
  ["audit", "Free website audit", "Send us your website.", "A straight answer in two days.", null],
  ["studio", "Studio", "One team,", "from first call to launch.", null],
  ["pricing", "Investment", "What it costs,", "and why.", null],
  ["contact", "Contact", "Tell us", "what you need.", null],
  ["faq", "Questions", "Straight answers,", "before the first call.", null],
];

const MARK = `<svg viewBox="440 210 1170 1620" fill="currentColor" aria-hidden="true"><path d="M1024.1 223.099C1072.41 249.214 1124.15 274.149 1173.05 299.761C1308.95 370.927 1447.09 439.725 1582.27 512.166C1567.47 521.965 1538.01 537.433 1521.83 546.624L1398.95 616.541L1024.55 830.086C1016.42 828.418 909.427 765.123 891.335 754.789L465.643 512.402C522.324 481.003 585.352 449.565 643.049 419.672L1024.1 223.099Z"/><path d="M453.078 529.795C463.966 534.464 495.273 553.41 507.546 560.424L620.202 624.726L1013.4 848.933L1013.37 1505.9L1013.39 1702.25C1013.39 1738.89 1013.9 1776.85 1013.15 1813.41C1008.48 1805.57 998.714 1781.58 994.795 1772.55L958.748 1689.47L836.979 1408.55L453.078 529.795Z"/><path d="M1593.57 530.024L1594.27 530.56C1593.53 536.483 1566.1 595.725 1561.63 605.867L1465.4 825.407L1035.78 1812.2L1034.6 1811.5L1034.66 848.827L1593.57 530.024Z"/></svg>`;

// The title's size: a two-voice title keeps each voice on as few lines as it can.
const size = (ink, indigo) => {
  if (!indigo) return ink.length > 44 ? 54 : 58;
  const L = Math.max(ink.length, indigo.length);
  return L <= 18 ? 62 : L <= 23 ? 54 : 48;
};

const card = ([, kicker, ink, indigo, photo]) => `
<div id="card" style="position:fixed;inset:0;width:1200px;height:630px;background:#F6F5F2;color:#0A0B10;font-family:var(--font-inter),Inter,sans-serif;display:grid;grid-template-columns:${photo ? "1fr 430px" : "1fr 280px"};gap:48px;padding:56px 56px 52px 64px;box-sizing:border-box;z-index:99999;letter-spacing:-0.011em">
  <div style="display:flex;flex-direction:column;min-width:0">
    <p style="margin:0 0 28px;font-size:20px;font-weight:500;color:#5B3DF0;display:flex;gap:14px;align-items:center"><span style="display:inline-block;width:34px;height:1px;background:#5B3DF0"></span>${kicker}</p>
    <h1 style="margin:0;font-weight:500;font-size:${size(ink, indigo)}px;line-height:1.05;letter-spacing:-0.03em;text-wrap:balance">${ink}${indigo ? `<br><span style="color:#5B3DF0">${indigo}</span>` : ""}</h1>
    <div style="margin-top:auto;display:flex;align-items:center;gap:14px;font-size:24px;font-weight:600;letter-spacing:-0.02em">
      <span style="width:22px;height:30px;display:inline-block">${MARK.replace("<svg ", '<svg style="width:100%;height:100%" ')}</span>Nerodyn
      <span style="margin-left:10px;font-size:18px;font-weight:400;letter-spacing:-0.01em;color:rgba(10,11,16,.6)">Auckland, New Zealand</span>
    </div>
  </div>
  ${
    photo
      ? `<div style="border-radius:26px;overflow:hidden;border:1px solid rgba(10,11,16,.07);background:#eeede9"><img src="${base}${photo}" style="width:100%;height:100%;object-fit:cover;display:block"></div>`
      : `<div style="display:grid;place-items:center;color:#0A0B10"><span style="width:230px;height:318px;display:block">${MARK.replace("<svg ", '<svg style="width:100%;height:100%" ')}</span></div>`
  }
</div>`;

const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
// Any page of the site: it brings the site's own Inter (next/font) with it.
await page.goto(`${base}/privacy/`, { waitUntil: "networkidle0" });
await page.evaluate(() => document.fonts.ready);
// ONLY=name,name renders just those cards (the others stay byte for byte as they are).
const ONLY = (process.env.ONLY || "").split(",").filter(Boolean);
for (const c of CARDS.filter((c) => !ONLY.length || ONLY.includes(c[0]))) {
  await page.evaluate((html) => {
    document.getElementById("card")?.remove();
    document.body.insertAdjacentHTML("beforeend", html);
    return Promise.all([...document.querySelectorAll("#card img")].map((i) => (i.complete ? 0 : new Promise((r) => (i.onload = i.onerror = r)))));
  }, card(c));
  await new Promise((r) => setTimeout(r, 150));
  const file = `${out}/${c[0]}.jpg`;
  await page.screenshot({ path: file, type: "jpeg", quality: 86, clip: { x: 0, y: 0, width: 1200, height: 630 } });
  console.log(file, Math.round(fs.statSync(file).size / 1024), "KB");
}
await browser.close();
