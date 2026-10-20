// GPU time per pass at points of the story film (real GPU, ?perf=1): node tools/qa/story-gpu.mjs <base> <P,P,...> [W=1920] [H=1080]
import puppeteer from "puppeteer-core";
const [, , base, list, W = "1920", H = "1080"] = process.argv;
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  protocolTimeout: 900000,
  args: ["--no-sandbox", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu", `--window-size=${W},${H}`],
  defaultViewport: { width: +W, height: +H, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
const Ps = list.split(",").map(Number);
await page.goto(`${base}/story/?at=${Ps[0]}&perf=1&hud=0${process.env.EXTRA || ""}`, { waitUntil: "load", timeout: 300000 });
await page.waitForFunction(() => !!window.__story, { timeout: 300000, polling: 500 });
await new Promise((r) => setTimeout(r, 4000));
for (const P of Ps) {
  await page.evaluate((P) => window.__story.jump(P), P);
  await new Promise((r) => setTimeout(r, 2500));
  await page.evaluate(() => {
    for (const v of Object.values(window.__perf?.gpu ?? {})) {
      v.sum = 0;
      v.n = 0;
    }
  });
  await new Promise((r) => setTimeout(r, 3000));
  const g = await page.evaluate(() => {
    const o = {};
    let tot = 0;
    for (const [k, v] of Object.entries(window.__perf?.gpu ?? {})) {
      if (!v.n) continue;
      o[k] = +(v.sum / v.n).toFixed(2);
      tot += v.sum / v.n;
    }
    o.total = +tot.toFixed(2);
    return o;
  });
  console.log(`P ${P}`, JSON.stringify(g));
}
await browser.close();
