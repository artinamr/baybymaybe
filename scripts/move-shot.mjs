import puppeteer from "puppeteer-core";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: "new",
  args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-angle=swiftshader"],
  defaultViewport: { width: 1440, height: 900 },
});
const page = await browser.newPage();
await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 1500));
// Sweep the cursor to the upper-right and let the bloom ease over.
await page.mouse.move(1250, 230, { steps: 24 });
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: "C:\\Nerodyn\\baybymaybe\\final-cursor.png" });
await browser.close();
console.log("done");
