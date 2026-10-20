// Candidate pane cameras at points of the film: node tools/qa/story-cands.mjs <base> <outDir> <list.json> (env W H; HUD=1 keeps the words)
import puppeteer from "puppeteer-core";
import fs from "node:fs";
const [, , base, out, jf] = process.argv;
const W = +(process.env.W || 1440);
const H = +(process.env.H || 900);
const M = W < 600;
const list = JSON.parse(fs.readFileSync(jf, "utf8"));
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  protocolTimeout: 900000,
  args: ["--no-sandbox", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu", `--window-size=${W},${H}`],
  defaultViewport: { width: W, height: H, deviceScaleFactor: M ? 2 : 1, isMobile: M, hasTouch: M },
});
const page = await browser.newPage();
if (M) await page.setUserAgent("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36");
page.on("pageerror", (e) => console.log("pageerror", e.message.slice(0, 200)));
await page.goto(`${base}/story/?at=${list[0].P}&freeze=1${process.env.HUD === "1" ? "" : "&hud=0"}`, { waitUntil: "load", timeout: 300000 });
await page.waitForFunction(() => !!window.__story, { timeout: 300000, polling: 500 });
await new Promise((r) => setTimeout(r, 3000));
for (const c of list) {
  await page.evaluate((c) => {
    window.__story.world.paneOverride = [c.A ?? null, c.B ?? null];
    window.__story.world.camOverride = c.M ? { eye: { x: c.M.eye[0], y: c.M.eye[1], z: c.M.eye[2] }, at: { x: c.M.at[0], y: c.M.at[1], z: c.M.at[2] }, fov: c.M.fov } : null;
    window.__story.jump(c.P);
  }, c);
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: `${out}/${c.name}.jpg`, type: "jpeg", quality: 84 });
}
await browser.close();
console.log("done", list.length);
