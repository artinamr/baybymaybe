import puppeteer from "puppeteer-core";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = process.argv[2] || "http://localhost:3000";
const OUT = process.argv[3] || "C:\\Nerodyn\\baybymaybe\\preview3.png";
const W = Number(process.argv[4]) || 1440;
const H = Number(process.argv[5]) || 900;
const WAIT = Number(process.argv[6]) || 4500;
const UNTIL = process.argv[7] || "networkidle2";

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: "new",
  args: [
    "--no-sandbox",
    "--enable-unsafe-swiftshader",
    "--use-angle=swiftshader",
    `--window-size=${W},${H}`,
  ],
  defaultViewport: { width: W, height: H },
});

const page = await browser.newPage();
await page.emulateMediaFeatures([
  { name: "prefers-reduced-motion", value: "no-preference" },
]);
const logs = [];
page.on("console", (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));
page.on("requestfailed", (r) =>
  logs.push(`[reqfail] ${r.url()} ${r.failure()?.errorText}`)
);

await page.goto(URL, { waitUntil: UNTIL, timeout: 60000 });
await new Promise((r) => setTimeout(r, WAIT)); // let the intro play

const canvasInfo = await page.evaluate(() => {
  const c = document.querySelector("canvas");
  if (!c) return { canvas: false };
  const gl = c.getContext("webgl2") || c.getContext("webgl");
  return {
    canvas: true,
    w: c.width,
    h: c.height,
    gl: !!gl,
    renderer: gl ? gl.getParameter(gl.VERSION) : null,
  };
});

await page.screenshot({ path: OUT });
console.log("CANVAS:", JSON.stringify(canvasInfo));
console.log("LOGS:\n" + (logs.join("\n") || "(none)"));
await browser.close();
