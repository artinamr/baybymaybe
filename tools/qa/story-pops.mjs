// Nothing appears or vanishes in view: through the whole story film, the people,
// the vans, the decks, the envelopes, the crowd, the inbox pile, the route and
// every card in the air, frame to frame at a fine step. Lists anything that
// turns on or off while its place is in the frame, a card whose opacity jumps,
// and a person or card that moves too far in one step (a teleport). Occlusion
// is not known here (a person behind a wall is "in the frame"): look at the
// frames either side of each line before calling it a pop.
// usage: node tools/qa/story-pops.mjs <base> [W=1440] [H=900] [step=0.01] [from=0] [to=29.6]
// (serve a plain build of out/ first)
import puppeteer from "puppeteer-core";

const [, , base = "http://127.0.0.1:3100", W = "1440", H = "900", step = "0.01", from = "0", to = "29.6"] = process.argv;
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
await page.goto(`${base}/story/?at=${from}&freeze=1&hud=0`, { waitUntil: "load", timeout: 300000 });
await page.waitForFunction(() => !!window.__story, { timeout: 300000, polling: 500 });
await new Promise((r) => setTimeout(r, 3000));
const out = await page.evaluate(
  async (from, to, step) => {
    const raf = () => new Promise((r) => requestAnimationFrame(() => r()));
    const w = window.__story.world;
    const V3 = w.camera.position.constructor;
    const objs = {
      sam: w.sam.root,
      owner: w.owner.root,
      samPhone: w.samPhone.group,
      rival: w.rival,
      ourVan: w.ourVan,
      oldDeck: w.home.oldDeck,
      newDeck: w.home.newDeck.mesh,
      clutter: w.shop.clutter,
      mailA: w.mailA.group,
      mailB: w.mailB.group,
      mailC: w.mailC.group,
      crowd: w.crowd.mesh,
      strips: w.strips.mesh,
      route: w.system.group,
    };
    const cards = { phone: w.phoneCard, sheet: w.sheetCard, quote: w.quoteCard, invoice: w.invoiceCard, cal: w.calCard, hand: w.handCard, nQuote: w.nQuoteCard, today: w.todayCard };
    w.pend.forEach((c, i) => (cards["pend" + i] = c));
    w.system.cards.forEach((c, i) => (cards["node" + i] = c));
    const person = new Set(["sam", "owner", "samPhone"]);
    const flies = (n) => n.startsWith("mail") || n.startsWith("node");
    const vis = (o) => {
      for (let p = o; p; p = p.parent) if (!p.visible) return false;
      return true;
    };
    const v = new V3();
    const onScreen = (p, r) => {
      v.copy(p).applyMatrix4(w.camera.matrixWorldInverse);
      if (v.z > -0.05) return false;
      const d = -v.z;
      v.applyMatrix4(w.camera.projectionMatrix);
      const rr = (r / d) * w.camera.projectionMatrix.elements[5];
      return v.x > -1 - rr && v.x < 1 + rr && v.y > -1 - rr && v.y < 1 + rr;
    };
    const centre = (o) => o.getWorldPosition(new V3());
    const prev = {};
    const res = [];
    for (let P = from; P <= to + 1e-6; P += step) {
      window.__story.jump(P);
      await raf();
      await raf();
      w.camera.updateMatrixWorld();
      for (const [n, o] of Object.entries(objs)) {
        if (!o) continue;
        o.updateMatrixWorld(true);
        const c = centre(o);
        const isV = vis(o);
        const scr = onScreen(c, person.has(n) ? 1.2 : 3);
        const pv = prev[n];
        if (pv) {
          if (pv.v !== isV && (pv.s || scr)) res.push({ P, n, what: isV ? "appears" : "vanishes" });
          const far = person.has(n) ? 1.0 : 6;
          if (isV && pv.v && (pv.s || scr) && !flies(n) && c.distanceTo(pv.c) > far * (step / 0.01)) res.push({ P, n, what: `jumps ${c.distanceTo(pv.c).toFixed(1)} m` });
        }
        prev[n] = { v: isV, s: scr, c };
      }
      for (const [n, cd] of Object.entries(cards)) {
        const op = vis(cd.group) ? cd.faceMat.opacity : 0;
        cd.group.updateMatrixWorld(true);
        const c = centre(cd.group);
        const scr = onScreen(c, Math.max(cd.w, cd.h) / 2);
        const pv = prev["c:" + n];
        if (pv && (pv.s || scr) && Math.abs(op - pv.op) > 0.45) res.push({ P, n, what: `opacity ${pv.op.toFixed(2)} -> ${op.toFixed(2)}` });
        if (pv && (pv.s || scr) && op > 0.3 && pv.op > 0.3 && !flies(n) && c.distanceTo(pv.c) > 2.5 * (step / 0.01)) res.push({ P, n, what: `jumps ${c.distanceTo(pv.c).toFixed(1)} m` });
        prev["c:" + n] = { op, s: scr, c };
      }
    }
    return res;
  },
  +from,
  +to,
  +step
);
await browser.close();
for (const r of out) console.log(`${r.P.toFixed(3)}  ${r.n.padEnd(10)} ${r.what}`);
console.log(`${out.length} line(s): check each in a still either side (occlusion is not known here).`);
