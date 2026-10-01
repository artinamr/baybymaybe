// Film stills for the site's pages: the film alone (render=1), frozen at film
// time F, settled, on the real GPU.
// usage: node still.mjs <base> <outDir> <F,F,...> [W] [H] [dpr] [settleMs]
import puppeteer from "file:///C:/Nerodyn/baybymaybe/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";

const [, , base, out, list, W = "1440", H = "900", dpr = "1.667", settle = "9000"] = process.argv;
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--no-sandbox", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu", `--window-size=${W},${H}`],
  defaultViewport: { width: +W, height: +H, deviceScaleFactor: +dpr },
});
for (const F of list.split(",")) {
  const page = await browser.newPage();
  await page.goto(`${base}/?at=${F}&freeze=1&render=1&dpr=${dpr}`, { waitUntil: "load", timeout: 120000 });
  await new Promise((r) => setTimeout(r, +settle));
  const file = `${out}/F${F.replace(/[^0-9.a-z]/gi, "_")}.png`;
  await page.screenshot({ path: file, captureBeyondViewport: false });
  console.log("saved", file);
  await page.close();
}
await browser.close();
