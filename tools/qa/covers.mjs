// Work covers: each case study's live demo, in its browser frame, at 16:10.
import puppeteer from "file:///C:/Nerodyn/baybymaybe/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";

const [, , base, out] = process.argv;
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox"] });
for (const slug of ["practice-website", "operations-portal", "enquiry-desk"]) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 2 });
  await page.goto(`${base}/work/${slug}/`, { waitUntil: "networkidle0" });
  await page.evaluate(() => {
    document.querySelectorAll("[data-rv]").forEach((e) => (e.dataset.in = "1"));
    const f = document.querySelector(".cs-stage .dev-browser");
    // 16:10 exactly: the frame's width, and a screen tall enough to match.
    const w = f.getBoundingClientRect().width;
    f.style.setProperty("--dev-h", `${Math.round(w / 1.6 - 41)}px`);
    f.scrollIntoView();
    if (location.pathname.includes("enquiry-desk")) [...f.querySelectorAll("button")].find((b) => b.textContent.startsWith("Next"))?.click();
  });
  await new Promise((r) => setTimeout(r, 1500));
  const el = await page.$(".cs-stage .dev-browser");
  const b = await el.boundingBox();
  await el.screenshot({ path: `${out}/${slug}.png` });
  console.log(slug, Math.round(b.width), "x", Math.round(b.height), (b.width / b.height).toFixed(3));
  await page.close();
}
await browser.close();
