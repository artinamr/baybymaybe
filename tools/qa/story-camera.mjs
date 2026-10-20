// The story's camera, checked against the film's geometry, without a browser.
//
// Builds the world exactly as the film does (components/story/film/world.ts:
// the town, the customer's house, the workshop), puts every solid triangle in
// a BVH (instances expanded), then flies the film's own smoothed camera
// (camera.ts cameraSmooth) through the whole film and reports, in film time P:
//   - CLEARANCE  how close the eye comes to any surface (a lens grazing a
//                wall, a tree or a roof is what reads as "the camera went
//                through it"); < 0.2 m FAIL, < 0.5 m WARN
//   - GROUND     the eye under 0.3 m above the ground outside the rooms
//   - CARDS      a card in the air (a screen lifted off a device, a part of the
//                drop) within 0.6 m of the lens; < 0.25 m FAIL (the world
//                is run at each P, so the cards are where the film puts them)
//   - MOVERS     a van or a person (where the film puts them at P) within
//                0.6 m of the lens; < 0.25 m FAIL
// Envelopes are left out (they fly with the camera); the decks are taken built.
// --phone flies the portrait framing (camera.ts phoneAdjust, its pull-back).
//
// usage: node tools/qa/story-camera.mjs [step=0.005] [from=0] [to=FILM_LEN] [--phone] [--json out.json]
import { createJiti } from "jiti";
import fs from "node:fs";

// Canvases (the ground's plan, the screens) draw nothing here: a silent stand-in is enough.
const ctx2d = new Proxy(
  {},
  {
    get: (_, k) =>
      k === "measureText"
        ? () => ({ width: 10 })
        : k === "createLinearGradient" || k === "createRadialGradient"
          ? () => ({ addColorStop() {} })
          : k === "getImageData"
            ? () => ({ data: new Uint8ClampedArray(4) })
            : () => {},
    set: () => true,
  }
);
const canvas = () => ({ width: 0, height: 0, style: {}, getContext: () => ctx2d });
globalThis.document = { createElement: canvas, body: {}, documentElement: {}, fonts: { ready: Promise.resolve() } };
globalThis.getComputedStyle = () => ({ getPropertyValue: () => "" });

const root = new URL("../../", import.meta.url);
const jiti = createJiti(new URL("index.js", root).href, { alias: { "@": new URL(".", root).pathname.replace(/^\/([A-Za-z]:)/, "$1") } });
const film = (f) => jiti.import(new URL(`components/story/film/${f}`, root).href);
const THREE = await jiti.import("three");
const { MeshBVH } = await jiti.import("three-mesh-bvh");
const { World } = await film("world.ts");
const { cameraSmooth, phoneAdjust } = await film("camera.ts");
const { FILM_LEN } = await jiti.import(new URL("components/story/timeline.ts", root).href);

const args = process.argv.slice(2);
// --phone: the portrait framing (390 x 844), as a phone shows the film.
const phoneAt = args.indexOf("--phone");
const PHONE = phoneAt >= 0;
if (PHONE) args.splice(phoneAt, 1);
const jsonAt = args.indexOf("--json");
const jsonOut = jsonAt >= 0 ? args.splice(jsonAt, 2)[1] : null;
const [step = 0.005, from = 0, to = FILM_LEN] = args.map(Number);

// A stand-in renderer: the world only sets flags on it while it builds.
const gl = { shadowMap: { enabled: false, type: 0 }, getContext: () => ({}), capabilities: { maxSamples: 4 }, extensions: { has: () => false } };
const world = new World(gl, { phone: false, quality: 1, reduced: true });
if (PHONE) world.setSize(390, 844, 1);
if (PHONE) {
  const t0 = performance.now();
  world.phoneBack(0);
  console.log(`phone pull-back table: ${(performance.now() - t0).toFixed(0)} ms`);
}
// Built decks; everything placed.
world.scene.updateMatrixWorld(true);

