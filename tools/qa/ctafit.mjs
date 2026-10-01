// Hero actions on narrow phones: do they fit, and is the document its own width?
import puppeteer from "file:///C:/Nerodyn/baybymaybe/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const base = process.argv[2];
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu"] });
for (const [w, h] of [[320, 568], [340, 720], [349, 740], [350, 740], [360, 780], [375, 812], [389, 840], [390, 844]]) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(base + "/", { waitUntil: "load" });
  await page.waitForFunction(() => document.documentElement.dataset.intro === "done", { timeout: 90000 });
  await new Promise((r) => setTimeout(r, 1800));
  const r = await page.evaluate(() => {
    const row = document.querySelector(".hero-ctas");
    const [a, b] = row.querySelectorAll(".pill, .ghost");
    const menu = document.querySelector(".nav-menu").getBoundingClientRect();
    const lbl = (e) => [...e.querySelectorAll("span")].filter((s) => s.offsetParent && !s.children.length && s.textContent.trim().length > 2).map((s) => s.textContent.trim()).join("/");
    return {
      docW: document.documentElement.scrollWidth, vw: innerWidth,
      pill: `${Math.round(a.getBoundingClientRect().left)}–${Math.round(a.getBoundingClientRect().right)}`,
      ghost: `${Math.round(b.getBoundingClientRect().left)}–${Math.round(b.getBoundingClientRect().right)} "${lbl(b)}"`,
      clipped: [a, b].some((e) => e.scrollWidth > e.clientWidth + 1),
      menuR: Math.round(menu.right),
    };
  });
  const ok = r.docW === r.vw && !r.clipped && r.menuR <= r.vw;
  console.log(`${ok ? "ok" : "!!"} ${w}: doc=${r.docW} pill ${r.pill} ghost ${r.ghost} menuR=${r.menuR}${r.clipped ? " TEXT CLIPPED" : ""}`);
  if ([320, 360].includes(w)) await page.screenshot({ path: `cta_${w}.png` });
  await page.close();
}
await browser.close();
