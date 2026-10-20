// A real wheel scroll through a stretch of the story film on the real GPU: the frame gaps (rAF) and a screencast.
// usage: node tools/qa/story-motion.mjs <base> <outDir> [from=18.4] [to=28] [W=1440] [H=900]
import puppeteer from "puppeteer-core";
import fs from "node:fs";
const [, , base, out, from = "18.4", to = "28", W = "1440", H = "900"] = process.argv;
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  protocolTimeout: 900000,
  args: ["--no-sandbox", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu", `--window-size=${W},${H}`],
  defaultViewport: { width: +W, height: +H, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
await page.goto(`${base}/story/?at=${from}&hud=1`, { waitUntil: "load", timeout: 300000 });
await page.waitForFunction(() => !!window.__story, { timeout: 300000, polling: 500 });
await new Promise((r) => setTimeout(r, 5000));
await page.evaluate(() => {
  window.__gaps = [];
  let last = performance.now();
  const loop = (t) => {
    window.__gaps.push([t - last, window.__story.state().Ps]);
    last = t;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
});
const cdp = await page.createCDPSession();
let n = 0;
cdp.on("Page.screencastFrame", async (f) => {
  n++;
  if (n % 6 === 0) fs.writeFileSync(`${out}/f${String(n).padStart(5, "0")}.jpg`, Buffer.from(f.data, "base64"));
  await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
});
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 60, maxWidth: 720, maxHeight: 450, everyNthFrame: 1 });
await page.mouse.move(+W / 2, +H / 2);
const t0 = Date.now();
for (;;) {
  const P = await page.evaluate(() => window.__story.state().Ps);
  if (P >= +to || Date.now() - t0 > 240000) break;
  await page.mouse.wheel({ deltaY: 220 });
  await new Promise((r) => setTimeout(r, 60));
}
await cdp.send("Page.stopScreencast");
const gaps = await page.evaluate(() => window.__gaps);
await browser.close();
const g = gaps.slice(5).map((x) => x[0]);
const s = g.slice().sort((a, b) => a - b);
const over = (ms) => g.filter((x) => x > ms).length;
console.log(`frames ${g.length}, median ${s[Math.floor(s.length / 2)].toFixed(1)} ms, p95 ${s[Math.floor(s.length * 0.95)].toFixed(1)} ms, over 25 ms: ${over(25)}, over 50 ms: ${over(50)}, max ${s[s.length - 1].toFixed(0)} ms`);
const worst = gaps.slice(5).filter((x) => x[0] > 40).map((x) => `${x[0].toFixed(0)}ms@P${x[1].toFixed(2)}`);
console.log("long gaps:", worst.slice(0, 20).join(" "));
const top = gaps.slice(5).map((x, i) => [x[0], x[1], i]).sort((a, b) => b[0] - a[0]).slice(0, 8);
console.log("longest:", top.map((x) => `${x[0].toFixed(0)}ms@P${x[1].toFixed(3)}(#${x[2]})`).join(" "));
