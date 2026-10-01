// prefers-reduced-motion: the page must still load, reveal and jump.
import puppeteer from "file:///C:/Nerodyn/baybymaybe/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu"], defaultViewport: { width: 1440, height: 900 } });
const page = await browser.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
const t0 = Date.now();
await page.goto(process.argv[2], { waitUntil: "load" });
await page.waitForFunction(() => document.documentElement.dataset.intro === "done", { timeout: 60000 }).catch(() => console.log("intro never reached done:", document?.documentElement?.dataset?.intro));
console.log("intro done after", Date.now() - t0, "ms; reduced attr:", await page.evaluate(() => document.documentElement.hasAttribute("data-reduced")), "loader display:", await page.evaluate(() => getComputedStyle(document.getElementById("loader")).display));
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: "reduced_hero.png" });
// nav jumps + audit
for (const label of ["What we build", "Why Nerodyn"]) {
  await page.evaluate((l) => [...document.querySelectorAll(".nav-link")].find((a) => a.textContent.includes(l)).click(), label);
  await new Promise((r) => setTimeout(r, 1500));
  console.log(label, "-> S", await page.evaluate(() => (scrollY / innerHeight).toFixed(2)));
}
await page.screenshot({ path: "reduced_why.png" });
await page.evaluate(() => document.querySelector(".nav .ghost").click());
await new Promise((r) => setTimeout(r, 1200));
console.log("audit -> contact top", await page.evaluate(() => Math.round(document.getElementById("contact").getBoundingClientRect().top)));
// plain wheel scrolling still moves the film
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise((r) => setTimeout(r, 500));
await page.mouse.move(700, 450);
for (let i = 0; i < 20; i++) { await page.mouse.wheel({ deltaY: 120 }); await new Promise((r) => setTimeout(r, 40)); }
await new Promise((r) => setTimeout(r, 1500));
console.log("after wheel: S", await page.evaluate(() => (scrollY / innerHeight).toFixed(2)));
await page.screenshot({ path: "reduced_wheel.png" });
console.log("errors:", errs.length ? errs : "none");
await browser.close();
