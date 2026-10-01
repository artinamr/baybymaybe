// Live check of the deployed site (read-only: never submits the form).
import puppeteer from "file:///C:/Nerodyn/baybymaybe/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";

const base = "https://artinamr.github.io/baybymaybe";
for (const p of ["/", "/methodology/", "/faq/", "/privacy/", "/terms/", "/sitemap.xml", "/robots.txt", "/og.jpg", "/icon.svg", "/apple-icon.png", "/favicon.ico", "/no-such-page/"]) {
  const r = await fetch(base + p, { cache: "no-store" });
  const t = r.headers.get("content-type") || "";
  let extra = "";
  if (t.includes("html")) {
    const h = await r.text();
    extra = (h.match(/<title>([^<]*)/) || [])[1] || "";
    if (p === "/") extra += ` | og:image=${(h.match(/og:image" content="([^"]+)/) || [])[1]} | icons=${(h.match(/rel="(icon|apple-touch-icon)"/g) || []).length} | ld=${(h.match(/application\/ld\+json/g) || []).length}`;
  }
  console.log(r.status, p, t.split(";")[0], extra);
}

const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu"], defaultViewport: { width: 1440, height: 900 } });
const page = await browser.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
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
await page.screenshot({ path: "live_contact.png" });
await page.keyboard.press("Tab");
console.log("first Tab:", await page.evaluate(() => document.activeElement.className + " " + document.activeElement.textContent.trim()));
console.log("errors:", errs.length ? errs : "none");
await browser.close();
