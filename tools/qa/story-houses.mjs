// The town's houses near a point (look-dev): node tools/qa/story-houses.mjs <base> <x> <z> [r=30]
import puppeteer from "puppeteer-core";
const [, , base, x, z, r = "30"] = process.argv;
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox", "--use-angle=d3d11", "--enable-gpu"] });
const page = await browser.newPage();
await page.goto(`${base}/story/?at=20&freeze=1&hud=0`, { waitUntil: "load", timeout: 300000 });
await page.waitForFunction(() => !!window.__story, { timeout: 300000, polling: 500 });
const list = await page.evaluate((x, z, r) => window.__story.world.town.houses.filter((h) => Math.hypot(h.x - x, h.z - z) < r).map((h) => ({ id: h.id, x: +h.x.toFixed(1), z: +h.z.toFixed(1), yaw: +h.yaw.toFixed(2), door: h.door.toArray().map((v) => +v.toFixed(1)) })), +x, +z, +r);
console.log(JSON.stringify(list));
await browser.close();
