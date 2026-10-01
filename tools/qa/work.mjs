// Work interaction QA. All demo actions stay local; any network mutation is blocked.
// Run against the PLAIN production export, served as described in README.md:
// node tools/qa/work.mjs http://127.0.0.1:3100 <scratch-output-directory>
import puppeteer from "file:///C:/Nerodyn/baybymaybe/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const base = (process.argv[2] || "http://127.0.0.1:3100").replace(/\/$/, "");
const out = process.argv[3] || "C:/Users/amrae/AppData/Local/Temp/nerodyn-work-qa/interaction";
fs.mkdirSync(out, { recursive: true });
const errors = [];
const mutations = [];
const shots = [];
const results = [];
const scope = ".cs-stage .dev-screen";
const pause = (ms = 160) => new Promise((resolve) => setTimeout(resolve, ms));
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--no-sandbox", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu"],
});

async function newPage(phone = false, reduced = false) {
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  await page.setViewport(phone
    ? { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true }
    : { width: 1440, height: 900, deviceScaleFactor: 1 });
  if (reduced) await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  page.on("pageerror", (error) => errors.push(`${page.url()}: ${error.message}`));
  page.on("response", (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  // No test can reach FormSubmit or a payment/email endpoint, including an
  // endpoint introduced later. The tested controls should never make a POST.
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (request.url().includes("formsubmit.co") || !["GET", "HEAD", "OPTIONS"].includes(request.method())) {
      mutations.push(`${request.method()} ${request.url()}`);
      void request.abort("blockedbyclient");
    } else void request.continue();
  });
  return page;
}

async function go(page, slug) {
  const response = await page.goto(`${base}/work/${slug ? `${slug}/` : ""}`, { waitUntil: "networkidle0" });
  assert.equal(response.status(), 200, `Work route ${slug || "index"} should load`);
  await page.evaluate(async () => {
    await document.fonts.ready;
    document.querySelectorAll("[data-rv]").forEach((element) => { element.dataset.in = "1"; });
  });
  await pause(450);
}

async function button(page, text, selector = scope, exact = true) {
  const handle = await page.evaluateHandle((root, label, isExact) => {
    const normalized = (value) => value.replace(/\s+/g, " ").trim();
    return [...document.querySelectorAll(`${root} button`)].find((element) => {
      const value = normalized(element.textContent || "");
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return (isExact ? value === label : value.includes(label)) && rect.width > 0 && rect.height > 0 && style.visibility !== "hidden";
    });
  }, selector, text, exact);
  const element = handle.asElement();
  assert(element, `Visible button '${text}' should exist inside ${selector}`);
  return element;
}

async function click(page, text, selector = scope, exact = true) {
  const element = await button(page, text, selector, exact);
  assert.equal(await element.evaluate((node) => node.disabled), false, `'${text}' should be enabled`);
  // Explicitly settle both the document and nested frame before a physical
  // click/tap. An earlier element screenshot may have left the outer page far
  // below this control; clicking during its scroll can hit the sticky header.
  await element.evaluate((node) => node.scrollIntoView({ block: "center", inline: "center", behavior: "instant" }));
  await pause(100);
  const hit = await element.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const target = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return target === node || node.contains(target);
  });
  assert(hit, `'${text}' should receive the physical click without an overlay`);
  if (page.viewport().hasTouch) await element.tap();
  else await element.click();
  await element.dispose();
  await pause();
}

async function has(page, text, selector = scope) {
  const content = await page.$eval(selector, (element) => element.textContent);
  assert(content.includes(text), `Expected '${text}' in ${selector}`);
}

async function currentStep(page, label) {
  const text = await page.$eval(`${scope} [aria-current="step"]`, (element) => element.textContent);
  assert(text.includes(label), `Progress should show ${label}, got ${text}`);
}

async function shot(page, name, selector = ".cs-stage .dev-browser") {
  const element = await page.$(selector);
  assert(element, `Screenshot target ${selector} should exist`);
  await element.evaluate((node) => {
    const top = node.getBoundingClientRect().top + scrollY;
    window.scrollTo({ top: Math.max(0, top - 88), behavior: "instant" });
  });
  await pause(400);
  const file = path.join(out, `${name}.png`);
  // The screenshot is of a standalone demo frame; omit the site's fixed
  // chrome, which Chrome can composite across an element capture when it
  // expands the viewport. The demo's own UI remains untouched.
  await page.evaluate(() => document.querySelectorAll(".sp-nav, .skip-link").forEach((node) => { node.style.visibility = "hidden"; }));
  try { await element.screenshot({ path: file }); }
  finally { await page.evaluate(() => document.querySelectorAll(".sp-nav, .skip-link").forEach((node) => { node.style.removeProperty("visibility"); })); }
  shots.push(file);
  await element.dispose();
}

