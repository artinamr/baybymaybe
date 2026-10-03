// Live check of the deployed site (read-only: never submits the form).
import puppeteer from "file:///C:/Nerodyn/baybymaybe/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const base = "https://artinamr.github.io/baybymaybe";
const work = ["/work/", "/work/practice-website/", "/work/operations-portal/", "/work/enquiry-desk/"];
const blog = ["/blog/", "/blog/redesign-or-improve/", "/blog/website-quote-checklist/", "/blog/when-you-need-a-client-portal/", "/blog/connect-website-crm-booking/", "/blog/ai-automation-workflows/", "/blog/after-launch-ownership/"];
const paths = [
  "/", "/services/", "/services/websites/", "/services/platforms/", "/services/ai-automation/",
  ...work, "/methodology/", "/studio/", "/pricing/", "/contact/", "/faq/", "/privacy/", "/terms/",
  ...blog, "/blog/feed.xml", "/sitemap.xml", "/robots.txt", "/og.jpg", "/icon.svg", "/apple-icon.png", "/favicon.ico", "/no-such-page/",
];
const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };
function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map((m) => [m[1], m[2]]));
}
function headValue(html, tagName, key, value, field) {
  for (const tag of html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, "g"))) {
    const attrs = attributes(tag[0]);
    if (attrs[key] === value) return attrs[field];
  }
  return undefined;
}

for (const p of paths) {
  try {
    const r = await fetch(base + p, { cache: "no-store", signal: AbortSignal.timeout(30000) });
    const expected = p === "/no-such-page/" ? 404 : 200;
    check(r.status === expected, `${p}: expected HTTP ${expected}, got ${r.status}`);
    const t = r.headers.get("content-type") || "";
    const body = t.includes("html") || p === "/sitemap.xml" ? await r.text() : "";
    let extra = "";
    if (t.includes("html")) {
      const h = body;
      extra = (h.match(/<title>([^<]*)/) || [])[1] || "";
      if (p === "/") extra += ` | og:image=${headValue(h, "meta", "property", "og:image", "content")} | icons=${(h.match(/rel="(icon|apple-touch-icon)"/g) || []).length} | ld=${(h.match(/application\/ld\+json/g) || []).length}`;
      if (work.includes(p)) {
        const canonical = headValue(h, "link", "rel", "canonical", "href");
        check(canonical === base + p, `${p}: incorrect canonical ${canonical}`);
        const robots = headValue(h, "meta", "name", "robots", "content") || "";
        check(/\bnoindex\b/.test(robots), `${p}: preview is missing noindex`);
        if (p !== "/work/") {
          const slug = p.split("/")[2];
          const expectedImage = `${base}/work/${slug}.webp`;
          for (const [key, name] of [["property", "og:image"], ["name", "twitter:image"]]) {
            const image = headValue(h, "meta", key, name, "content");
            check(image === expectedImage, `${p}: ${name} should be ${expectedImage}, got ${image}`);
          }
        }
      }
    } else if (work.includes(p)) {
      check(false, `${p}: expected HTML, got ${t}`);
    }
    if (p === "/sitemap.xml") {
      const locations = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
      for (const pagePath of [...work, ...blog]) check(locations.includes(base + pagePath), `sitemap.xml: missing ${base + pagePath}`);
    }
    console.log(r.status, p, t.split(";")[0], extra);
  } catch (error) {
    failures.push(`${p}: ${error.message}`);
  }
}

const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu"], defaultViewport: { width: 1440, height: 900 } });
try {
const page = await browser.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
page.on("response", (r) => { if (r.status() >= 400) errs.push(`${r.status()} ${r.url()}`); });
page.on("request", (r) => { if (r.url().includes("formsubmit")) errs.push("UNEXPECTED FORM REQUEST"); });
const t0 = Date.now();
await page.goto(base + "/?v=" + Date.now(), { waitUntil: "load", timeout: 120000 });
await page.waitForFunction(() => document.documentElement.dataset.intro === "done", { timeout: 90000 });
console.log("intro done after", Date.now() - t0, "ms");
await new Promise((r) => setTimeout(r, 1500));
const marks = await page.evaluate(() => [...document.querySelectorAll(".marker-n")].map((e) => e.textContent).join(" "));
console.log("markers:", marks);
await page.evaluate(() => document.querySelector(".nav .ghost").click());
await new Promise((r) => setTimeout(r, 2500));
console.log("Free audit -> #contact top", await page.evaluate(() => Math.round(document.getElementById("contact").getBoundingClientRect().top)), "(stays after auto-framing window)");
const output = fs.mkdtempSync(path.join(os.tmpdir(), "nerodyn-live-"));
const screenshot = path.join(output, "live_contact.png");
await page.screenshot({ path: screenshot });
console.log("screenshot:", screenshot);
await page.keyboard.press("Tab");
console.log("first Tab:", await page.evaluate(() => document.activeElement.className + " " + document.activeElement.textContent.trim()));
console.log("errors:", errs.length ? errs : "none");
failures.push(...errs);
} catch (error) {
  failures.push(`Home browser check: ${error.message}`);
} finally {
  await browser.close();
}
if (failures.length) throw new Error(`Live checks failed:\n${failures.join("\n")}`);
