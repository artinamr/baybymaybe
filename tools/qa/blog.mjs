// The blog's interactions: search (and its glossary hits), topics, the "What are you deciding?" panel,
// a term's definition on hover, the time left, the phone's contents bar, the glossary's filter.
// usage: node blog.mjs <base> [shotDir]   (serve a plain build of out/ first)
import puppeteer from "file:///C:/Nerodyn/baybymaybe/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";

const B = process.argv[2] || "http://127.0.0.1:3100";
const out = process.argv[3] || "blog-shots";
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox", "--hide-scrollbars"] });
let fails = 0;
const ok = (c, m) => {
  if (!c) fails++;
  console.log(c ? "PASS" : "FAIL", m);
};
const clear = async (page) => { await page.focus("#bl-q"); await page.keyboard.down("Control"); await page.keyboard.press("A"); await page.keyboard.up("Control"); await page.keyboard.press("Backspace"); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const visible = (page) =>
  page.evaluate(() => [...document.querySelectorAll(".bl-index [data-slug]")].filter((e) => getComputedStyle(e).display !== "none").map((e) => e.dataset.slug));

// Desktop: search and topics
{
  const page = await browser.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${B}/blog/`, { waitUntil: "networkidle0" });
  ok((await visible(page)).length === 6, "all six cards at first");
  await page.keyboard.press("/");
  await sleep(400);
  ok(await page.evaluate(() => document.activeElement?.id === "bl-q"), '"/" focuses the search');
  await page.keyboard.type("udai");
  await sleep(200);
  const v1 = await visible(page);
  ok(v1.length === 1 && v1[0] === "after-launch-ownership", `search "udai" → ${v1.join(",")}`);
  ok(await page.evaluate(() => [...document.querySelectorAll(".bl-hits a")].map((a) => a.textContent).includes("UDAI")), "glossary hit offered for udai");
  ok((await page.$eval(".bl-count", (e) => e.textContent)).includes("1 of 6"), "count says 1 of 6");
  await clear(page);
  await page.keyboard.type("privacy");
  await sleep(200);
  console.log("  privacy →", (await visible(page)).join(","));
  await clear(page);
  await page.keyboard.type("zebra crossing");
  await sleep(200);
  ok((await visible(page)).length === 0 && (await page.$(".bl-none")), "no match → the ask offer");
  await clear(page);
  await page.keyboard.press("Backspace");
  await sleep(200);
  ok((await visible(page)).length === 6, "cleared → six again");
  const btns = await page.$$(".bl-filter button");
  await btns[2].click();
  await sleep(200);
  const v2 = await visible(page);
  ok(v2.length === 2, `Platforms topic → ${v2.join(",")}`);
  await btns[0].click();
  // situations panel
  await page.evaluate(() => document.querySelector(".bl-start").scrollIntoView());
  await sleep(500);
  const rows = await page.$$(".bl-sit a");
  await rows[3].hover();
  await sleep(800);
  const peek = await page.evaluate(() => {
    const on = document.querySelector(".bl-peek-b > span[data-on]");
    return { text: on?.textContent?.slice(0, 40), href: document.querySelector(".bl-peek").getAttribute("href") };
  });
  ok(peek.href.includes("connect-website-crm-booking"), `hover row 4 → panel ${peek.href} “${peek.text}…”`);
  await page.evaluate(() => document.querySelectorAll("[data-rv]").forEach((e) => e.setAttribute("data-in", "")));
  await sleep(1300);
  const r = await page.evaluate(() => {
    const b = document.querySelector(".bl-start").getBoundingClientRect();
    return { y: b.top + scrollY, h: b.height };
  });
  await page.screenshot({ path: `${out}/i-situations.png`, clip: { x: 0, y: r.y, width: 1440, height: Math.min(r.h, 1100) } });
  ok(errs.length === 0, `no page errors ${errs.join(" | ")}`);
  await page.close();
}

// Desktop article: a term's tip on hover
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${B}/blog/after-launch-ownership/`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.querySelectorAll("[data-rv]").forEach((e) => e.setAttribute("data-in", "")));
  const a = await page.$('.term-a[href*="#udai"]');
  await a.evaluate((e) => e.scrollIntoView({ block: "center" }));
  await sleep(400);
  await a.hover();
  await sleep(500);
  const tip = await page.evaluate(() => {
    const t = document.getElementById("gt-udai");
    const s = getComputedStyle(t);
    const r = t.getBoundingClientRect();
    return { display: s.display, x: r.x, y: r.y, w: r.width, h: r.height };
  });
  ok(tip.display === "block", `UDAI tip shows on hover (${Math.round(tip.w)}×${Math.round(tip.h)})`);
  await page.screenshot({ path: `${out}/i-term.png`, clip: { x: Math.max(0, tip.x - 200), y: tip.y - 20 + (await page.evaluate(() => scrollY)), width: 760, height: tip.h + 120 } });
  // the contents' time left changes as you read
  await page.evaluate(() => scrollTo(0, 0));
  await sleep(400);
  const before = await page.$eval(".ar-toc-left", (e) => e.textContent);
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight * 0.55));
  await sleep(400);
  const after = await page.$eval(".ar-toc-left", (e) => e.textContent);
  ok(before !== after, `time left: “${before}” → “${after}”`);
  await page.close();
}

// Phone article: the contents bar
{
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.goto(`${B}/blog/connect-website-crm-booking/`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.querySelectorAll("[data-rv]").forEach((e) => e.setAttribute("data-in", "")));
  await page.evaluate(() => document.getElementById("field-map").scrollIntoView());
  await sleep(600);
  const bar = await page.evaluate(() => {
    const b = document.querySelector(".ar-toc").getBoundingClientRect();
    return { top: Math.round(b.top), now: document.querySelector(".ar-toc-bar-now").textContent };
  });
  ok(bar.top === 76, `bar sticks under the nav (top ${bar.top}), says “${bar.now}”`);
  await page.tap(".ar-toc-bar");
  await sleep(400);
  ok(await page.$eval(".ar-toc-list", (e) => getComputedStyle(e).display === "grid"), "tap opens the list");
  await page.screenshot({ path: `${out}/i-phonebar.png` });
  const links = await page.$$(".ar-toc-list a");
  await links[links.length - 1].tap();
  await sleep(900);
  ok(await page.$eval(".ar-toc-list", (e) => getComputedStyle(e).display === "none"), "choosing a section closes it");
  const hOver = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  ok(!hOver, "no sideways scroll on the phone");
  await page.close();
}

// Glossary filter
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${B}/blog/glossary/`, { waitUntil: "networkidle0" });
  await page.type("#gl-q", "consent");
  await sleep(200);
  const shown = await page.evaluate(() => [...document.querySelectorAll(".gl [data-term]")].filter((e) => getComputedStyle(e).display !== "none").map((e) => e.id));
  const groups = await page.evaluate(() => [...document.querySelectorAll(".gl-group")].filter((e) => getComputedStyle(e).display !== "none").length);
  ok(shown.length > 0 && groups >= 1, `glossary “consent” → ${shown.join(",")} in ${groups} group(s)`);
  await page.close();
}
await browser.close();
if (fails) {
  console.error(`${fails} check(s) failed`);
  process.exit(1);
}
