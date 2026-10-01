import puppeteer from "file:///C:/Nerodyn/baybymaybe/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu"] });
const page = await browser.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push("PAGEERR " + e.message));
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errs.push(m.type() + " " + m.text().slice(0, 300)); });
page.on("response", (r) => { if (r.status() >= 400) errs.push(`${r.status()} ${r.url()}`); });
await page.setViewport({ width: +(process.argv[3] || 1440), height: 900, isMobile: process.argv[3] === "390", hasTouch: process.argv[3] === "390" });
const t0 = Date.now();
await page.goto(process.argv[2], { waitUntil: "load" });
for (let i = 0; i < 30; i++) {
  const s = await page.evaluate(() => [document.documentElement.dataset.intro, [...performance.getEntriesByType("mark")].map((m) => m.name).join(",")]);
  if (s[0] === "done" || i % 5 === 0) console.log(((Date.now() - t0) / 1000).toFixed(1) + "s", s[0], s[1]);
  if (s[0] === "done") break;
  await new Promise((r) => setTimeout(r, 1000));
}
console.log(errs.length ? errs.join("\n") : "no errors");
await browser.close();
