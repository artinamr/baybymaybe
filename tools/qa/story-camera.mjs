// The story's camera, checked against the film's geometry, without a browser.
//
// Builds the hall, the old machine, the new machine and the owner's corner
// exactly as the film does (components/story/film), puts every triangle in a
// BVH, then flies the film's own smoothed camera (camera.ts cameraSmooth)
// through the whole film and reports, in film time P:
//   - CLEARANCE  how close the eye comes to any surface (a lens grazing a
//                beam, a floor or a wall is what reads as "the camera went
//                through it"); < 0.25 m FAIL, < 0.6 m WARN
//   - FLOOR      the eye below the nave's floor outside the pit, or inside
//                the pit's wall
//   - HIDDEN     the customer in frame but behind something solid
// Moving parts are taken at rest; the old machine counts until it comes
// apart (P 14.95), the new one once it is built (P 16.6); the corner the
// owner keeps counts throughout.
//
// usage: node tools/qa/story-camera.mjs [step=0.005] [from=0] [to=27.4] [--json out.json]
import { createJiti } from "jiti";
import fs from "node:fs";

// The machine's stencilled labels draw on a canvas: a silent stand-in is enough here.
const ctx2d = new Proxy(
  {},
  {
    get: (_, k) => (k === "measureText" ? () => ({ width: 10 }) : k === "createLinearGradient" || k === "createRadialGradient" ? () => ({ addColorStop() {} }) : () => {}),
    set: () => true,
  }
);
const canvas = () => ({ width: 0, height: 0, style: {}, getContext: () => ctx2d });
globalThis.document = { createElement: canvas, body: {} };
globalThis.getComputedStyle = () => ({ getPropertyValue: () => "" });

const root = new URL("../../", import.meta.url);
const jiti = createJiti(new URL("index.js", root).href, { alias: { "@": new URL(".", root).pathname.replace(/^\/([A-Za-z]:)/, "$1") } });
const film = (f) => jiti.import(new URL(`components/story/film/${f}`, root).href);
const THREE = await jiti.import("three");
const { MeshBVH } = await jiti.import("three-mesh-bvh");
const { buildLayout, FLOOR_Y, PIT_R, PIT_Y } = await film("layout.ts");
const { buildHall } = await film("hall.ts");
const { buildOld } = await film("old.ts");
const { buildNew } = await film("next.ts");
const { heroAt, heroInit } = await film("hero.ts");
const { cameraSmooth } = await film("camera.ts");

const args = process.argv.slice(2);
const jsonAt = args.indexOf("--json");
const jsonOut = jsonAt >= 0 ? args.splice(jsonAt, 2)[1] : null;
const [step = 0.005, from = 0, to = 27.4] = args.map(Number);

const L = buildLayout(true);
const hall = buildHall(false);
const old = buildOld(L);
const nw = buildNew(L);
const KEEP = new Set(["desk", "shade", "chair", "laptop", "lid", "bulb", "owner"]);

/** One BVH over the triangles of a kit's buckets whose piece passes `keep`. */
function kitBVH(kit, keep) {
  const pos = [];
  for (const b of kit.buckets.values()) {
    for (let i = 0; i < b.index.length; i += 3) {
      const a = b.index[i], c = b.index[i + 1], d = b.index[i + 2];
      if (!keep(kit.pieces[b.piece[a]])) continue;
      for (const v of [a, c, d]) pos.push(b.pos[v * 3], b.pos[v * 3 + 1], b.pos[v * 3 + 2]);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return { bvh: new MeshBVH(g), tris: pos.length / 9 };
}
const hallG = hall.stoneMesh.geometry.clone();
const sets = {
  hall: { bvh: new MeshBVH(hallG), tris: hallG.attributes.position.count / 3, live: () => true },
  old: { ...kitBVH(old.kit, (p) => !KEEP.has(p.tag) && p !== old.rig.bulb), live: (P) => P < 14.95 },
  corner: { ...kitBVH(old.kit, (p) => KEEP.has(p.tag) || p === old.rig.bulb), live: () => true },
  new: { ...kitBVH(nw.kit, () => true), live: (P) => P > 16.6 },
};
for (const [k, s] of Object.entries(sets)) console.log(`${k}: ${s.tris} triangles`);

const h = heroInit();
const cam = { eye: new THREE.Vector3(), at: new THREE.Vector3(), fov: 40, ppx: 0.5, ppy: 0.5, roll: 0 };
const target = { point: new THREE.Vector3(), distance: 0 };
const ray = new THREE.Ray();
const rows = [];
for (let P = from; P <= to + 1e-9; P += step) {
  heroAt(P, L, h, 8);
  cameraSmooth(P, { h, L }, 8, cam);
  heroAt(P, L, h, 8);
  let best = Infinity;
  let what = "";
  for (const [k, s] of Object.entries(sets)) {
    if (!s.live(P)) continue;
    const r = s.bvh.closestPointToPoint(cam.eye, target, 0, best);
    if (r && target.distance < best) {
      best = target.distance;
      what = k;
    }
  }
  const radial = Math.hypot(cam.eye.x, cam.eye.z);
  const floor = cam.eye.y < FLOOR_Y + 0.15 && radial > PIT_R - 0.1 ? "below the nave floor" : cam.eye.y < FLOOR_Y && cam.eye.y > PIT_Y && Math.abs(radial - PIT_R) < 0.5 ? "in the pit wall" : "";
  // The customer: in frame, and can the lens see it?
  let hidden = "";
  if (h.visible) {
    const to = h.pos.clone().sub(cam.eye);
    const d = to.length();
    const dir = cam.at.clone().sub(cam.eye).normalize();
    const ang = (Math.acos(Math.min(1, Math.max(-1, to.clone().normalize().dot(dir)))) * 180) / Math.PI;
    if (ang < cam.fov * 0.62 && d > 0.3) {
      ray.set(cam.eye, to.normalize());
      for (const [k, s] of Object.entries(sets)) {
        if (!s.live(P) || k === "new") continue; // glass does not hide it
        const hit = s.bvh.raycastFirst(ray, THREE.DoubleSide, 0.05, d - 0.18);
        if (hit) {
          hidden = k;
          break;
        }
      }
    }
  }
  rows.push({ P: +P.toFixed(3), clear: +best.toFixed(3), what, floor, hidden, eye: cam.eye.toArray().map((v) => +v.toFixed(2)) });
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
const near = runs((r) => r.clear < 0.6, (rs) => rs.reduce((a, b) => (b.clear < a.clear ? b : a)));
report("CLEARANCE (eye within 0.6 m of a surface)", near, (r) => `closest ${r.worst.clear} m (${r.worst.what}) at P ${r.worst.P}, eye ${r.worst.eye.join(", ")}`, (r) => r.worst.clear < 0.25);
const floors = runs((r) => !!r.floor, (rs) => rs[0]);
report("FLOOR", floors, (r) => r.worst.floor, () => true);
const hid = runs((r) => !!r.hidden, (rs) => rs[0]);
report("HIDDEN (customer in frame, behind something)", hid, (r) => `behind ${r.worst.hidden}`, (r) => r.to - r.from > 0.08);
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(rows));
console.log(`\n${fails ? "FAIL" : "PASS"}: ${fails} problem run(s)`);
process.exitCode = fails ? 1 : 0;