async function run(name, test) {
  try {
    await test();
    results.push({ name, ok: true });
    console.log(`PASS ${name}`);
  } catch (error) {
    results.push({ name, ok: false, error: error.message });
    console.error(`FAIL ${name}: ${error.message}`);
  }
}

async function practice(phone) {
  const page = await newPage(phone);
  const size = phone ? "phone" : "desktop";
  try {
    await go(page, "practice-website");
    assert.equal(await page.$$eval(`${scope} h1, ${scope} h2, ${scope} h3, ${scope} h4`, (nodes) => nodes.length), 0, "Demo titles should not enter the case-study heading outline");
    if (phone) {
      const menu = await page.$(`${scope} button[aria-label="Menu"]`);
      assert(menu, "Practice phone menu should exist");
      await menu.tap();
      await page.waitForFunction((selector) => document.querySelector(`${selector} button[aria-label="Menu"]`)?.getAttribute("aria-expanded") === "true", {}, scope);
      await shot(page, "practice-phone-menu");
      await click(page, "Services");
      assert.equal(await page.$eval(`${scope} button[aria-label="Menu"]`, (element) => element.getAttribute("aria-expanded")), "false", "Navigation should close the phone menu");
    } else await click(page, "Services");
    await has(page, "Tax & compliance");
    await has(page, "Annual accounts and income tax return");
    await shot(page, `practice-${size}-service`);
    await click(page, "Home");
    await click(page, "Book a 20-minute call");
    const confirm = await button(page, "Choose a topic and a time");
    assert.equal(await confirm.evaluate((element) => element.disabled), true, "Incomplete bookings should disable confirmation");
    await confirm.dispose();
    await click(page, "Switching accountants");
    await click(page, "Wed14");
    await click(page, "12:00");
    // Choosing another day must clear the previous day-specific slot.
    await click(page, "Thu15");
    const reset = await button(page, "Choose a topic and a time");
    assert.equal(await reset.evaluate((element) => element.disabled), true, "Changing day should clear the time");
    await reset.dispose();
    await click(page, "Wed14");
    await click(page, "12:00");
    await page.type(`${scope} input[placeholder="Your name"]`, "Casey Example");
    await page.type(`${scope} input[type="email"]`, "casey@example.com");
    await click(page, "Confirm Wed 14 at 12:00");
    await has(page, "You're booked, Casey.");
    await has(page, "Wed 14 October at 12:00");
    await has(page, "switching accountants");
    await has(page, "This demo sends nothing.");
    await shot(page, `practice-${size}-confirmed`);
    await click(page, "Book another");
    await has(page, "Choose a day to see open times.");
    const again = await button(page, "Choose a topic and a time");
    assert.equal(await again.evaluate((element) => element.disabled), true, "Book another should reset selection");
    await again.dispose();
  } finally { await page.close(); }
}

async function portal(phone) {
  const page = await newPage(phone);
  const size = phone ? "phone" : "desktop";
  try {
    await go(page, "operations-portal");
    await click(page, "Leaking skylight", scope, false);
    await has(page, "J-2041");
    await has(page, "Checklist");
    await has(page, "In progress");
    if (!phone) await shot(page, "portal-desktop-job");
    await click(page, "← All jobs");
    await has(page, "J-2035");
    await click(page, "Client");
    await has(page, "Q-1187");
    await click(page, "Approve quote");
    await has(page, "Quote Q-1187 approved.");
    await shot(page, `portal-${size}-quote-approved`);
    await click(page, "Team");
    const job = await button(page, "J-2035", scope, false);
    const text = await job.evaluate((element) => element.textContent);
    assert(text.includes("Approved"), "Client approval should update J-2035 on the team board");
    assert(!text.includes("Awaiting approval"), "Approved job should leave awaiting approval state");
    assert.equal(await job.evaluate((element) => element.hasAttribute("data-flash")), true, "Changed team row should carry its update cue");
    if (phone) await job.evaluate((element) => element.scrollIntoView({ block: "center", inline: "center", behavior: "instant" }));
    await job.dispose();
    if (phone) await shot(page, "portal-phone-team-updated");
    await click(page, "Client");
    await click(page, "Pay");
    const paid = await page.$eval(scope, (root) => [...root.querySelectorAll("li")].find((item) => item.textContent.includes("INV-3309"))?.textContent);
    assert(paid?.includes("Paid"), "Simulated payment should mark INV-3309 Paid");
    assert.equal(await page.$$eval(`${scope} button`, (buttons) => buttons.filter((button) => button.textContent.trim() === "Pay").length), 0, "Paid invoice should have no duplicate Pay action");
    if (phone) await page.$eval(scope, (root) => [...root.querySelectorAll("li")].find((item) => item.textContent.includes("INV-3309"))?.scrollIntoView({ block: "center", inline: "center", behavior: "instant" }));
    await shot(page, `portal-${size}-invoice-paid`);
  } finally { await page.close(); }
}

