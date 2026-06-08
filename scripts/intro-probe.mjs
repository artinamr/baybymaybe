import puppeteer from "puppeteer-core";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: "new",
  args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-angle=swiftshader"],
  defaultViewport: { width: 1440, height: 900 },
});
const page = await browser.newPage();
await page.emulateMediaFeatures([
  { name: "prefers-reduced-motion", value: "no-preference" },
]);
await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded", timeout: 60000 });

const samples = [];
const start = Date.now();
for (let i = 0; i < 26; i++) {
  const s = await page.evaluate(() => {
    const ov = [...document.querySelectorAll("div")].find(
      (d) => getComputedStyle(d).zIndex === "50"
    );
    const line = document.querySelector(".reveal-line");
    const lcs = line ? getComputedStyle(line) : null;
    return {
      overlay: !!ov,
      line: !!line,
      lineTransform: lcs ? lcs.transform : null,
      lineText: line ? line.textContent : null,
    };
  });
  samples.push({ t: Date.now() - start, ...s });
  await new Promise((r) => setTimeout(r, 150));
}
for (const s of samples) console.log(JSON.stringify(s));
await browser.close();
