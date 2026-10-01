// A real wheel scroll through the shatter on a FIRST visit (fresh profile,
// real GPU, DPR 1.5): "fast" starts scrolling the moment the page starts (the
// full glass and the lens still compiling), "warm" waits until every program
// is in. Reports the longest frame gaps with the scroll position (page S) and
// when the lens / full glass arrived.
// usage: node scrollhitch.mjs <url> <fast|warm> [steps] [dy] [stepMs]
import puppeteer from "file:///C:/Nerodyn/baybymaybe/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";

const [, , url, mode = "fast", steps = "56", dy = "60", stepMs = "40"] = process.argv;
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--no-sandbox", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu", "--window-size=1440,900"],
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1.5 },
});
const page = await browser.newPage();
await page.evaluateOnNewDocument(() => {
  window.__f = [];
  let last = 0;
  const f = (t) => {
    if (last) window.__f.push([t, t - last, window.scrollY / window.innerHeight]);
    last = t;
    requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
});
await page.goto(url, { waitUntil: "load", timeout: 120000 });
await page.waitForFunction(() => document.documentElement.dataset.intro !== "wait", { timeout: 60000 });
if (mode === "warm") await page.waitForFunction(() => document.documentElement.dataset.lens === "1", { timeout: 60000 });
else await new Promise((r) => setTimeout(r, 400));
await page.mouse.move(720, 450);
const t0 = await page.evaluate(() => performance.now());
for (let i = 0; i < +steps; i++) {
  await page.mouse.wheel({ deltaY: +dy });
  await new Promise((r) => setTimeout(r, +stepMs));
}
await new Promise((r) => setTimeout(r, 3500));
const out = await page.evaluate((t0) => {
  const m = {};
  for (const e of performance.getEntriesByType("mark")) if (e.name.startsWith("nd:")) m[e.name.slice(3)] = +((e.startTime - t0) / 1000).toFixed(2);
  const fr = window.__f.filter(([t]) => t >= t0);
  const worst = fr.slice().sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t, g, s]) => `${g.toFixed(0)}ms@S${s.toFixed(2)}(+${((t - t0) / 1000).toFixed(2)}s)`);
  return { frames: fr.length, over50: fr.filter((x) => x[1] > 50).length, over100: fr.filter((x) => x[1] > 100).length, worst, endS: +(window.scrollY / window.innerHeight).toFixed(2), m };
}, t0);
console.log(`${mode}: frames ${out.frames}, >50ms ${out.over50}, >100ms ${out.over100}, end S ${out.endS}\n  worst: ${out.worst.join("  ")}\n  marks rel. to scroll start: ${JSON.stringify(out.m)}`);
await browser.close();
