// The contact form's failure paths, against a MOCKED endpoint (formsubmit.co is intercepted; nothing is sent).
// Validation per field, project needs a description, server error -> pre-written email, 200 with success:false,
// timeout (no answer -> error after 15 s), retry after an error, honeypot (thanks, nothing posted), success.
// usage: node formpaths.mjs <base>
import puppeteer from "file:///C:/Nerodyn/baybymaybe/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const base = process.argv[2];
if (!base) throw new Error("Pass the site's base URL.");
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox"] });
const failures = [];
const check = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"} ${msg}`); if (!ok) failures.push(msg); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let mode = "success";
let posts = 0;
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
await page.setRequestInterception(true);
page.on("request", (req) => {
  if (!req.url().includes("formsubmit")) return req.continue();
  if (req.method() === "OPTIONS") return req.respond({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "POST" } });
  posts++;
  const cors = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
  if (mode === "success") return req.respond({ status: 200, headers: cors, body: JSON.stringify({ success: "true" }) });
  if (mode === "server") return req.respond({ status: 500, headers: cors, body: JSON.stringify({ success: "false" }) });
  if (mode === "soft") return req.respond({ status: 200, headers: cors, body: JSON.stringify({ success: "false", message: "nope" }) });
  if (mode === "hang") return; // never answer
  return req.abort();
});
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));

const form = "form.audit-form";
async function fresh() {
  await page.goto(base + "/contact/", { waitUntil: "networkidle0" });
  await page.evaluate(() => document.querySelectorAll("[data-rv]").forEach((e) => (e.dataset.in = "1")));
}
const note = () => page.$eval(`${form} .af-note`, (e) => e.textContent.trim()).catch(() => "");
const status = () => page.$eval(".af-done", (e) => e.textContent.trim()).catch(() => "");
const fill = async (sel, v) => { await page.$eval(sel, (e) => (e.value = "")); if (v) await page.type(sel, v); };
const submit = () => page.click(`${form} button[type=submit]`);

// 1. validation, field by field
await fresh();
await submit();
await wait(300);
check(await page.evaluate(() => document.activeElement?.name === "name"), "empty form: focus goes to the name");
check((await page.$$eval(".af-err", (els) => els.map((e) => e.textContent))).length >= 2, "empty form: name and email errors shown");
await fill("input[name=name]", "Test Person");
await fill("input[name=email]", "not-an-email");
await submit();
await wait(300);
check(await page.evaluate(() => document.activeElement?.name === "email"), "bad email: focus goes to the email");
check(posts === 0, "nothing posted while invalid");
// project needs a description
await page.evaluate(() => [...document.querySelectorAll(".af-kind-opt")].find((b) => /project/i.test(b.textContent))?.click());
await fill("input[name=email]", "test@example.com");
await fill("textarea[name=message]", "short");
await submit();
await wait(300);
check(await page.evaluate(() => document.activeElement?.name === "message"), "project with a short message: focus goes to the message");
check(posts === 0, "nothing posted without a description");

// 2. server error -> the pre-written email
mode = "server";
await fill("textarea[name=message]", "A new website for our clinic, with online booking.");
await submit();
await wait(1500);
const n2 = await note();
check(/didn.t go through/i.test(n2), `server 500: error shown ("${n2.slice(0, 40)}…")`);
const mail = await page.$eval(".af-mail", (a) => a.getAttribute("href")).catch(() => "");
check(mail.startsWith("mailto:") && mail.includes("Test%20Person") && mail.includes("test%40example.com"), "server 500: the email fallback carries the name and address");

// 3. retry after the error -> success
mode = "success";
const before = posts;
await submit();
await wait(1500);
check(/thank you, test/i.test(await status()), "retry after an error: sent, thanked by name");
check(posts === before + 1, "retry posted exactly once");

// 4. a 200 that says success:false is still an error
await fresh();
mode = "soft";
await fill("input[name=name]", "Test Person");
await fill("input[name=email]", "test@example.com");
await submit();
await wait(1500);
check(/didn.t go through/i.test(await note()), "200 with success:false: error shown");

// 5. no answer -> error after the 15 s timeout
await fresh();
mode = "hang";
await fill("input[name=name]", "Test Person");
await fill("input[name=email]", "test@example.com");
await submit();
await wait(1000);
const sending = await page.$eval(`${form} button[type=submit]`, (b) => ({ dis: b.disabled, t: b.textContent.trim() }));
check(sending.dis && /sending/i.test(sending.t), "while waiting: the button says Sending… and is disabled");
await wait(15500);
check(/didn.t go through/i.test(await note()), "no answer: error shown after the timeout");
check(!(await page.$eval(`${form} button[type=submit]`, (b) => b.disabled)), "after the timeout the button works again");

// 6. honeypot: thanked, nothing posted
await fresh();
mode = "success";
const p6 = posts;
await fill("input[name=name]", "Bot");
await fill("input[name=email]", "bot@example.com");
await page.$eval("input[name=_honey]", (e) => (e.value = "spam"));
await submit();
await wait(800);
check(/thank you/i.test(await status()), "honeypot filled: thanked");
check(posts === p6, "honeypot filled: nothing posted");

console.log("page errors:", errs.length ? errs.join(" | ") : "none");
await browser.close();
if (failures.length || errs.length) {
  console.error(`${failures.length} failure(s)`);
  process.exit(1);
}
console.log("all form paths pass");
