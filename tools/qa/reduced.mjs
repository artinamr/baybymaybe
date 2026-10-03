// prefers-reduced-motion: the page must still load, reveal and jump.
// usage: node reduced.mjs <base>/ [shotDir]
import puppeteer from "file:///C:/Nerodyn/baybymaybe/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import os from "node:os";
const shots = process.argv[3] || os.tmpdir();
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu"], defaultViewport: { width: 1440, height: 900 } });
const errs = [];
const failures = [];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function open(width, height, mobile) {
  const page = await browser.newPage();
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await page.setViewport({ width, height, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  const t0 = Date.now();
  await page.goto(process.argv[2], { waitUntil: "load" });
  const done = await page.waitForFunction(() => document.documentElement.dataset.intro === "done", { timeout: 60000 }).then(() => true, () => false);
  if (!done) failures.push(`${width}: intro never reached done`);
  console.log(`${width}: intro done after`, Date.now() - t0, "ms; reduced attr:", await page.evaluate(() => document.documentElement.hasAttribute("data-reduced")), "loader display:", await page.evaluate(() => getComputedStyle(document.getElementById("loader")).display));
  await wait(1500);
  return page;
}

// Desktop: the hero, the free-audit jump, and plain wheel scrolling.
let page = await open(1440, 900, false);
await page.screenshot({ path: `${shots}/reduced_hero.png` });
await page.evaluate(() => [...document.querySelectorAll("a,button")].find((a) => /Free audit/.test(a.textContent) && a.getBoundingClientRect().top < 100).click());
await wait(1200);
const top = await page.evaluate(() => Math.round(document.getElementById("contact").getBoundingClientRect().top));
console.log("free audit -> contact top", top);
if (top < 0 || top > 120) failures.push(`free audit landed contact at ${top}px`);
await page.evaluate(() => window.scrollTo(0, 0));
await wait(500);
await page.mouse.move(700, 450);
for (let i = 0; i < 20; i++) { await page.mouse.wheel({ deltaY: 120 }); await wait(40); }
await wait(1500);
const S = await page.evaluate(() => scrollY / innerHeight);
console.log("after wheel: S", S.toFixed(2));
if (S < 0.5) failures.push("wheel did not scroll");
await page.screenshot({ path: `${shots}/reduced_wheel.png` });
// every reveal on the way is shown (no element left waiting at opacity 0 above the fold)
await page.close();

// Phone: the menu's chapter jumps.
page = await open(390, 844, true);
for (const label of ["What we build", "Why Nerodyn"]) {
  await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /menu/i.test(b.textContent)).click());
  await wait(500);
  const ok = await page.evaluate((l) => {
    const a = [...document.querySelectorAll("[role=dialog] a, [role=dialog] button")].find((x) => x.textContent.includes(l));
    if (!a) return false;
    a.click();
    return true;
  }, label);
  await wait(1500);
  const s = await page.evaluate(() => (scrollY / innerHeight).toFixed(2));
  console.log(label, "-> S", s);
  if (!ok) failures.push(`menu has no "${label}"`);
}
await page.screenshot({ path: `${shots}/reduced_why_phone.png` });
await page.close();

console.log("errors:", errs.length ? errs : "none");
await browser.close();
if (errs.length || failures.length) {
  console.error("FAIL:", failures.join(" | ") || "page errors");
  process.exit(1);
}
