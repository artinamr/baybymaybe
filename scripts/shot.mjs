import puppeteer from "puppeteer-core";
import os from "node:os";
import path from "node:path";
import fsSync from "node:fs";

// Edge first, Chrome as fallback — whichever is installed.
const CANDIDATES = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
];
const EDGE =
  process.env.SHOT_BROWSER ||
  CANDIDATES.find((p) => fsSync.existsSync(p)) ||
  CANDIDATES[0];
const URL = process.argv[2] || "http://localhost:3000";
const OUT = process.argv[3] || "C:\\Nerodyn\\baybymaybe\\preview3.png";
const W = Number(process.argv[4]) || 1440;
const H = Number(process.argv[5]) || 900;
const WAIT = Number(process.argv[6]) || 4500;
const UNTIL = process.argv[7] || "networkidle2";

// Dedicated profile dir so we never collide with the user's running Edge
// (a shared profile makes the new process hand off and exit → launch fails).
const USER_DATA = path.join(os.tmpdir(), `nerodyn-shot-${process.pid}`);

const browser = await puppeteer.launch({
  executablePath: EDGE,
  // puppeteer-core >= 23 removed headless:"new" — passing it yields a browser
  // that exits immediately ("Failed to launch… Code: 0"), which looks exactly
  // like the Edge profile-handoff failure and wasted real time. Use `true`.
  headless: true,
  // Force the websocket transport: the default DevTools *pipe* transport is
  // what actually breaks the handshake on this machine.
  pipe: false,
  userDataDir: USER_DATA,
  args: [
    "--no-sandbox",
    "--enable-unsafe-swiftshader",
    "--use-angle=swiftshader",
    "--disable-extensions",
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
