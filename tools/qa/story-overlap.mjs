// The words come first: through the whole story film, every card in the air (a
// screen lifted off a device, a part of the new route and its card) against the
// words on screen at that moment (the chapter's kicker, title, line and fact, the
// counter, the clock), at one screen size. A card behind a title is white on
// white; the compositions keep them apart, and the film fades a card that
// passes behind the words (world.ts keepClear), so what this lists are the
// cards still showing over words (opacity), and big cards cut by the frame's
// edge (EDGE). FAIL: a card at 0.6+ opacity over more than 15% of a title or
// a line for more than a twentieth of a screen.
// usage: node tools/qa/story-overlap.mjs <base> [W=1440] [H=900] [step=0.02] [from=0] [to=29.6]
// (serve a plain build of out/ first; 390 844 for a phone)
import puppeteer from "puppeteer-core";

const [, , base = "http://127.0.0.1:3100", W = "1440", H = "900", step = "0.02", from = "0", to = "29.6"] = process.argv;
const win = process.platform === "win32";
const CHROME = process.env.CHROME || (win ? "C:/Program Files/Google/Chrome/Application/chrome.exe" : "/opt/pw-browsers/chromium");
const GL = win ? ["--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu"] : ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
const M = +W < 600;
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  protocolTimeout: 3600000,
  args: ["--no-sandbox", ...GL, `--window-size=${W},${H}`],
  defaultViewport: { width: +W, height: +H, deviceScaleFactor: 1, isMobile: M, hasTouch: M },
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("pageerror", e.message.slice(0, 200)));
await page.goto(`${base}/story/?at=${from}&freeze=1`, { waitUntil: "load", timeout: 300000 });
await page.waitForFunction(() => !!window.__story, { timeout: 300000, polling: 500 });
await new Promise((r) => setTimeout(r, 3000));
const res = await page.evaluate(
  async (from, to, step) => {
    const raf = () => new Promise((r) => requestAnimationFrame(() => r()));
    const w = window.__story.world;
    const names = ["phone", "sheet", "quote", "invoice", "pend0", "pend1", "pend2", "pend3", "pend4", "cal", "hand", "nQuote", "today"];
    const cards = [...w.allCards(), ...w.system.cards];
    const nodeNames = ["n-website", "n-reply", "n-booking", "n-quote", "n-invoice", "n-followup"];
    const label = (i) => (i < names.length ? names[i] : nodeNames[i - names.length]);
    const V3 = w.camera.position.constructor;
    const v = new V3();
    const out = [];
    const iw = innerWidth;
    const ih = innerHeight;
    for (let P = from; P <= to + 1e-6; P += step) {
      window.__story.jump(P);
      await raf();
      await raf();
      // The words' own lines (a block spans the column; its words may not).
      const texts = [];
      for (const el of document.querySelectorAll(".st-card[data-on] .st-t, .st-card[data-on] .st-l, .st-card[data-on] .st-fact, .st-card[data-on] .st-k, .st-time[data-on], .st-count")) {
        const rg = document.createRange();
        rg.selectNodeContents(el);
        let r = { left: 1e9, top: 1e9, right: -1e9, bottom: -1e9 };
        for (const b of rg.getClientRects()) {
          if (b.width < 1 || b.height < 1) continue;
          r = { left: Math.min(r.left, b.left), top: Math.min(r.top, b.top), right: Math.max(r.right, b.right), bottom: Math.max(r.bottom, b.bottom) };
        }
        const cs = getComputedStyle(el.classList.contains("st-count") ? el : el.closest(".st-card") || el);
        if (r.right > r.left && r.bottom > r.top && cs.visibility !== "hidden" && cs.display !== "none") texts.push({ n: el.className.split(" ")[0], x0: r.left, y0: r.top, x1: r.right, y1: r.bottom });
      }
      const cam = w.camera;
      cam.updateMatrixWorld();
      cards.forEach((c, i) => {
        for (let p = c.group; p; p = p.parent) if (!p.visible) return;
        if (c.faceMat.opacity < 0.15) return;
        c.group.updateMatrixWorld(true);
        // The card's quad in the camera's space, cut at the near plane, projected.
        const near = -0.06;
        const poly = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => new V3((sx * c.w) / 2, (sy * c.h) / 2, 0).applyMatrix4(c.group.matrixWorld).applyMatrix4(cam.matrixWorldInverse));
        const clipped = [];
        for (let k = 0; k < 4; k++) {
          const p = poly[k];
          const q = poly[(k + 1) % 4];
          const pin = p.z <= near;
          const qin = q.z <= near;
          if (pin) clipped.push(p);
          if (pin !== qin) clipped.push(p.clone().lerp(q, (near - p.z) / (q.z - p.z)));
        }
        if (!clipped.length) return;
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
        for (const p of clipped) {
          v.copy(p).applyMatrix4(cam.projectionMatrix);
          const px = ((v.x + 1) / 2) * iw;
          const py = ((1 - v.y) / 2) * ih;
          x0 = Math.min(x0, px);
          x1 = Math.max(x1, px);
          y0 = Math.min(y0, py);
          y1 = Math.max(y1, py);
        }
        if (x1 < 0 || y1 < 0 || x0 > iw || y0 > ih) return;
        for (const t of texts) {
          const ox = Math.min(x1, t.x1) - Math.max(x0, t.x0);
          const oy = Math.min(y1, t.y1) - Math.max(y0, t.y0);
          if (ox > 4 && oy > 4) out.push({ P: +P.toFixed(3), card: label(i), text: t.n, frac: +((ox * oy) / ((t.x1 - t.x0) * (t.y1 - t.y0))).toFixed(2), op: +c.faceMat.opacity.toFixed(2) });
        }
        const edge = x0 < -2 || y0 < -2 || x1 > iw + 2 || y1 > ih + 2;
        const area = (Math.min(x1, iw) - Math.max(x0, 0)) * (Math.min(y1, ih) - Math.max(y0, 0));
        if (edge && area > iw * ih * 0.04) out.push({ P: +P.toFixed(3), card: label(i), text: "EDGE", frac: +(area / (iw * ih)).toFixed(2), op: +c.faceMat.opacity.toFixed(2) });
      });
    }
    return out;
  },
  +from,
  +to,
  +step
);
await browser.close();
// Runs per (card, text).
const runs = new Map();
for (const r of res) {
  const key = `${r.card} / ${r.text}`;
  let list = runs.get(key);
  if (!list) runs.set(key, (list = []));
  const last = list[list.length - 1];
  if (last && r.P - last.P1 <= +step * 1.5 + 1e-6) {
    last.P1 = r.P;
    last.frac = Math.max(last.frac, r.frac);
    last.op = Math.max(last.op, r.op);
    last.n++;
  } else list.push({ P0: r.P, P1: r.P, frac: r.frac, op: r.op, n: 1 });
}
let fails = 0;
const lines = [];
for (const [key, list] of runs)
  for (const r of list) {
    const words = key.endsWith("/ st-t") || key.endsWith("/ st-l");
    const fail = words && r.op >= 0.6 && r.frac > 0.15 && r.P1 - r.P0 >= 0.05;
    if (fail) fails++;
    lines.push({ P: r.P0, s: `${fail ? "FAIL" : "    "} ${r.P0.toFixed(2)}-${r.P1.toFixed(2)}  ${key.padEnd(24)} max ${r.frac}  opacity ${r.op}` });
  }
for (const l of lines.sort((a, b) => a.P - b.P)) console.log(l.s);
console.log(fails ? `FAIL: ${fails} card(s) over the words` : "PASS: the words are clear");
process.exit(fails ? 1 : 0);
