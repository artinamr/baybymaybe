// The story's share card (public/og/story.jpg, 1200×630): a still of the film (real
// GPU, the words hidden) under the title, set in the site's own Inter.
// usage: node tools/qa/storycard.mjs <base> [P=17.42] [out=public/og/story.jpg]
//   (serve the site first: the dev server or a plain build of out/)
import puppeteer from "file:///C:/Nerodyn/baybymaybe/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";

const [, , base = "http://localhost:3000", P = "17.42", out = "C:/Nerodyn/baybymaybe/public/og/story.jpg"] = process.argv;
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  protocolTimeout: 600000,
  args: ["--no-sandbox", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu", "--window-size=1200,630"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
await page.goto(`${base}/story/?at=${P}&freeze=1&hud=0`, { waitUntil: "load", timeout: 300000 });
await page.waitForFunction(() => !!window.__story, { timeout: 300000, polling: 500 });
await new Promise((r) => setTimeout(r, 6000));
const still = (await page.screenshot({ type: "jpeg", quality: 92 })).toString("base64");

const MARK = `<svg viewBox="440 210 1170 1620" fill="currentColor" aria-hidden="true" style="width:100%;height:100%"><path d="M1024.1 223.099C1072.41 249.214 1124.15 274.149 1173.05 299.761C1308.95 370.927 1447.09 439.725 1582.27 512.166C1567.47 521.965 1538.01 537.433 1521.83 546.624L1398.95 616.541L1024.55 830.086C1016.42 828.418 909.427 765.123 891.335 754.789L465.643 512.402C522.324 481.003 585.352 449.565 643.049 419.672L1024.1 223.099Z"/><path d="M453.078 529.795C463.966 534.464 495.273 553.41 507.546 560.424L620.202 624.726L1013.4 848.933L1013.37 1505.9L1013.39 1702.25C1013.39 1738.89 1013.9 1776.85 1013.15 1813.41C1008.48 1805.57 998.714 1781.58 994.795 1772.55L958.748 1689.47L836.979 1408.55L453.078 529.795Z"/><path d="M1593.57 530.024L1594.27 530.56C1593.53 536.483 1566.1 595.725 1561.63 605.867L1465.4 825.407L1035.78 1812.2L1034.6 1811.5L1034.66 848.827L1593.57 530.024Z"/></svg>`;
const card = `
<div id="card" style="position:fixed;inset:0;width:1200px;height:630px;z-index:99999;font-family:var(--font-inter),Inter,sans-serif;letter-spacing:-0.011em;color:#F6F5F2;background:#07080d url(data:image/jpeg;base64,${still}) center/cover no-repeat">
  <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(6,7,12,.86) 0%,rgba(6,7,12,.6) 40%,rgba(6,7,12,0) 72%)"></div>
  <div style="position:absolute;left:64px;top:56px;bottom:52px;width:560px;display:flex;flex-direction:column">
    <p style="margin:0 0 30px;font-size:20px;font-weight:500;color:rgba(246,245,242,.8);display:flex;gap:14px;align-items:center"><span style="display:inline-block;width:34px;height:1px;background:rgba(246,245,242,.6)"></span>A short film by Nerodyn</p>
    <h1 style="margin:0;font-weight:500;font-size:92px;line-height:1.0;letter-spacing:-0.035em">The quiet leak</h1>
    <p style="margin:26px 0 0;font-size:27px;line-height:1.35;color:rgba(246,245,242,.86);max-width:500px">One customer, one evening: where they slip away, and how to keep them.</p>
    <div style="margin-top:auto;display:flex;align-items:center;gap:14px;font-size:24px;font-weight:600;letter-spacing:-0.02em">
      <span style="width:22px;height:30px;display:inline-block">${MARK}</span>Nerodyn
      <span style="margin-left:10px;font-size:18px;font-weight:400;letter-spacing:-0.01em;color:rgba(246,245,242,.62)">Auckland, New Zealand</span>
    </div>
  </div>
</div>`;
// Any page of the site brings its own Inter (next/font) with it.
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await page.goto(`${base}/privacy/`, { waitUntil: "networkidle0", timeout: 120000 });
await page.evaluate(() => document.fonts.ready);
await page.evaluate((html) => document.body.insertAdjacentHTML("beforeend", html), card);
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: out, type: "jpeg", quality: 86, clip: { x: 0, y: 0, width: 1200, height: 630 } });
console.log(out, Math.round(fs.statSync(out).size / 1024), "KB");
await browser.close();
