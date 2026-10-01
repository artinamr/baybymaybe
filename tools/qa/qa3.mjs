// QA for the new pages. The form endpoint is MOCKED — nothing reaches FormSubmit.
import puppeteer from "file:///C:/Nerodyn/baybymaybe/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";

const base = process.argv[2];
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu"] });
const log = (...a) => console.log(...a);
const errs = [];
const posted = [];
const wire = async (page) => {
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("response", (r) => { if (r.status() >= 400 && !r.url().includes("formsubmit")) errs.push(`${r.status()} ${r.url()}`); });
  await page.setRequestInterception(true);
  page.on("request", (r) => {
    if (r.url().includes("formsubmit.co")) {
      if (r.method() === "OPTIONS") return r.respond({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "POST" } });
      posted.push(JSON.parse(r.postData() || "{}"));
      return r.respond({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: "true" }) });
    }
    r.continue();
  });
};
const act = (page) => page.evaluate(() => { const e = document.activeElement; return e === document.body ? "body" : e.tagName.toLowerCase() + ":" + (e.textContent || e.name || "").trim().slice(0, 22); });

// 1. Sub-page menu on a phone
{
  const page = await browser.newPage();
  await wire(page);
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(base + "/services/websites/", { waitUntil: "networkidle0" });
  const vis = await page.evaluate(() => ({ menu: getComputedStyle(document.querySelector(".sp-menu")).display, cta: getComputedStyle(document.querySelector(".sp-cta")).display }));
  log("phone header:", JSON.stringify(vis));
  await page.tap(".sp-menu");
  await new Promise((r) => setTimeout(r, 700));
  log("menu open, focus:", await act(page), "items:", await page.evaluate(() => [...document.querySelectorAll(".menu-sheet nav a")].map((a) => a.textContent.trim() + (a.getAttribute("aria-current") ? "*" : "")).join(" | ")));
  await page.keyboard.press("Escape");
  await new Promise((r) => setTimeout(r, 300));
  log("after Esc: open=", await page.evaluate(() => document.querySelector(".menu-sheet").hasAttribute("data-open")), "focus:", await act(page));
  await page.tap(".sp-menu");
  await new Promise((r) => setTimeout(r, 700));
  await page.evaluate(() => [...document.querySelectorAll(".menu-sheet nav a")].find((a) => a.textContent.includes("Free audit")).click());
  await new Promise((r) => setTimeout(r, 900));
  log("menu Free audit -> #contact top:", await page.evaluate(() => Math.round(document.getElementById("contact").getBoundingClientRect().top)), "open=", await page.evaluate(() => document.querySelector(".menu-sheet").hasAttribute("data-open")));
  await page.close();
}

// 2. Contact page: both asks
{
  const page = await browser.newPage();
  await wire(page);
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(base + "/contact/", { waitUntil: "networkidle0" });
  log("forms on contact page:", await page.evaluate(() => document.querySelectorAll("form.audit-form").length), "#contact count:", await page.evaluate(() => document.querySelectorAll("#contact").length));
  // project: message required
  await page.evaluate(() => [...document.querySelectorAll(".af-kind-opt")].find((b) => b.textContent.includes("project")).click());
  await page.type("input[name=name]", "Test Person");
  await page.type("input[name=email]", "test@example.com");
  await page.click(".af-send");
  await new Promise((r) => setTimeout(r, 300));
  log("project, no message ->", await page.evaluate(() => [...document.querySelectorAll(".af-err")].map((e) => e.textContent).join(" | ")), "focus:", await act(page), "posts:", posted.length);
  await page.type("textarea[name=message]", "A client portal for our booking and invoicing — mocked QA.");
  await page.click(".af-send");
  await new Promise((r) => setTimeout(r, 1200));
  log("project sent:", posted.length, "subject:", posted.at(-1)?._subject, "| done:", await page.evaluate(() => document.querySelector(".af-done-line")?.textContent));
  // audit via the switch, message optional
  await page.reload({ waitUntil: "networkidle0" });
  await page.type("input[name=name]", "Audit Person");
  await page.type("input[name=email]", "audit@example.com");
  await page.type("input[name=site]", "example.com");
  await page.click(".af-send");
  await new Promise((r) => setTimeout(r, 1200));
  log("audit sent:", posted.length, "subject:", posted.at(-1)?._subject);
  await page.close();
}

// 3. Home: page nav, menu with "on this page" jumps
{
  const page = await browser.newPage();
  await wire(page);
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(base + "/", { waitUntil: "load" });
  await page.waitForFunction(() => document.documentElement.dataset.intro === "done", { timeout: 90000 });
  await new Promise((r) => setTimeout(r, 1000));
  await page.tap(".nav-menu");
  await new Promise((r) => setTimeout(r, 900));
  log("home menu:", await page.evaluate(() => [...document.querySelectorAll(".menu-sheet nav a")].map((a) => a.textContent.trim()).join(" | ")), "|| here:", await page.evaluate(() => [...document.querySelectorAll(".menu-here-links a")].map((a) => a.textContent.trim()).join(", ")));
  await page.screenshot({ path: "qa3_homemenu.png" });
  await page.evaluate(() => [...document.querySelectorAll(".menu-here-links a")].find((a) => a.textContent.includes("Why")).click());
  await new Promise((r) => setTimeout(r, 900));
  log("jump Why -> S", await page.evaluate(() => (scrollY / innerHeight).toFixed(2)), "open=", await page.evaluate(() => document.querySelector(".menu-sheet").hasAttribute("data-open")));
  await page.close();
}
log("errors:", errs.length ? errs : "none");
await browser.close();
