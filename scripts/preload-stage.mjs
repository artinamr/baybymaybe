// After `next build` (the static export): preload the 3D stage's chunk from
// the home page's <head>. StageCanvas is a client-only dynamic import, so the
// browser only asked for it after hydration — on the live site ~0.7 s after
// everything else, and the stone waits for it. Found by the glass's GLSL,
// which lives only in that chunk; nothing is changed if it is not found.
import fs from "node:fs";
import path from "node:path";

const out = path.resolve("out");
const dir = path.join(out, "_next", "static", "chunks");
const html = path.join(out, "index.html");
const MARKER = "obsNoise";

if (!fs.existsSync(dir) || !fs.existsSync(html)) {
  console.log("preload-stage: no static export found, skipped");
  process.exit(0);
}
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
let page = fs.readFileSync(html, "utf8");
const chunks = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".js") && fs.readFileSync(path.join(dir, f), "utf8").includes(MARKER))
  // (Only chunks the page does not already load.)
  .filter((f) => !page.includes(`/chunks/${f}"`));
if (!chunks.length) {
  console.log("preload-stage: the stage chunk was not found, or is already loaded — nothing added");
  process.exit(0);
}
const links = chunks.map((f) => `<link rel="preload" as="script" href="${base}/_next/static/chunks/${f}"/>`).join("");
const at = page.indexOf('<meta name="viewport"');
page = at >= 0 ? page.slice(0, at) + links + page.slice(at) : page.replace("<head>", `<head>${links}`);
fs.writeFileSync(html, page);
console.log(`preload-stage: ${chunks.join(", ")}`);
