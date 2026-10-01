import puppeteer from "file:///C:/Nerodyn/baybymaybe/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu"] });
for (const [w, h, mob] of [[1440, 900, false], [390, 844, true], [820, 1180, true]]) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: mob, hasTouch: mob });
  await page.goto(process.argv[2], { waitUntil: "load" });
  await page.waitForFunction(() => document.documentElement.dataset.intro === "done", { timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1000));
  await page.evaluate(() => document.querySelector(".hero .pill, .pill").click());
  await new Promise((r) => setTimeout(r, 1200));
  console.log(w + "x" + h, JSON.stringify(await page.evaluate(() => {
    const c = document.getElementById("contact");
    const m = c.querySelector(".marker, [class*=marker]");
    const nav = document.querySelector(".nav");
    const cs = getComputedStyle(document.documentElement);
    return { navH: cs.getPropertyValue("--nav-h").trim(), navBox: Math.round(nav.getBoundingClientRect().height), contact: Math.round(c.getBoundingClientRect().top), padTop: getComputedStyle(c).paddingTop, marker: m ? Math.round(m.getBoundingClientRect().top) : null, markerCls: m?.className };
  })));
  await page.close();
}
await browser.close();
