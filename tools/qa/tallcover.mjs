// A portrait cover: a case study's phone frame, for the home page's tall card.
import puppeteer from "file:///C:/Nerodyn/baybymaybe/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";

const [, , base, slug, out] = process.argv;
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1100, deviceScaleFactor: 2.5 });
await page.goto(`${base}/work/${slug}/`, { waitUntil: "networkidle0" });
await page.evaluate(() => {
  document.querySelectorAll("[data-rv]").forEach((e) => (e.dataset.in = "1"));
  // Only the device: no paper round its rounded corners.
  for (const e of [document.documentElement, document.body, ...document.querySelectorAll(".sp, .sp-main, .sp-block")]) e.style.background = "transparent";
  document.querySelector(".cs-views .dev-phone").scrollIntoView({ block: "center" });
});
await new Promise((r) => setTimeout(r, 1200));
const el = await page.$(".cs-views .dev-phone");
await el.screenshot({ path: out, omitBackground: true });
console.log("saved", out);
await browser.close();
