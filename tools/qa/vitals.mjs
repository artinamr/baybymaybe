// Core Web Vitals under Lighthouse-like mobile throttling, cold cache, real GPU.
// LCP and CLS from PerformanceObserver (buffered); INP approximated as the longest
// event-timing duration across a few real taps per page.
// usage: node vitals.mjs <base> [runs]
import puppeteer from "file:///C:/Nerodyn/baybymaybe/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const [, , base, runs = "2"] = process.argv;
if (!base) throw new Error("Pass the site's base URL.");
const ONLY = process.env.ONLY ? process.env.ONLY.split(",") : null;
const ALL = [
  { path: "/", taps: ["button.nav-menu", "[role=dialog] button[aria-label*=lose], [role=dialog] .menu-close"] },
  { path: "/services/websites/", taps: [".qa-q"] },
  { path: "/work/operations-portal/", taps: [".cs-stage button"] },
  { path: "/blog/redesign-or-improve/", taps: ["button.sp-menu"] },
  { path: "/contact/", taps: [".af-kind-opt:nth-child(2)", ".af-chips .chip"] },
];
const PAGES = ONLY ? ALL.filter((p) => ONLY.includes(p.path)) : ALL;
const results = [];
for (let run = 0; run < +runs; run++) {
  for (const p of PAGES) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nd-vitals-"));
    const browser = await puppeteer.launch({
      executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
      headless: true,
      userDataDir: dir,
      args: ["--no-sandbox", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu"],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 412, height: 823, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true });
    const cdp = await page.createCDPSession();
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.evaluateOnNewDocument(() => {
      window.__v = { lcp: 0, lcpEl: "", cls: 0, inp: 0, fcp: 0 };
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (e.name === "first-contentful-paint") window.__v.fcp = e.startTime;
      }).observe({ type: "paint", buffered: true });
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) {
          window.__v.lcp = e.startTime;
          window.__v.lcpEl = e.element ? `${e.element.tagName.toLowerCase()}.${String(e.element.className).split(" ")[0]}` : e.url || "";
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (!e.hadRecentInput) window.__v.cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (e.interactionId) window.__v.inp = Math.max(window.__v.inp, e.duration);
      }).observe({ type: "event", buffered: true, durationThreshold: 16 });
    });
    const t0 = Date.now();
    await page.goto(base + p.path + (p.path.includes("?") ? "&" : "?") + "v=" + Date.now(), { waitUntil: "load", timeout: 180000 });
    if (p.path === "/") await page.waitForFunction(() => document.documentElement.dataset.intro === "done", { timeout: 120000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 2500));
    for (const sel of p.taps) {
      const el = await page.$(sel);
      if (el) {
        await el.tap().catch(() => el.click().catch(() => {}));
        await new Promise((r) => setTimeout(r, 900));
      }
    }
    await new Promise((r) => setTimeout(r, 800));
    const v = await page.evaluate(() => window.__v);
    const row = { run: run + 1, page: p.path, fcp: Math.round(v.fcp), lcp: Math.round(v.lcp), lcpEl: v.lcpEl, cls: +v.cls.toFixed(3), inp: Math.round(v.inp), loadMs: Date.now() - t0 };
    results.push(row);
    console.log(JSON.stringify(row));
    await browser.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
console.log("\npage | LCP ms (median) | CLS (max) | INP ms (max)");
for (const p of PAGES) {
  const rows = results.filter((r) => r.page === p.path);
  const lcps = rows.map((r) => r.lcp).sort((a, b) => a - b);
  console.log(`${p.path} | ${lcps[Math.floor((lcps.length - 1) / 2)]} | ${Math.max(...rows.map((r) => r.cls))} | ${Math.max(...rows.map((r) => r.inp))}`);
}
