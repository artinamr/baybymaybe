import puppeteer from "file:///C:/Nerodyn/baybymaybe/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox"], defaultViewport: { width: 1440, height: 900 } });
const page = await browser.newPage();
for (const [u, sel] of process.argv.slice(2).map((a) => a.split("|"))) {
  await page.goto(u, { waitUntil: "load" });
  await new Promise((r) => setTimeout(r, 800));
  // click the in-page link to the section, as a reader would
  const r = await page.evaluate(async (sel) => {
    const a = document.querySelector(`a[href$="#${sel}"]`);
    a?.click();
    await new Promise((r) => setTimeout(r, 900));
    return { link: !!a, top: Math.round(document.getElementById(sel).getBoundingClientRect().top), y: Math.round(scrollY) };
  }, sel);
  console.log(u.split("/").slice(-2).join("/"), sel, JSON.stringify(r));
}
await browser.close();