const SKIP = new Set();
for (const o of [world.sam.root, world.owner.root, world.samPhone.group, world["ourVan"], world["rival"], world["traffic"].body, world["traffic"].dark]) o.traverse((c) => SKIP.add(c));
const pos = [];
const v = new THREE.Vector3();
const m = new THREE.Matrix4();
const im = new THREE.Matrix4();
world.scene.traverse((o) => {
  if (!o.isMesh || SKIP.has(o)) return;
  const mat = Array.isArray(o.material) ? o.material[0] : o.material;
  // Only solid, lit things: skip light (unlit), screens, transparent cards, the sky, the ground plane.
  if (!mat || mat.transparent || mat.type === "ShaderMaterial" || mat.type === "MeshBasicMaterial") return;
  if (o.geometry.type === "PlaneGeometry") return;
  const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry; // (indexed geometry expanded)
  const p = g.getAttribute("position");
  const count = o.isInstancedMesh ? o.count : 1;
  for (let i = 0; i < count; i++) {
    if (o.isInstancedMesh) {
      o.getMatrixAt(i, im);
      m.multiplyMatrices(o.matrixWorld, im);
    } else m.copy(o.matrixWorld);
    // A zero-scaled instance is not there.
    if (Math.abs(m.determinant()) < 1e-9) continue;
    for (let k = 0; k < p.count; k++) {
      v.fromBufferAttribute(p, k).applyMatrix4(m);
      pos.push(v.x, v.y, v.z);
    }
  }
});
const geo = new THREE.BufferGeometry();
geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
const bvh = new MeshBVH(geo);
console.log(`${pos.length / 9} triangles`);

const ctx = world["camCtx"];
const cam = { eye: new THREE.Vector3(), at: new THREE.Vector3(), fov: 40, ppx: 0.5, ppy: 0.5, roll: 0 };
const target = { point: new THREE.Vector3(), distance: 0 };
const H = (x, z) => new THREE.Vector2(-44 - x, 15.5 - z);
const S = (x, z) => new THREE.Vector2(44 + x, -17 + z);
/** Inside a room (its floor, not the ground, is under the eye). */
const inRoom = (e) => {
  const a = H(-5, -4.5), b = H(5, 4.5);
  const inHome = e.x > Math.min(a.x, b.x) && e.x < Math.max(a.x, b.x) && e.z > Math.min(a.y, b.y) && e.z < Math.max(a.y, b.y);
  const c = S(-7, -6), d = S(7, 6);
  const inShop = e.x > c.x && e.x < d.x && e.z > c.y && e.z < d.y;
  return inHome || inShop;
};
// The cards in the air move with the film: run the world at each P and measure the
// lens's distance to every card that shows (its rectangle, in its own frame).
const cards = world["allCards"]();
const local = new THREE.Vector3();
const cardGap = (eye) => {
  let best = 9;
  for (const c of cards) {
    if (!c.group.visible || c.faceMat.opacity < 0.05) continue;
    c.group.updateMatrixWorld(true);
    local.copy(eye).applyMatrix4(new THREE.Matrix4().copy(c.group.matrixWorld).invert());
    const s = c.group.scale.x;
    const dx = Math.max(0, Math.abs(local.x) - c.w / 2) * s;
    const dy = Math.max(0, Math.abs(local.y) - c.h / 2) * s;
    const dz = Math.abs(local.z) * s;
    best = Math.min(best, Math.hypot(dx, dy, dz));
  }
  return best;
};
// Things that move: the vans (boxes) and the two people (upright capsules), where they are at P.
const vanGap = (eye) => {
  let best = 9;
  for (const v of [world["ourVan"], world["rival"]]) {
    if (!v.visible) continue;
    v.updateMatrixWorld(true);
    local.copy(eye).applyMatrix4(new THREE.Matrix4().copy(v.matrixWorld).invert());
    const dx = Math.max(0, Math.abs(local.x) - 1.0);
    const dy = Math.max(0, Math.abs(local.y - 1.1) - 1.1);
    const dz = Math.max(0, Math.abs(local.z + 0.05) - 2.65);
    best = Math.min(best, Math.hypot(dx, dy, dz));
  }
  for (const fig of [world.sam, world.owner]) {
    if (!fig.root.visible) continue;
    const r = fig.root.getWorldPosition(new THREE.Vector3());
    const y = Math.min(Math.max(eye.y, r.y + 0.3), r.y + 1.5);
    best = Math.min(best, Math.max(0, Math.hypot(eye.x - r.x, eye.y - y, eye.z - r.z) - 0.35));
  }
  return best;
};
const rows = [];
for (let P = from; P <= to + 1e-9; P += step) {
  cameraSmooth(P, ctx, cam, FILM_LEN);
  if (PHONE) phoneAdjust(cam, 390 / 844, world.phoneBack(P));
  const r = bvh.closestPointToPoint(cam.eye, target, 0, 5);
  const clear = r ? target.distance : 5;
  const ground = !inRoom(cam.eye) && cam.eye.y < 0.3 ? "below 0.3 m over the ground" : "";
  world.update({ dt: 0, time: 8, P, pointer: { x: 0, y: 0, has: false } });
  const card = cardGap(world.camera.position);
  const mover = vanGap(world.camera.position);
  rows.push({ P: +P.toFixed(3), clear: +clear.toFixed(3), ground, card: +card.toFixed(3), mover: +mover.toFixed(3), eye: cam.eye.toArray().map((x) => +x.toFixed(2)) });
}

