// Keyboard walk: Tab through a page and flag every focus stop a sighted
// keyboard user could not see (transparent, hidden, off screen, covered).
// usage: node kbd.mjs <url> [tabs] [width] [height] [shotDir]
import puppeteer from "file:///C:/Nerodyn/baybymaybe/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";

const [, , url, tabsArg = "90", w = "1440", h = "900", shotDir] = process.argv;
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--no-sandbox", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu", `--window-size=${w},${h}`],
  defaultViewport: { width: +w, height: +h, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
await page.goto(url, { waitUntil: "load", timeout: 120000 });
await page.waitForFunction(() => !document.documentElement.dataset.intro || document.documentElement.dataset.intro === "done", { timeout: 60000 });
await new Promise((r) => setTimeout(r, 1500));
if (shotDir) fs.mkdirSync(shotDir, { recursive: true });

const seen = new Set();
for (let i = 0; i < +tabsArg; i++) {
  await page.keyboard.press("Tab");
  await new Promise((r) => setTimeout(r, 450));
  const r = await page.evaluate(() => {
    const e = document.activeElement;
    if (!e || e === document.body) return { body: true };
    const b = e.getBoundingClientRect();
    let op = 1, hidden = false;
    for (let n = e; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      op *= +cs.opacity;
      if (cs.visibility === "hidden" || cs.display === "none") hidden = true;
    }
    const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
    const inView = b.bottom > 0 && b.top < innerHeight && b.right > 0 && b.left < innerWidth;
    const top = inView ? document.elementFromPoint(Math.min(innerWidth - 1, Math.max(0, cx)), Math.min(innerHeight - 1, Math.max(0, cy))) : null;
    const hit = !!top && (top === e || e.contains(top) || top.contains(e));
    const name = (e.getAttribute("aria-label") || e.textContent || e.getAttribute("name") || e.getAttribute("placeholder") || "").replace(/\s+/g, " ").trim().slice(0, 34);
    const outline = getComputedStyle(e).outlineStyle + " " + getComputedStyle(e).boxShadow.slice(0, 20);
    return {
      id: e.tagName.toLowerCase() + (e.className && typeof e.className === "string" ? "." + e.className.split(" ")[0] : "") + ` "${name}"`,
      op: +op.toFixed(2), hidden, inView, hit, coveredBy: hit || !top ? "" : top.tagName.toLowerCase() + "." + String(top.className).split(" ")[0],
      y: Math.round(b.y), S: +(scrollY / innerHeight).toFixed(2), outline,
    };
  });
  if (r.body) { console.log(`${i}: <body>`); continue; }
  const bad = r.op < 0.5 || r.hidden || !r.inView || !r.hit;
  console.log(`${bad ? "!!" : "  "} ${i}: ${r.id} op=${r.op}${r.hidden ? " HIDDEN" : ""}${r.inView ? "" : " OFFSCREEN"}${r.hit ? "" : " covered-by " + r.coveredBy} y=${r.y} S=${r.S} [${r.outline}]`);
  if (shotDir && (bad || i % 10 === 0)) await page.screenshot({ path: `${shotDir}/k${String(i).padStart(3, "0")}.png` });
  if (seen.has(r.id + r.y + r.S) && i > 5) { /* keep going: loops are informative */ }
  seen.add(r.id + r.y + r.S);
}
console.log("errors:", errs.length ? errs : "none");
await browser.close();
