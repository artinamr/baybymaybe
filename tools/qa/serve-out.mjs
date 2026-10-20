// A static server for the export (out/), the way Pages serves it: /x/ -> /x/index.html, 404 page.
// usage: node tools/qa/serve-out.mjs [port=3100] [dir=out]  (serve a plain build: npm run build first)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const port = +(process.argv[2] || 3100);
const root = path.resolve(process.argv[3] || "out");
const types = { html: "text/html; charset=utf-8", js: "text/javascript", css: "text/css", json: "application/json", svg: "image/svg+xml", png: "image/png", jpg: "image/jpeg", webp: "image/webp", ico: "image/x-icon", woff2: "font/woff2", woff: "font/woff", txt: "text/plain; charset=utf-8", xml: "application/xml", webmanifest: "application/manifest+json", mp4: "video/mp4", wasm: "application/wasm" };
http
  .createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = path.join(root, p);
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    else if (!fs.existsSync(file) && fs.existsSync(file + ".html")) file = file + ".html";
    if (!fs.existsSync(file)) {
      res.writeHead(404, { "content-type": "text/html" });
      res.end(fs.existsSync(path.join(root, "404.html")) ? fs.readFileSync(path.join(root, "404.html")) : "not found");
      return;
    }
    const ext = path.extname(file).slice(1);
    res.writeHead(200, { "content-type": types[ext] || "application/octet-stream", "cache-control": "no-cache" });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, () => console.log(`serving ${root} on http://127.0.0.1:${port}`));
