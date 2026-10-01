import puppeteer from "file:///C:/Nerodyn/baybymaybe/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu"], defaultViewport: { width: 1440, height: 900 } });
const page = await browser.newPage();
await page.goto(process.argv[2], { waitUntil: "load" });
await page.waitForFunction(() => document.documentElement.dataset.intro === "done", { timeout: 60000 });
await new Promise((r) => setTimeout(r, 1000));
const info = await page.evaluate(() => {
  const f = document.querySelector(".site-foot");
  return { footTop: Math.round(f.getBoundingClientRect().top + scrollY), docMax: document.documentElement.scrollHeight - innerHeight };
});
console.log(JSON.stringify(info));
// wheel down to a few points in and around the footer, stop, and see where the page settles
for (const target of [info.footTop - 450, info.footTop - 100, info.footTop + 60, info.footTop + 200]) {
  await page.evaluate((t) => window.scrollTo(0, t - 300), target);
  await new Promise((r) => setTimeout(r, 600));
  await page.mouse.move(700, 450);
  // real wheel input so the auto-framer sees a user
  for (let y = 0; y < 300; y += 100) { await page.mouse.wheel({ deltaY: 100 }); await new Promise((r) => setTimeout(r, 30)); }
  await new Promise((r) => setTimeout(r, 700));
  const stop = await page.evaluate(() => Math.round(scrollY));
  await new Promise((r) => setTimeout(r, 3500));
  const settled = await page.evaluate(() => Math.round(scrollY));
  console.log(`stopped at ${stop - info.footTop} rel footer top -> settled at ${settled - info.footTop} (${settled === stop ? "left alone" : "GLIDED " + (settled - stop) + "px"})`);
}
await browser.close();
