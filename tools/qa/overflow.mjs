// Horizontal overflow on phones: can the page be dragged sideways?
// usage: node overflow.mjs <base> [comma-separated paths]
import puppeteer from "file:///C:/Nerodyn/baybymaybe/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const base = process.argv[2];
if (!base) throw new Error("Pass the site's base URL.");
const defaults = [
  "/", "/services/", "/services/websites/", "/services/platforms/", "/services/ai-automation/",
  "/work/", "/work/practice-website/", "/work/operations-portal/", "/work/enquiry-desk/",
  "/methodology/", "/studio/", "/pricing/", "/contact/", "/faq/", "/privacy/", "/terms/", "/404.html",
];
const paths = process.argv[3] ? process.argv[3].split(",").map((p) => p.trim()).filter(Boolean) : defaults;
if (!paths.length) throw new Error("Pass at least one page path.");
const failures = [];
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu"] });
try {
for (const w of [320, 375, 414, 768]) {
  for (const p of paths) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: w < 700 ? 780 : 1024, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await page.goto(base + p, { waitUntil: "load", timeout: 120000 });
    await new Promise((r) => setTimeout(r, p === "/" ? 5000 : 1200));
    // walk the whole page so lazy reveals run, then measure
    const res = await page.evaluate(async () => {
      const H = document.documentElement.scrollHeight;
      for (let y = 0; y < H; y += innerHeight * 0.8) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
      const sw = document.documentElement.scrollWidth, iw = innerWidth;
      // can the page actually scroll sideways?
      window.scrollTo(200, window.scrollY);
      const sx = window.scrollX;
      window.scrollTo(0, window.scrollY);
      const wide = [];
      if (sw > iw || sx > 0) {
        for (const e of document.querySelectorAll("body *")) {
          const r = e.getBoundingClientRect();
          if (r.width && r.right > iw + 1) {
            const cs = getComputedStyle(e);
            if (cs.position === "fixed" && r.left >= iw) continue;
            wide.push(`${e.tagName.toLowerCase()}.${String(e.className).split(" ")[0]} r=${Math.round(r.right)}`);
          }
        }
      }
      return { sw, iw, sx, wide: wide.slice(0, 6) };
    });
    const bad = res.sx > 0;
    console.log(`${bad ? "!!" : "ok"} ${w} ${p} scrollWidth=${res.sw} scrollX-after-drag=${res.sx}${res.wide.length ? " wide: " + res.wide.join(", ") : ""}`);
    if (bad) failures.push(`${w}px ${p}: page can scroll sideways by ${res.sx}px`);
    await page.close();
  }
}
} finally {
  await browser.close();
}
if (failures.length) throw new Error(`Horizontal overflow:\n${failures.join("\n")}`);
