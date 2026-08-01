/**
 * Headless-GPU-free composition proof.
 *
 * Projects the real crystal.glb mesh through the real R3F camera with a tiny
 * software rasterizer, and overlays the headline blocks — everything derived
 * from lib/heroLayout.ts, so this always reflects what actually ships.
 *
 * This exists because of gotcha #1: headless screenshots go through SwiftShader
 * and lie about material, gloss and bloom. They do NOT lie about geometry, and
 * neither does this — so use it to judge SILHOUETTE, SCALE and PLACEMENT at any
 * viewport, in a second, without a browser. Never to judge how it looks.
 *
 * usage: node scripts/compose.mjs <out.png> [W] [H]
 */
import fs from "node:fs";
import zlib from "node:zlib";

const OUT = process.argv[2] || "compose.png";
const W = +(process.argv[3] || 1512);
const H = +(process.argv[4] || 900);

// Node >= 22 strips the types; this is the same module the app ships.
const { heroLayout, WORD, CAMERA, LINES } = await import(
  new URL("../lib/heroLayout.ts", import.meta.url).href
);
const L = heroLayout(W, H);

const SCALE = L.scale;
const PX = L.posX;
const PY = L.posY;
// The rig's resting rotation (components/hero/Crystal.tsx).
const ROTY = 0.5;
const ROTX = 0.04;

const CAM_Z = CAMERA.position[2],
  FOV = CAMERA.fov;

/* ---------- GLB ---------- */
const buf = fs.readFileSync("public/crystal.glb");
const jsonLen = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.slice(20, 20 + jsonLen).toString("utf8"));
const binOff = 20 + jsonLen + 8;
const bin = buf.slice(binOff);

const COMP = { 5126: [Float32Array, 4], 5123: [Uint16Array, 2], 5125: [Uint32Array, 4] };
const NUM = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
function read(accIdx) {
  const a = gltf.accessors[accIdx];
  const bv = gltf.bufferViews[a.bufferView];
  const [Ctor, bytes] = COMP[a.componentType];
  const n = NUM[a.type];
  const off = (bv.byteOffset || 0) + (a.byteOffset || 0);
  const out = new Ctor(a.count * n);
  for (let i = 0; i < a.count * n; i++) out[i] = readAt(Ctor, off + i * bytes);
  return out;
}
function readAt(Ctor, o) {
  if (Ctor === Float32Array) return bin.readFloatLE(o);
  if (Ctor === Uint16Array) return bin.readUInt16LE(o);
  return bin.readUInt32LE(o);
}

const prim = gltf.meshes[0].primitives[0];
const POS = read(prim.attributes.POSITION);
const IDX = read(prim.indices);

/* ---------- transform ---------- */
const cy = Math.cos(ROTY), sy = Math.sin(ROTY);
const cx = Math.cos(ROTX), sx = Math.sin(ROTX);
function model(x, y, z) {
  x *= SCALE; y *= SCALE; z *= SCALE;
  let X = cy * x + sy * z, Y = y, Z = -sy * x + cy * z; // Ry
  let Y2 = cx * Y - sx * Z, Z2 = sx * Y + cx * Z;       // Rx
  return [X + PX, Y2 + PY, Z2];
}
const f = 1 / Math.tan((FOV * Math.PI) / 180 / 2);
const aspect = W / H;
function project(p) {
  const zc = p[2] - CAM_Z;
  const ndcX = (p[0] * (f / aspect)) / -zc;
  const ndcY = (p[1] * f) / -zc;
  return [(ndcX * 0.5 + 0.5) * W, (1 - (ndcY * 0.5 + 0.5)) * H, -zc];
}

/* ---------- framebuffer (paper) ---------- */
const px = new Float32Array(W * H * 3);
for (let i = 0; i < W * H; i++) {
  const u = (i % W) / W, v = 1 - Math.floor(i / W) / H;
  const t = Math.min(1, u * 0.6 + (1 - v) * 0.6);
  px[i * 3] = 0.969 + (0.929 - 0.969) * t;
  px[i * 3 + 1] = 0.965 + (0.922 - 0.965) * t;
  px[i * 3 + 2] = 0.953 + (0.906 - 0.953) * t;
}
const zb = new Float32Array(W * H).fill(1e9);

/* ---------- raster ---------- */
const LIGHT = (() => { const v = [0.5, 0.75, 0.55], m = Math.hypot(...v); return v.map((x) => x / m); })();
let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;

