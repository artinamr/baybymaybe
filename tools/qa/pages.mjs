// Full-page shots of the site's pages (reveals forced on), desktop or phone.
// usage: node pages.mjs <base> <outDir> <w> <h> <path,path,...>
import puppeteer from "file:///C:/Nerodyn/baybymaybe/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";

const [, , base, out, w = "1440", h = "900", list = "/services/"] = process.argv;
fs.mkdirSync(out, { recursive: true });
const mobile = +w < 700;
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox"] });
for (const p of list.split(",")) {
  const page = await browser.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  page.on("response", (r) => { if (r.status() >= 400) errs.push(`${r.status()} ${r.url()}`); });
  await page.setViewport({ width: +w, height: +h, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  await page.goto(base + p, { waitUntil: "networkidle0", timeout: 60000 });
  await page.evaluate(async () => {
    // walk down so lazy images load, then show every reveal at once
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.7) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    document.querySelectorAll("[data-rv]").forEach((e) => (e.dataset.in = "1"));
    window.scrollTo(0, 0);
  });
  await new Promise((r) => setTimeout(r, 1800));
  const name = p.replace(/\//g, "_").replace(/^_|_$/g, "") || "home";
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  console.log(`${p} height=${H}px (${(H / +h).toFixed(1)} screens) errors=${errs.length ? errs.join(" | ") : "none"}`);
  await page.close();
}
await browser.close();
