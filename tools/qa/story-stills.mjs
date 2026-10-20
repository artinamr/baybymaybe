// Stills at a list of P on the real GPU (HUD on unless hud=0), then a contact sheet via sheet.py.
// usage: node tools/qa/story-stills.mjs <base> <outDir> <P,P,...> [hud=1]   env W H (default 1440 900; <600 wide = phone); then python tools/qa/sheet.py <outDir> <sheet.jpg> [cols] [width]
import puppeteer from "puppeteer-core";
import fs from "node:fs";

const [, , base, out, list, hud = "1"] = process.argv;
const W = +(process.env.W || 1440);
const H = +(process.env.H || 900);
const M = W < 600;
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  protocolTimeout: 900000,
  args: ["--no-sandbox", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu", `--window-size=${W},${H}`],
  defaultViewport: { width: W, height: H, deviceScaleFactor: M ? 2 : 1, isMobile: M, hasTouch: M },
});
const page = await browser.newPage();
if (M) await page.setUserAgent("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36");
page.on("pageerror", (e) => console.log("pageerror", e.message.slice(0, 200)));
page.on("console", (m) => {
  if (m.type() === "error") console.log("console", m.text().slice(0, 200));
});
const Ps = list.split(",").map(Number);
await page.goto(`${base}/story/?at=${Ps[0]}&freeze=1${hud === "0" ? "&hud=0" : ""}${process.env.EXTRA || ""}`, { waitUntil: "load", timeout: 300000 });
await page.waitForFunction(() => !!window.__story, { timeout: 300000, polling: 500 });
await new Promise((r) => setTimeout(r, 3500));
for (const P of Ps) {
  await page.evaluate((P) => window.__story.jump(P), P);
  await new Promise((r) => setTimeout(r, 2600));
  // (Frozen look-dev holds the page's own transitions: finish them, so a still shows what the film shows.)
  await page.evaluate(() => document.getAnimations().forEach((x) => { try { if (x.effect?.getComputedTiming().endTime !== Infinity) x.finish(); } catch {} }));
  await new Promise((r) => setTimeout(r, 120));
  const file = `${out}/P${P.toFixed(2).padStart(5, "0")}.jpg`;
  await page.screenshot({ path: file, type: "jpeg", quality: 84 });
}
await browser.close();
console.log("stills", Ps.length, out);
