import puppeteer from "file:///C:/Nerodyn/baybymaybe/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu"] });
const errs = [];
for (const [w, h, mob] of [[390, 844, true], [1440, 900, false]]) {
  const page = await browser.newPage();
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("response", (r) => { if (r.status() >= 400) errs.push(`${r.status()} ${r.url()}`); });
  await page.setViewport({ width: w, height: h, deviceScaleFactor: mob ? 2 : 1, isMobile: mob, hasTouch: mob });
  await page.goto(process.argv[2] + "/", { waitUntil: "load" });
  await page.waitForFunction(() => document.documentElement.dataset.intro === "done", { timeout: 90000 });
  await new Promise((r) => setTimeout(r, 1200));
  if (mob) {
    await page.tap(".nav-menu");
    await new Promise((r) => setTimeout(r, 1200));
    console.log("home menu:", await page.evaluate(() => [...document.querySelectorAll(".menu-sheet nav a")].map((a) => a.textContent.trim()).join(" | ")));
    await page.screenshot({ path: "qa3_homemenu.png" });
    await page.evaluate(() => [...document.querySelectorAll(".menu-here-links a")].find((a) => a.textContent.includes("Why")).click());
    await new Promise((r) => setTimeout(r, 900));
    console.log("jump Why -> S", await page.evaluate(() => (scrollY / innerHeight).toFixed(2)), "open=", await page.evaluate(() => document.querySelector(".menu-sheet").hasAttribute("data-open")));
  } else {
    console.log("desktop nav:", await page.evaluate(() => [...document.querySelectorAll(".nav-links a")].map((a) => a.textContent.trim().replace(/(.+)\1/, "$1") + "=" + a.getAttribute("href")).join(" | ")));
    await page.screenshot({ path: "qa3_homenav.png", clip: { x: 0, y: 0, width: 1440, height: 120 } });
  }
  await page.close();
}
console.log("errors:", errs.length ? errs : "none");
await browser.close();
