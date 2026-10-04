import puppeteer from "file:///C:/Nerodyn/baybymaybe/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu"], defaultViewport: { width: 1440, height: 900 } });
const page = await browser.newPage();
await page.goto(process.argv[2], { waitUntil: "load" });
await page.waitForFunction(() => document.documentElement.dataset.intro === "done", { timeout: 60000 });
await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
await new Promise((r) => setTimeout(r, 2500));
console.log(await page.evaluate(() => {
  const out = [];
  for (const a of document.querySelectorAll(".sf-cols a, .sf-cols button, .sf-bar button, .sf-sig-mark")) {
    const b = a.getBoundingClientRect();
    if (b.bottom < 0 || b.top > innerHeight) { out.push(`${a.textContent.trim()}: offscreen`); continue; }
    const t = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
    const ok = t && (t === a || a.contains(t));
    let path = []; for (let n = t; n && path.length < 4; n = n.parentElement) path.push(n.tagName.toLowerCase() + (n.className && typeof n.className === "string" ? "." + n.className.split(" ").join(".") : ""));
    out.push(`${ok ? "ok " : "!! "}${a.textContent.trim()} -> ${path.join(" < ")} pe=${t ? getComputedStyle(t).pointerEvents : ""}`);
  }
  return out.join("\n");
}));
await browser.close();
