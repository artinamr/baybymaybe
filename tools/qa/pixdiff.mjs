// Pixel diff of two PNG sets (same names) in a headless page: per image the
// mean abs difference, the share of pixels off by > 8/255, and the max.
// usage: node pixdiff.mjs <dirA> <dirB> [heatOutDir]
import puppeteer from "file:///C:/Nerodyn/baybymaybe/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";
import path from "node:path";

const [, , A, B, heat] = process.argv;
const names = fs.readdirSync(A).filter((n) => n.endsWith(".png") && fs.existsSync(path.join(B, n)));
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.setContent("<html><body></body></html>");
if (heat) fs.mkdirSync(heat, { recursive: true });
for (const n of names) {
  const a = "data:image/png;base64," + fs.readFileSync(path.join(A, n)).toString("base64");
  const b = "data:image/png;base64," + fs.readFileSync(path.join(B, n)).toString("base64");
  const r = await page.evaluate(
    async (a, b) => {
      const load = (s) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = s; });
      const [ia, ib] = await Promise.all([load(a), load(b)]);
      const w = ia.width, h = ia.height;
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const x = c.getContext("2d", { willReadFrequently: true });
      x.drawImage(ia, 0, 0);
      const da = x.getImageData(0, 0, w, h).data;
      x.drawImage(ib, 0, 0);
      const db = x.getImageData(0, 0, w, h).data;
      const out = x.createImageData(w, h);
      let sum = 0, big = 0, max = 0;
      for (let i = 0; i < da.length; i += 4) {
        const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]));
        sum += d;
        if (d > 8) big++;
        if (d > max) max = d;
        const v = Math.min(255, d * 8);
        out.data[i] = v; out.data[i + 1] = v; out.data[i + 2] = v; out.data[i + 3] = 255;
      }
      x.putImageData(out, 0, 0);
      return { mean: sum / (w * h), big: (100 * big) / (w * h), max, png: c.toDataURL("image/png") };
    },
    a,
    b
  );
  console.log(`${n}: mean ${r.mean.toFixed(3)}  >8: ${r.big.toFixed(3)}%  max ${r.max}`);
  if (heat) fs.writeFileSync(path.join(heat, n), Buffer.from(r.png.split(",")[1], "base64"));
}
await browser.close();
