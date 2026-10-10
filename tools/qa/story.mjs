// The story (/story/), used: the door, the film starting, scroll, settling on a
// composed frame, the keys, dropping a customer in, a part's label on hover,
// play and pause, the end on paper; then no WebGL, "Rather read it?", reduced
// motion, and the transcript in the HTML. PASS/FAIL per check; exits 1 on a FAIL.
// usage: node tools/qa/story.mjs <base>   (serve a plain build of out/ first)
// The browser: CHROME=<path>; on Windows the real GPU (ANGLE/D3D11), elsewhere
// SwiftShader (slow: the film draws about a frame a second, so allow minutes).
import puppeteer from "puppeteer-core";

const B = process.argv[2] || "http://127.0.0.1:3100";
const win = process.platform === "win32";
const CHROME = process.env.CHROME || (win ? "C:/Program Files/Google/Chrome/Application/chrome.exe" : "/opt/pw-browsers/chromium");
const GL = win ? ["--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu"] : ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const ok = (c, m) => {
  if (!c) fails++;
  console.log(c ? "PASS" : "FAIL", m);
};
const launch = (extra = []) => puppeteer.launch({ executablePath: CHROME, headless: true, protocolTimeout: 600000, args: ["--no-sandbox", ...extra] });
const watch = (page, errs) => {
  page.on("pageerror", (e) => errs.push("pageerror: " + e.message.slice(0, 300)));
  page.on("console", (m) => {
    if (m.type() === "error" && !/webpack-hmr|WebSocket|favicon/.test(m.text())) errs.push("console: " + m.text().slice(0, 300));
  });
};

// 1. The film, used.
{
  const browser = await launch(GL);
  const page = await browser.newPage();
  const errs = [];
  watch(page, errs);
  await page.setViewport({ width: 1280, height: 800 });
  const st = () => page.evaluate(() => window.__story?.state());
  const attr = (sel, a) => page.evaluate((sel, a) => document.querySelector(sel)?.getAttribute(a) ?? null, sel, a);
  await page.goto(`${B}/story/`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.documentElement.hasAttribute("data-st"), { timeout: 60000 });
  ok((await attr("html", "data-st")) === "door", "opens on the door");
  ok((await page.$eval("h1", (e) => e.textContent.trim())) === "The quiet leak", "the door's title");
  ok((await page.$$(".st-door .st-btn")).length === 2, "two ways in: with sound, in silence");
  const t0 = Date.now();
  await page.waitForFunction(() => !!window.__story, { timeout: 300000, polling: 500 });
  console.log(`  (film ready after ${Date.now() - t0} ms)`);
  await page.click(".st-btn:not(.st-btn-pri)");
  await page.waitForFunction(() => document.documentElement.getAttribute("data-st") === "film", { timeout: 60000 });
  ok(true, "starts in silence");
  ok((await st()).sound === false, "the sound is off");

  await page.mouse.move(700, 400);
  for (let i = 0; i < 10; i++) {
    await page.mouse.wheel({ deltaY: 220 });
    await sleep(120);
  }
  await sleep(2500);
  const s1 = await st();
  ok(s1.P > 0.5, `the wheel moves the film (P ${s1.P.toFixed(2)})`);
  await sleep(6000);
  const s2 = await st();
  const rests = await page.evaluate(() => window.__story.state().rests);
  ok(!rests || rests.some((r) => Math.abs(r - s2.P) < 0.03), `left alone, it settles on a composed frame (P ${s2.P.toFixed(3)})`);

  await page.keyboard.press("ArrowDown");
  await sleep(4500);
  const s3 = await st();
  ok(s3.P > s2.P + 0.2, `the down arrow goes on to the next frame (P ${s3.P.toFixed(3)})`);

  await page.evaluate(() => window.__story.jump(3.0));
  await sleep(2500);
  const before = (await st()).yours;
  await page.click(".st-drop");
  await sleep(1500);
  const after = (await st()).yours;
  ok(after > before, `"Drop one in" adds a customer of yours (${before} → ${after})`);

  const xy = await page.evaluate(() => {
    const w = window.__story.world;
    const part = w.old.rig.parts.find((p) => p.id === "gate");
    const c = part.box.getCenter(part.box.min.clone());
    c.project(w.camera);
    return { x: (c.x * 0.5 + 0.5) * innerWidth, y: (-c.y * 0.5 + 0.5) * innerHeight };
  });
  await page.mouse.move(xy.x, xy.y);
  await sleep(3000);
  const tip = await page.$eval(".st-tip", (e) => (e.hasAttribute("data-on") ? e.textContent.trim() : ""));
  ok(tip.length > 10, `hovering the gate says what it is ("${tip.slice(0, 50)}…")`);

  await page.click(".st-play");
  await sleep(9000);
  const s4 = await st();
  ok(s4.playing && s4.P > 3.1, `play runs the film (P ${s4.P.toFixed(2)})`);
  await page.keyboard.press("k");
  await sleep(600);
  ok((await st()).playing === false, "K pauses it");

  await page.keyboard.press("End");
  await sleep(3500);
  ok((await attr("html", "data-st-paper")) !== null, "the end turns to paper");
  ok((await page.$eval(".st-end h2", (e) => e.textContent)).includes("Find your leaks"), "it ends on the offer");
  ok(errs.length === 0, `no errors${errs.length ? ": " + errs.slice(0, 3).join(" | ") : ""}`);
  await browser.close();
}

