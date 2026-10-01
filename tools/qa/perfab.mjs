// In-page A/B of GPU time per frame (timer queries, ?perf=1): at each point of
// the film, variant A and B alternate `rounds` times; medians reported.
// usage: node perfab.mjs <base url> <F,F,...> <flagA|base> <flagB> [rounds] [dpr]
import puppeteer from "file:///C:/Nerodyn/baybymaybe/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";

const [, , base, list, A, B, rounds = "3", dpr = "1.5"] = process.argv;
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--no-sandbox", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu", "--window-size=1440,900"],
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: +dpr },
});
const page = await browser.newPage();
const setFlag = (f) =>
  page.evaluate((f) => {
    const p = window.__perf;
    for (const k of ["nolens", "nomirror", "nostone", "noprepass", "noresolve", "nodil"]) p[k] = false;
    if (f !== "base") p[f] = true;
  }, f);
const sample = async () => {
  await new Promise((r) => setTimeout(r, 350));
  await page.evaluate(() => (window.__perf.gpu = {}));
  await new Promise((r) => setTimeout(r, 1500));
  return page.evaluate(() => {
    let t = 0;
    for (const a of Object.values(window.__perf.gpu || {})) t += a.sum / Math.max(1, a.n);
    return t;
  });
};
const med = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
let first = true;
const tot = { a: [], b: [] };
for (const F of list.split(",")) {
  await page.goto(`${base}/?at=${F}&perf=1`, { waitUntil: "load", timeout: 120000 });
  if (first) {
    await page.waitForFunction(() => document.documentElement.dataset.lens === "1", { timeout: 90000 }).catch(() => {});
    first = false;
  }
  await page.waitForFunction(() => document.documentElement.dataset.intro === "done", { timeout: 60000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 2500));
  const ra = [], rb = [];
  for (let i = 0; i < +rounds; i++) {
    await setFlag(A);
    ra.push(await sample());
    await setFlag(B);
    rb.push(await sample());
  }
  const ma = med(ra), mb = med(rb);
  tot.a.push(ma);
  tot.b.push(mb);
  console.log(`F ${String(F).padEnd(6)} ${A} ${ma.toFixed(2)}  ${B} ${mb.toFixed(2)}  Δ ${(mb - ma).toFixed(2)} ms   [${ra.map((x) => x.toFixed(1)).join(" ")} | ${rb.map((x) => x.toFixed(1)).join(" ")}]`);
}
const s = (a) => a.reduce((x, y) => x + y, 0) / a.length;
console.log(`MEAN ${A} ${s(tot.a).toFixed(2)}  ${B} ${s(tot.b).toFixed(2)}`);
await browser.close();