for (let t = 0; t < IDX.length; t += 3) {
  const w = [], s = [];
  for (let k = 0; k < 3; k++) {
    const i = IDX[t + k] * 3;
    const p = model(POS[i], POS[i + 1], POS[i + 2]);
    w.push(p); s.push(project(p));
  }
  const e1 = [w[1][0] - w[0][0], w[1][1] - w[0][1], w[1][2] - w[0][2]];
  const e2 = [w[2][0] - w[0][0], w[2][1] - w[0][1], w[2][2] - w[0][2]];
  let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
  const nl = Math.hypot(...n) || 1; n = n.map((x) => x / nl);
  const lam = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
  const rim = Math.pow(1 - Math.abs(n[2]), 3);
  // obsidian: near-black base, sharp specular-ish edge, faint indigo rim
  const g = 0.045 + 0.5 * Math.pow(lam, 6) + 0.12 * Math.pow(lam, 2);
  const col = [g + rim * 0.16, g + rim * 0.13, g + rim * 0.34];

  const bx0 = Math.max(0, Math.floor(Math.min(s[0][0], s[1][0], s[2][0])));
  const bx1 = Math.min(W - 1, Math.ceil(Math.max(s[0][0], s[1][0], s[2][0])));
  const by0 = Math.max(0, Math.floor(Math.min(s[0][1], s[1][1], s[2][1])));
  const by1 = Math.min(H - 1, Math.ceil(Math.max(s[0][1], s[1][1], s[2][1])));
  const area = (s[1][0] - s[0][0]) * (s[2][1] - s[0][1]) - (s[2][0] - s[0][0]) * (s[1][1] - s[0][1]);
  if (Math.abs(area) < 1e-9) continue;

  for (let y = by0; y <= by1; y++) {
    for (let x = bx0; x <= bx1; x++) {
      const cxp = x + 0.5, cyp = y + 0.5;
      let a = ((s[1][0] - cxp) * (s[2][1] - cyp) - (s[2][0] - cxp) * (s[1][1] - cyp)) / area;
      let b = ((s[2][0] - cxp) * (s[0][1] - cyp) - (s[0][0] - cxp) * (s[2][1] - cyp)) / area;
      let c = 1 - a - b;
      if (a < 0 || b < 0 || c < 0) continue;
      const z = a * s[0][2] + b * s[1][2] + c * s[2][2];
      const o = y * W + x;
      if (z >= zb[o]) continue;
      zb[o] = z;
      px[o * 3] = col[0]; px[o * 3 + 1] = col[1]; px[o * 3 + 2] = col[2];
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
}

/* ---------- UI overlay (measured from the live page) ---------- */
function rect(x, y, w, h, col, alpha) {
  for (let j = Math.max(0, y | 0); j < Math.min(H, (y + h) | 0); j++)
    for (let i = Math.max(0, x | 0); i < Math.min(W, (x + w) | 0); i++) {
      const o = (j * W + i) * 3;
      for (let k = 0; k < 3; k++) px[o + k] = px[o + k] * (1 - alpha) + col[k] * alpha;
    }
}
function frame(x, y, w, h, col, t = 2) {
  rect(x, y, w, t, col, 1); rect(x, y + h - t, w, t, col, 1);
  rect(x, y, t, h, col, 1); rect(x + w - t, y, t, h, col, 1);
}

const cap = WORD.cap * L.fontSize;
const boxes = [{ kind: "chrome", x: 0.04 * W, y: 0, w: W - 0.08 * W, h: 86 }];
LINES.forEach((line, i) => {
  const wid = WORD[line.word] * L.fontSize;
  boxes.push({
    kind: line.fill,
    x: line.align === "left" ? L.padX : L.right - wid,
    y: L.baseline - cap + i * L.lineHeight,
    w: wid,
    h: cap,
  });
});
for (const b of boxes) {
  const col = b.kind === "liquid" ? [0.357, 0.239, 0.941] : b.kind === "solid" ? [0.04, 0.043, 0.063] : [0.85, 0.2, 0.2];
  if (b.kind === "guide") frame(b.x, b.y, b.w, b.h, col, 1);
  else rect(b.x, b.y, b.w, b.h, col, b.kind === "chrome" ? 0.18 : 0.92);
}

/* ---------- PNG ---------- */
const raw = Buffer.alloc(H * (W * 3 + 1));
for (let y = 0; y < H; y++) {
  raw[y * (W * 3 + 1)] = 0;
  for (let x = 0; x < W * 3; x++)
    raw[y * (W * 3 + 1) + 1 + x] = Math.max(0, Math.min(255, Math.round(Math.pow(px[y * W * 3 + x], 1 / 1.0) * 255)));
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td) >>> 0);
  return Buffer.concat([len, td, crc]);
}
let TBL;
function crc32(b) {
  if (!TBL) { TBL = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; TBL[n] = c >>> 0; } }
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = TBL[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
fs.writeFileSync(OUT, Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0)),
]));

console.log(JSON.stringify({
  viewport: `${W}x${H}`,
  crystal: { x: [minX, maxX], y: [minY, maxY] },
  pctW: +(((maxX - minX) / W) * 100).toFixed(1),
  marginRight: W - maxX,
  marginTop: minY,
  typeRight: +L.right.toFixed(0),
  // Must stay positive on desktop: the channel between type and monument.
  gapTypeToStone: +(minX - L.right).toFixed(0),
}));