async function enquiry(phone) {
  const page = await newPage(phone);
  const size = phone ? "phone" : "desktop";
  try {
    await go(page, "enquiry-desk");
    for (const [name, subject, firstSlot] of [
      ["Sam Ellis", "Sore shoulder", "Wed 14 Oct · 4:30pm"],
      ["Alex Moana", "Can I move Thursday's appointment?", "Thu 22 Oct · 10:00am"],
    ]) {
      await click(page, name, scope, false);
      await currentStep(page, "Arrives");
      await has(page, subject);
      const back = await button(page, "Back");
      assert.equal(await back.evaluate((element) => element.disabled), true, "Back should be disabled at Arrives");
      await back.dispose();
      await click(page, "Next: Organised");
      await currentStep(page, "Organised");
      await has(page, "What the email says, organised");
      await click(page, "Next: Checked");
      await currentStep(page, "Checked");
      await has(page, firstSlot);
      await click(page, "Next: Drafted");
      await currentStep(page, "Drafted");
      const edit = `QA edit for ${name}: please call reception with any questions.`;
      await page.click(`${scope} textarea`);
      await page.keyboard.down("Control");
      await page.keyboard.press("KeyA");
      await page.keyboard.up("Control");
      await page.keyboard.type(edit);
      assert.equal(await page.$eval(`${scope} textarea`, (element) => element.value), edit, "Reception should be able to edit the draft");
      if (!phone && name === "Alex Moana") await shot(page, "enquiry-desktop-alex-edited-draft");
      await click(page, "Hand to a person");
      await has(page, "Handed to reception");
      await has(page, "Nothing was sent.");
      assert.equal(await page.$$eval(`${scope} textarea`, (elements) => elements.length), 0, "Handover should remove the editable reply");
      if (phone && name === "Sam Ellis") await shot(page, "enquiry-phone-sam-handed-over");
      await click(page, "Back");
      await currentStep(page, "Checked");
      await click(page, "Next: Drafted");
      assert.equal(await page.$eval(`${scope} textarea`, (element) => element.value), edit, "Edited draft should survive Back and handover");
      await click(page, "Approve and send");
      await currentStep(page, "Approved");
      await has(page, "Approved by Reception");
      await has(page, "sent (simulated)");
      if ((!phone && name === "Sam Ellis") || (phone && name === "Alex Moana")) await shot(page, `enquiry-${size}-${name.split(" ")[0].toLowerCase()}-approved`);
    }
    await click(page, "Jordan Lee", scope, false);
    await currentStep(page, "Arrives");
    await has(page, "Chest tightness when running");
    await click(page, "Next: Organised");
    await has(page, "Possible urgent symptom");
    await click(page, "Next: Handed to a person");
    await currentStep(page, "Handed to a person");
    await has(page, "no times were offered and no reply was drafted");
    assert.equal(await page.$$eval(`${scope} textarea`, (elements) => elements.length), 0, "Urgent enquiry must never receive a draft");
    assert.equal(await page.$$eval(`${scope} button`, (buttons) => buttons.filter((button) => button.textContent.trim() === "Approve and send").length), 0, "Urgent enquiry must not be approvable as an automatic reply");
    await shot(page, `enquiry-${size}-urgent-human`);
    await click(page, "Back");
    await currentStep(page, "Organised");
    await click(page, "Back");
    await currentStep(page, "Arrives");
  } finally { await page.close(); }
}

async function filters(phone) {
  const page = await newPage(phone);
  try {
    await go(page, "");
    for (const [label, slugs] of [
      ["All", ["practice-website", "operations-portal", "enquiry-desk"]],
      ["Websites", ["practice-website"]],
      ["Platforms", ["operations-portal"]],
      ["AI automation", ["enquiry-desk"]],
      ["All", ["practice-website", "operations-portal", "enquiry-desk"]],
    ]) {
      await click(page, label, ".wk-filter");
      await page.waitForFunction((wanted) => document.querySelector('.wk-filter button[aria-pressed="true"]')?.textContent.trim() === wanted, { timeout: 2500 }, label);
      const visible = await page.$$eval(".wk-card", (cards) => cards.filter((card) => getComputedStyle(card).display !== "none").map((card) => card.querySelector(".wk-title a").pathname.split("/").filter(Boolean).at(-1)));
      assert.deepEqual(visible, slugs, `${label} should show the intended projects`);
      assert.equal(await page.$$eval('.wk-filter button[aria-pressed="true"]', (buttons) => buttons.length), 1, "Only one work filter should be selected");
      if (!phone && label === "Platforms") await shot(page, "work-desktop-platform-filter", ".wk-grid");
    }
    if (phone) await shot(page, "work-phone-all", ".wk-grid");
  } finally { await page.close(); }
}

