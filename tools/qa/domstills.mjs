// Frozen stills of the film from any build (production has no __nd): one load
// per film time with ?at=F&freeze=1, saved as PNG for pixel diffs.
// usage: node stills.mjs <base url> <outDir> <F,F,...> [W] [H] [extraQuery]
import puppeteer from "file:///C:/Nerodyn/baybymaybe/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";
import path from "node:path";

const [, , base, outDir, list, W = "1440", H = "900", extra = "", settle = "3000"] = process.argv;
fs.mkdirSync(outDir, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  userDataDir: path.join(outDir, "prof"),
  args: ["--no-sandbox", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu", `--window-size=${W},${H}`],
  defaultViewport: { width: +W, height: +H, deviceScaleFactor: 1 },
});
const errs = [];
for (const F of list.split(",")) {
  const page = await browser.newPage();
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errs.push(m.text());
  });
  await page.goto(`${base}/?at=${F}&freeze=1${extra ? "&" + extra : ""}`, { waitUntil: "load", timeout: 120000 });
  await page.waitForFunction(() => document.documentElement.dataset.intro === "done", { timeout: 90000 }).catch(() => errs.push("intro never done at " + F));
  await new Promise((r) => setTimeout(r, +settle));
  const name = path.join(outDir, `s_${String(Math.round(+F * 1000)).padStart(6, "0")}.png`);
  await page.screenshot({ path: name, type: "png" });
  console.log("saved", name);
  await page.close();
}
console.log("errors:", errs.slice(0, 8).join(" | ") || "none");
await browser.close();
