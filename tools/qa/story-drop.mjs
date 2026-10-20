// Where the drop is at each P: its distance from the lens and its place on screen (sx, sy in -1..1; beyond is out of frame).
// usage: node tools/qa/story-drop.mjs <base> <P,P,...>
import puppeteer from "puppeteer-core";
const [, , base, list] = process.argv;
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu", "--window-size=1280,720"], defaultViewport: { width: 1280, height: 720 } });
const page = await browser.newPage();
await page.goto(`${base}/story/?at=16&freeze=1&hud=0`, { waitUntil: "load", timeout: 300000 });
await page.waitForFunction(() => !!window.__story, { timeout: 300000, polling: 500 });
await new Promise((r) => setTimeout(r, 3000));
for (const P of list.split(",").map(Number)) {
  const r = await page.evaluate(async (P) => {
    window.__story.jump(P);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const w = window.__story.world;
    const c = w.camera;
    const d = w.drop.mesh.position;
    const v = d.clone().project(c);
    return { P, dist: +c.position.distanceTo(d).toFixed(2), sx: +v.x.toFixed(2), sy: +v.y.toFixed(2), vis: w.drop.mesh.visible, eye: c.position.toArray().map((x) => +x.toFixed(1)), drop: d.toArray().map((x) => +x.toFixed(1)) };
  }, P);
  console.log(JSON.stringify(r));
}
await browser.close();
