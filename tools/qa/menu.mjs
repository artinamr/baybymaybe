import puppeteer from "file:///C:/Nerodyn/baybymaybe/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu"], defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true } });
const page = await browser.newPage();
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
await page.goto(process.argv[2], { waitUntil: "load" });
await page.waitForFunction(() => document.documentElement.dataset.intro === "done", { timeout: 60000 });
await new Promise((r) => setTimeout(r, 1200));
const act = () => page.evaluate(() => { const e = document.activeElement; return e === document.body ? "body" : e.tagName.toLowerCase() + ":" + e.textContent.trim().slice(0, 20); });
console.log("inert closed:", await page.evaluate(() => document.querySelector(".menu-sheet").inert));
await page.tap(".nav-menu");
await new Promise((r) => setTimeout(r, 700));
console.log("open; focus:", await act(), "inert:", await page.evaluate(() => document.querySelector(".menu-sheet").inert));
await page.screenshot({ path: "menu_open.png" });
const seq = [];
for (let i = 0; i < 11; i++) { await page.keyboard.press("Tab"); seq.push(await act()); }
console.log("tab x11:", seq.join(" | "));
await page.keyboard.down("Shift"); await page.keyboard.press("Tab"); await page.keyboard.up("Shift");
console.log("shift-tab:", await act());
await page.keyboard.press("Escape");
await new Promise((r) => setTimeout(r, 400));
console.log("after Esc: open=", await page.evaluate(() => document.querySelector(".menu-sheet").hasAttribute("data-open")), "focus:", await act());
// a link still works: open, tap 03 Work
await page.tap(".nav-menu"); await new Promise((r) => setTimeout(r, 700));
await page.evaluate(() => [...document.querySelectorAll(".menu-sheet nav a")].find((a) => a.textContent.includes("Work")).click());
await new Promise((r) => setTimeout(r, 900));
console.log("after Work link: S=", await page.evaluate(() => (scrollY / innerHeight).toFixed(2)), "open=", await page.evaluate(() => document.querySelector(".menu-sheet").hasAttribute("data-open")), "focus:", await act());
console.log("errors:", errs.length ? errs : "none");
await browser.close();