async function swipe(page, session, selector) {
  const point = await page.$eval(selector, (element) => {
    const top = element.getBoundingClientRect().top + scrollY;
    window.scrollTo({ top: Math.max(0, top - 100), behavior: "instant" });
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width * 0.6, from: Math.min(rect.bottom - 35, innerHeight - 45), to: Math.max(rect.top + 55, 145) };
  });
  await pause();
  const touch = (y) => [{ x: point.x, y, radiusX: 6, radiusY: 6, force: 1, id: 1 }];
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: touch(point.from) });
  for (let step = 1; step <= 12; step++) {
    await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: touch(point.from + (point.to - point.from) * step / 12) });
    await pause(22);
  }
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await pause(500);
}

try {
  for (const phone of [false, true]) {
    const size = phone ? "phone" : "desktop";
    await run(`Practice ${size}: service, booking, reset${phone ? ", menu" : ""}`, () => practice(phone));
    await run(`Portal ${size}: job/back, approval updates team, simulated pay`, () => portal(phone));
    await run(`Enquiry ${size}: all samples, edited drafts, approval/handover/back`, () => enquiry(phone));
    await run(`Work filters ${size}`, () => filters(phone));
  }
  await run("Coarse touch: top demo swipes, illustrative frames remain clipped", async () => {
    const page = await newPage(true);
    try {
      await go(page, "practice-website");
      assert.equal(await page.evaluate(() => matchMedia("(pointer: coarse)").matches), true, "Phone should emulate coarse touch");
      assert.equal(await page.$eval(scope, (element) => getComputedStyle(element).overflowY), "auto", "Top demo should retain its scrollable frame");
      const session = await page.createCDPSession();
      await swipe(page, session, scope);
      assert(await page.$eval(scope, (element) => element.scrollTop) > 40, "Real touch swipe should move the top frame's content");
      await shot(page, "practice-phone-top-swiped");
      const illustrative = ".cs-views .dev-browser .dev-screen";
      assert.equal(await page.$eval(illustrative, (element) => getComputedStyle(element).overflowY), "hidden", "Illustrative frame should be clipped on coarse touch");
      assert(await page.$eval(illustrative, (element) => element.scrollHeight > element.clientHeight), "Illustrative frame must have content to exercise clipping");
      await swipe(page, session, illustrative);
      assert.equal(await page.$eval(illustrative, (element) => element.scrollTop), 0, "Swiping an illustrative frame should not create a nested scroll");
      await shot(page, "practice-phone-illustrative-clipped", ".cs-views .dev-browser");
    } finally { await page.close(); }
  });
  await run("Reduced motion: approved portal row and enquiry log have no animation", async () => {
    const page = await newPage(false, true);
    try {
      await go(page, "operations-portal");
      await click(page, "Client");
      await click(page, "Approve quote");
      await click(page, "Team");
      assert.equal(await page.$eval(`${scope} [data-flash]`, (element) => getComputedStyle(element).animationName), "none", "Portal update flash should respect reduced motion");
      await go(page, "enquiry-desk");
      await click(page, "Next: Organised");
      const animations = await page.$$eval(`${scope} aside[aria-label="What happened"] li`, (elements) => elements.map((element) => getComputedStyle(element).animationName));
      assert(animations.length > 1 && animations.every((name) => name === "none"), "Enquiry log should respect reduced motion");
    } finally { await page.close(); }
  });
  assert.equal(mutations.length, 0, `Demo flows must stay local: ${mutations.join(", ")}`);
  assert.equal(errors.length, 0, `Browser/network errors: ${errors.join("; ")}`);
} catch (error) {
  results.push({ name: "Network/browser guard", ok: false, error: error.message });
  console.error(`FAIL ${error.message}`);
} finally {
  await browser.close();
  const report = { base, results, errors, mutations, screenshots: shots };
  fs.writeFileSync(path.join(out, "results.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`${results.filter((result) => result.ok).length}/${results.length} checks passed; ${shots.length} screenshots in ${out}`);
  if (results.some((result) => !result.ok)) process.exitCode = 1;
}
