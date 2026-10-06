// THE SHOWCASE PICTURES: screenshots of the three showcase sites (public/sites/),
// for their case studies: the first screen, every main page, phone views and the
// interactive features in use. PNGs into <out>/<slug>/; tools/showcase/webp.py
// turns them into the WebPs in public/work/<slug>/.
// usage: node tools/showcase/shots.mjs <base, e.g. http://127.0.0.1:3100> <out> [slug,slug]
// (serve the plain static export: npm run build, then python -m http.server 3100 --directory out)
import puppeteer from "file:///C:/Nerodyn/baybymaybe/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";

const [, , base, out, only] = process.argv;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
/** Jump (no smooth scrolling) so element `sel` sits `dy` px below the top of the screen. */
const jump = (sel, dy) => async (p) =>
  p.evaluate(
    (sel, dy) => {
      document.documentElement.style.scrollBehavior = "auto";
      const e = document.querySelector(sel);
      window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - dy, behavior: "instant" });
    },
    sel,
    dy
  );

/* What to capture. `el` screenshots one element (padded by `pad` px of the page around
   it); otherwise the viewport. `pre` runs on the page first (clicks, typing). */
const DESK = { w: 1440, h: 900, dpr: 2 };
const PHONE = { w: 390, h: 844, dpr: 3, mobile: true };
const SHOTS = {
  "butter-days": [
    { name: "home", path: "/index.html", ...DESK },
    { name: "page-menu", path: "/menu.html", ...DESK },
    { name: "page-cakes", path: "/cakes-and-catering.html", ...DESK },
    { name: "page-bakery", path: "/our-bakery.html", ...DESK },
    { name: "page-visit", path: "/visit.html", ...DESK },
    { name: "page-croissant", path: "/product-almond-croissant.html", ...DESK },
    { name: "page-sourdough", path: "/product-country-sourdough.html", ...DESK },
    { name: "page-cake", path: "/product-seasonal-celebration-cake.html", ...DESK },
    { name: "phone-home", path: "/index.html", ...PHONE },
    { name: "phone-menu", path: "/menu.html", ...PHONE, pre: jump("#menu-top", 0) },
    { name: "phone-cakes", path: "/cakes-and-catering.html", ...PHONE, pre: jump("[data-cake-planner]", 0) },
    {
      name: "f-box",
      path: "/index.html",
      ...DESK,
      el: "#saturday-box",
      pre: async (p) => {
        for (const k of ["almond-croissant", "cinnamon-knot", "pain-au-chocolat", "almond-croissant", "fruit-danish"]) {
          await p.click(`[data-pastry="${k}"]`);
          await wait(250);
        }
      },
    },
    {
      name: "f-planner",
      path: "/cakes-and-catering.html",
      ...DESK,
      el: "[data-cake-planner]",
      pre: async (p) => {
        await p.evaluate(() => {
          const r = document.querySelector("#planner-guests");
          r.value = "45";
          r.dispatchEvent(new Event("input", { bubbles: true }));
          r.dispatchEvent(new Event("change", { bubbles: true }));
        });
      },
    },
    {
      name: "f-menu",
      path: "/menu.html",
      ...DESK,
      el: "#menu-top",
      crop: 1100,
      pre: async (p) => {
        await p.click('[data-tab="tab-cakes"]');
      },
    },
    { name: "f-visit", path: "/visit.html", ...DESK, el: "#map", crop: 1000 },
  ],
  blackridge: [
    { name: "home", path: "/index.html", ...DESK },
    { name: "page-projects", path: "/projects/index.html", ...DESK },
    { name: "page-cliff", path: "/projects/cliff-house/index.html", ...DESK },
    { name: "page-folded", path: "/projects/folded-earth/index.html", ...DESK },
    { name: "page-courtyard", path: "/projects/courtyard-office/index.html", ...DESK },
    { name: "page-studio", path: "/studio/index.html", ...DESK },
    { name: "page-approach", path: "/approach/index.html", ...DESK },
    { name: "page-journal", path: "/journal/index.html", ...DESK },
    { name: "page-essay", path: "/journal/the-second-decade/index.html", ...DESK },
    { name: "page-contact", path: "/contact/index.html", ...DESK },
    { name: "phone-home", path: "/index.html", ...PHONE },
    { name: "phone-cliff", path: "/projects/cliff-house/index.html", ...PHONE },
    { name: "phone-study", path: "/index.html", ...PHONE, pre: jump(".study-frame", 170) },
    ...["site", "structure", "light"].map((st) => ({
      name: `f-study-${st}`,
      path: "/index.html",
      ...DESK,
      el: ".study-frame",
      pre: async (p) => {
        await p.evaluate(() => document.querySelector("#study").scrollIntoView());
        await wait(600);
        await p.click(`.study-btn[data-state="${st}"]`);
        await wait(2400);
      },
    })),
    { name: "f-palette", path: "/projects/cliff-house/index.html", ...DESK, el: ".pallete", pad: 0 },
    {
      // The lightbox, open on the living floor.
      name: "f-lightbox",
      path: "/projects/cliff-house/index.html",
      ...DESK,
      pre: async (p) => {
        await p.evaluate(() => document.querySelector("figure.g-wide").scrollIntoView({ block: "center" }));
        await wait(500);
        await p.click("figure.g-wide");
        await wait(1500);
      },
    },
    {
      // The A4 project sheet the page prints as (print stylesheet), first page.
      name: "f-print",
      path: "/projects/cliff-house/index.html",
      w: 820,
      h: 1160,
      dpr: 2,
      print: true,
    },
  ],
  outbound: [
    { name: "home", path: "/index.html", ...DESK },
    { name: "page-adventures", path: "/adventures.html", ...DESK },
    { name: "page-ridge", path: "/adventures/ridge-to-river.html", ...DESK },
    { name: "page-tide", path: "/adventures/after-the-tide.html", ...DESK },
    { name: "page-clouds", path: "/adventures/above-the-clouds.html", ...DESK },
    { name: "page-approach", path: "/approach.html", ...DESK },
    { name: "page-notes", path: "/field-notes/index.html", ...DESK },
    { name: "page-note", path: "/field-notes/reading-the-inversion.html", ...DESK },
    { name: "page-contact", path: "/contact.html", ...DESK },
    { name: "phone-home", path: "/index.html", ...PHONE },
    { name: "phone-trip", path: "/adventures/above-the-clouds.html", ...PHONE },
    { name: "phone-map", path: "/index.html", ...PHONE, pre: jump("#route-map", -280) },
    {
      name: "f-matcher",
      path: "/index.html",
      ...DESK,
      el: "[data-matcher]",
      pre: async (p) => {
        await p.evaluate(() => document.querySelector("[data-matcher]").scrollIntoView({ block: "center" }));
        const labels = await p.$$("[data-matcher] .fx-q");
        const pick = [2, 3, 0];
        for (let i = 0; i < labels.length; i++) {
          const opts = await labels[i].$$(".fx-opt");
          await opts[Math.min(pick[i], opts.length - 1)].click();
          await wait(300);
        }
        await wait(800);
      },
    },
    {
      name: "f-map",
      path: "/index.html",
      ...DESK,
      el: "#route-map",
      pre: async (p) => {
        await p.evaluate(() => document.querySelector("#route-map").scrollIntoView());
        await wait(500);
        await p.click('[data-map-tab="clouds"]');
        await wait(1600);
      },
    },
    {
      name: "f-filter",
      path: "/adventures.html",
      ...DESK,
      el: 'section[aria-label="Adventures list"]',
      crop: 1100,
      pre: async (p) => {
        await p.click('[data-difficulty="moderate"]');
        await wait(900);
      },
    },
    {
      name: "f-pack",
      path: "/adventures/ridge-to-river.html",
      ...DESK,
      el: "#included",
      crop: 1100,
      pre: async (p) => {
        await p.evaluate(() => document.querySelector("#included").scrollIntoView());
        for (const n of ["kit1", "kit2", "kit3", "kit5"]) {
          await p.click(`input[name="${n}"]`).catch(() => {});
          await wait(150);
        }
      },
    },
  ],
};

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--no-sandbox", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu", "--hide-scrollbars"],
});
for (const [slug, shots] of Object.entries(SHOTS)) {
  if (only && !only.split(",").includes(slug)) continue;
  fs.mkdirSync(`${out}/${slug}`, { recursive: true });
  for (const s of shots) {
    const page = await browser.newPage();
    await page.setViewport({ width: s.w, height: s.h, deviceScaleFactor: s.dpr, isMobile: !!s.mobile, hasTouch: !!s.mobile });
    await page.goto(`${base}/sites/${slug}${s.path}`, { waitUntil: "networkidle0", timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);
    // Walk the page so every scroll reveal has fired, then come back.
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.6) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 90));
      }
      window.scrollTo(0, 0);
    });
    await wait(1400);
    if (s.pre) await s.pre(page);
    if (s.print) {
      await page.emulateMediaType("print");
      await page.evaluate(() => window.scrollTo(0, 0));
    }
    await wait(1200);
    const file = `${out}/${slug}/${s.name}.png`;
    if (s.el) {
      const el = await page.$(s.el);
      if (!el) {
        console.log(`${slug}/${s.name}: no ${s.el}`);
        await page.close();
        continue;
      }
      await page.evaluate((e) => e.scrollIntoView({ block: "start" }), el);
      await wait(900);
      const b = await page.evaluate((e) => {
        const r = e.getBoundingClientRect();
        return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height };
      }, el);
      const h = s.crop ? Math.min(b.h, s.crop) : b.h;
      await page.screenshot({ path: file, clip: { x: b.x, y: b.y, width: b.w, height: h } });
    } else {
      if (!s.pre) await page.evaluate(() => window.scrollTo(0, 0));
      await wait(300);
      await page.screenshot({ path: file });
    }
    console.log(`${slug}/${s.name}`);
    await page.close();
  }
}
await browser.close();
