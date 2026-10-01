// Functional QA of round 16 on the real GPU. The form endpoint is MOCKED
// (request interception) — nothing is ever sent to FormSubmit.
// usage: node qa2.mjs <base url> <outDir>
import puppeteer from "file:///C:/Nerodyn/baybymaybe/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";

const [, , base, out] = process.argv;
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--no-sandbox", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu", "--window-size=1440,900"],
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
});
const log = (...a) => console.log(...a);
let mode = "ok";
const posted = [];
const page = await browser.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
await page.setRequestInterception(true);
page.on("request", (r) => {
  if (r.url().includes("formsubmit.co")) {
    posted.push({ url: r.url(), body: r.postData() });
    if (r.method() === "OPTIONS") return r.respond({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "POST" } });
    return r.respond({
      status: mode === "ok" ? 200 : 500,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(mode === "ok" ? { success: "true", message: "The form was submitted successfully." } : { success: "false" }),
    });
  }
  r.continue();
});
await page.goto(base + "/", { waitUntil: "load", timeout: 120000 });
await page.waitForFunction(() => document.documentElement.dataset.intro === "done", { timeout: 60000 });
await new Promise((r) => setTimeout(r, 1500));

const S = () => page.evaluate(() => window.scrollY / window.innerHeight);
const contactTop = () => page.evaluate(() => Math.round(document.getElementById("contact").getBoundingClientRect().top));

// 1. Nav jump: instant (sample the scroll 60 ms after the click).
for (const label of ["What we build", "Work", "Why Nerodyn", "How we work"]) {
  const t0 = await S();
  await page.evaluate((l) => [...document.querySelectorAll(".nav-link")].find((a) => a.textContent.includes(l)).click(), label);
  await new Promise((r) => setTimeout(r, 60));
  const t1 = await S();
  await new Promise((r) => setTimeout(r, 900));
  const t2 = await S();
  log(`nav "${label}": ${t0.toFixed(2)} -> after 60ms ${t1.toFixed(2)} -> settled ${t2.toFixed(2)} ${Math.abs(t1 - t2) < 0.02 ? "INSTANT" : "GLIDE?"}`);
}
await page.screenshot({ path: `${out}/after_nav.jpg`, type: "jpeg", quality: 75 });

// 2. Free audit (nav pill) -> the form under the nav.
await page.evaluate(() => document.querySelector(".nav .ghost").click());
await new Promise((r) => setTimeout(r, 400));
log("nav Free audit -> #contact top at", await contactTop(), "px (nav-h 76 expected)");

// 3. Back to top.
await page.evaluate(() => [...document.querySelectorAll(".f-col button")].find((b) => b.textContent.includes("Back to the top")).click());
await new Promise((r) => setTimeout(r, 300));
log("back to top -> S", (await S()).toFixed(3));

// 4. Hero "Get a free audit".
await page.evaluate(() => [...document.querySelectorAll(".pill")].find((b) => b.textContent.includes("Get a free audit")).click());
await new Promise((r) => setTimeout(r, 400));
log("hero Get a free audit -> #contact top at", await contactTop());

// 5. Form: empty submit -> errors, no post.
await page.evaluate(() => document.querySelector("#contact form button[type=submit]").click());
await new Promise((r) => setTimeout(r, 300));
log("empty submit errors:", await page.evaluate(() => [...document.querySelectorAll("#contact .af-err")].map((e) => e.textContent)), "posts:", posted.length);
await page.screenshot({ path: `${out}/form_errors.jpg`, type: "jpeg", quality: 80 });

// 6. Fill and submit (mock OK).
await page.click("#contact .chip");
await page.type("#contact input[name=name]", "Test Person");
await page.type("#contact input[name=email]", "test@example.com");
await page.type("#contact input[name=site]", "example.com");
await page.type("#contact textarea[name=message]", "QA run — mocked endpoint.");
await page.evaluate(() => document.querySelector("#contact form button[type=submit]").click());
await page.waitForSelector("#contact .af-done", { timeout: 10000 }).catch(() => log("no success state!"));
const p = posted.filter((x) => x.body);
log("posted to:", p[p.length - 1]?.url, "\n  body:", p[p.length - 1]?.body);
log("success text:", await page.evaluate(() => document.querySelector("#contact .af-done")?.innerText.replace(/\s+/g, " ")));
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: `${out}/form_sent.jpg`, type: "jpeg", quality: 80 });

// 7. Send another -> fill -> server error -> the mailto fallback.
mode = "fail";
await page.evaluate(() => [...document.querySelectorAll("#contact button")].find((b) => b.textContent.includes("Send another")).click());
await new Promise((r) => setTimeout(r, 300));
await page.type("#contact input[name=name]", "Test Person");
await page.type("#contact input[name=email]", "test@example.com");
await page.evaluate(() => document.querySelector("#contact form button[type=submit]").click());
await page.waitForFunction(() => document.querySelector("#contact form")?.dataset.state === "error", { timeout: 10000 }).catch(() => log("no error state!"));
log("error note:", await page.evaluate(() => document.querySelector("#contact .af-note")?.innerText), "\n  mailto:", await page.evaluate(() => document.querySelector("#contact .af-mail")?.getAttribute("href")?.slice(0, 120)));
await page.screenshot({ path: `${out}/form_error.jpg`, type: "jpeg", quality: 80 });

log("page errors:", errs.slice(0, 6).join(" | ") || "none");
await browser.close();