// 2. No WebGL: it says so, and the story is there to read.
{
  const browser = await launch(["--disable-gpu", "--disable-webgl", "--disable-3d-apis"]);
  const page = await browser.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(`${B}/story/`, { waitUntil: "networkidle0", timeout: 120000 });
  await sleep(1500);
  const r = await page.evaluate(() => ({ st: document.documentElement.getAttribute("data-st"), sorry: !!document.querySelector(".st-door-sorry"), tr: !!document.getElementById("transcript") }));
  ok(r.st === "nofilm" && r.sorry && r.tr, `no WebGL: a plain message and the transcript (${JSON.stringify(r)})`);
  ok(errs.length === 0, `no WebGL: no errors${errs.length ? ": " + errs[0] : ""}`);
  await browser.close();
}

// 3. "Rather read it?", reduced motion, and the words in the HTML.
{
  const browser = await launch(GL);
  const page = await browser.newPage();
  const errs = [];
  watch(page, errs);
  await page.setViewport({ width: 1280, height: 800 });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.goto(`${B}/story/`, { waitUntil: "domcontentloaded" });
  // (Hydrated: the page has said which phase it is in.)
  await page.waitForFunction(() => document.documentElement.hasAttribute("data-st") && !!document.querySelector(".st-door-read"), { timeout: 60000 });
  ok((await page.evaluate(() => document.documentElement.hasAttribute("data-reduced"))) === true, "reduced motion is honoured");
  await sleep(1200);
  await page.click(".st-door-read");
  await sleep(1500);
  const r = await page.evaluate(() => ({ st: document.documentElement.getAttribute("data-st"), top: Math.round(document.getElementById("transcript").getBoundingClientRect().top) }));
  ok(r.st === "read" && Math.abs(r.top) < 200, `"Rather read it?" goes to the words (${JSON.stringify(r)})`);
  ok(errs.length === 0, `reading: no errors${errs.length ? ": " + errs[0] : ""}`);
  await browser.close();

  const html = await (await fetch(`${B}/story/`)).text();
  const h3 = (html.match(/<h3/g) || []).length;
  ok(h3 >= 12, `the transcript is in the HTML (${h3} chapter headings)`);
  ok(html.includes("blog.google/products/admanager/the-need-for-mobile-speed") && html.includes("hbr.org/2011/03/the-short-life-of-online-sales-leads"), "both sources are cited in the HTML");
  ok(!/\u2014/.test(html.replace(/<script[\s\S]*?<\/script>/g, "")), "no em dashes in what a reader sees");
}

console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
