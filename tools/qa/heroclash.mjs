// Hero on phones: do the description, the actions and the counter collide?
import puppeteer from "file:///C:/Nerodyn/baybymaybe/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const base = process.argv[2];
const sizes = (process.argv[3] || "320x568,320x693,360x640,375x667,375x812,390x844,412x915,430x932").split(",").map((s) => s.split("x").map(Number));
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu"] });
for (const [w, h] of sizes) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(base + "/", { waitUntil: "load" });
  await page.waitForFunction(() => document.documentElement.dataset.intro === "done", { timeout: 90000 });
  await new Promise((r) => setTimeout(r, 2000));
  const r = await page.evaluate(() => {
    const box = (sel) => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return { t: b.top, b: b.bottom, l: b.left, r: b.right }; };
    const desc = box(".hero-desc"), ctas = box(".hero-ctas"), ctr = box(".index-counter"), h1 = box(".hero-h1"), kick = box(".hero-kicker, .hero .marker, .hero-eyebrow");
    const hit = (a, b) => a && b && a.t < b.b - 1 && b.t < a.b - 1 && a.l < b.r - 1 && b.l < a.r - 1;
    return { desc, ctas, ctr, gapDescCta: desc && ctas ? Math.round(ctas.t - desc.b) : null, descCta: hit(desc, ctas), ctaCtr: hit(ctas, ctr), ctaBottom: ctas ? Math.round(innerHeight - ctas.b) : null };
  });
  const bad = r.descCta || r.ctaCtr || r.ctaBottom < 8;
  console.log(`${bad ? "!!" : "ok"} ${w}x${h}: desc→cta gap ${r.gapDescCta}px, cta bottom margin ${r.ctaBottom}px${r.descCta ? " DESC×CTA" : ""}${r.ctaCtr ? " CTA×COUNTER" : ""}  desc ${Math.round(r.desc.t)}–${Math.round(r.desc.b)} cta ${Math.round(r.ctas.t)}–${Math.round(r.ctas.b)} ctr ${r.ctr ? Math.round(r.ctr.t) + "–" + Math.round(r.ctr.b) + " x" + Math.round(r.ctr.l) : "-"}`);
  await page.screenshot({ path: `clash_${w}x${h}.png` });
  await page.close();
}
await browser.close();