/** Contiguous runs of rows matching a test, as [from, to, worst]. */
function runs(test, worst) {
  const out = [];
  let cur = null;
  for (const r of rows) {
    if (test(r)) {
      if (!cur) cur = { from: r.P, to: r.P, rows: [] };
      cur.to = r.P;
      cur.rows.push(r);
    } else if (cur) {
      out.push(cur);
      cur = null;
    }
  }
  if (cur) out.push(cur);
  return out.map((c) => ({ from: c.from, to: c.to, worst: worst(c.rows) }));
}
let fails = 0;
const report = (title, list, fmt, fail) => {
  console.log(`\n${title}: ${list.length}`);
  for (const r of list) {
    const f = fail(r);
    if (f) fails++;
    console.log(`  ${f ? "FAIL" : "warn"} P ${r.from.toFixed(3)}..${r.to.toFixed(3)}  ${fmt(r)}`);
  }
};
const near = runs((r) => r.clear < 0.5, (rs) => rs.reduce((a, b) => (b.clear < a.clear ? b : a)));
report("CLEARANCE (eye within 0.5 m of a surface)", near, (r) => `closest ${r.worst.clear} m at P ${r.worst.P}, eye ${r.worst.eye.join(", ")}`, (r) => r.worst.clear < 0.2);
const low = runs((r) => !!r.ground, (rs) => rs[0]);
report("GROUND", low, (r) => r.worst.ground, () => true);
const close = runs((r) => r.card < 0.6, (rs) => rs.reduce((a, b) => (b.card < a.card ? b : a)));
report("CARDS (a card in the air within 0.6 m of the lens)", close, (r) => `closest ${r.worst.card} m at P ${r.worst.P}, eye ${r.worst.eye.join(", ")}`, (r) => r.worst.card < 0.25);
const movers = runs((r) => r.mover < 0.6, (rs) => rs.reduce((a, b) => (b.mover < a.mover ? b : a)));
report("MOVERS (a van or a person within 0.6 m of the lens)", movers, (r) => `closest ${r.worst.mover} m at P ${r.worst.P}, eye ${r.worst.eye.join(", ")}`, (r) => r.worst.mover < 0.25);
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(rows));
console.log(`\n${fails ? "FAIL" : "PASS"}: ${fails} problem run(s)`);
process.exitCode = fails ? 1 : 0;
