// How the story's camera moves, without a browser: the film's own smoothed
// camera (camera.ts cameraSmooth) sampled through the whole film, as how fast
// the picture flows per screen of scroll (the eye's travel against the
// subject's distance, the turn, the zoom, in degrees of picture), with the
// places where it peaks (a lurch) and where it changes abruptly (a jolt).
// Autoplay plays about 5.4 to 7.4 seconds a screen, so a flow of 1000 is
// around 150 to 190 degrees of picture a second there. Look at the listed
// stretches in motion; the turn's black (about P 16.2 to 16.6) hides its whip.
// usage: node tools/qa/story-flow.mjs [step=0.004]
import { createJiti } from "jiti";

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
const { World } = await film("world.ts");
const { cameraSmooth } = await film("camera.ts");
const { FILM_LEN } = await jiti.import(new URL("components/story/timeline.ts", root).href);

const step = Number(process.argv[2] || 0.004);
const gl = { shadowMap: { enabled: false, type: 0 }, getContext: () => ({}), capabilities: { maxSamples: 4 }, extensions: { has: () => false } };
const world = new World(gl, { phone: false, quality: 1, reduced: true });
const ctx = world["camCtx"];
const cam = { eye: new THREE.Vector3(), at: new THREE.Vector3(), fov: 40, ppx: 0.5, ppy: 0.5, roll: 0 };
const rows = [];
let prev = null;
for (let P = 0; P <= FILM_LEN + 1e-9; P += step) {
  cameraSmooth(P, ctx, cam, FILM_LEN);
  const dir = cam.at.clone().sub(cam.eye);
  const dist = dir.length();
  dir.normalize();
  if (prev) {
    const move = cam.eye.distanceTo(prev.eye) / step;
    const turn = (Math.acos(Math.min(1, dir.dot(prev.dir))) * 180) / Math.PI / step;
    const zoom = Math.abs(cam.fov - prev.fov) / step;
    const flow = (move / Math.max(1, dist)) * 57.3 + turn + zoom * 0.8;
    rows.push({ P, flow, move, turn, dist });
  }
  prev = { eye: cam.eye.clone(), dir, fov: cam.fov };
}
const jolt = rows.map((r, i) => {
  const a = rows[Math.max(0, i - 2)].flow;
  const b = rows[Math.min(rows.length - 1, i + 2)].flow;
  return { P: r.P, j: Math.abs(b - a) / (4 * step), flow: r.flow };
});
const top = (list, key, n) => {
  const out = [];
  for (const r of [...list].sort((x, y) => y[key] - x[key])) {
    if (out.some((o) => Math.abs(o.P - r.P) < 0.12)) continue;
    out.push(r);
    if (out.length >= n) break;
  }
  return out.sort((x, y) => x.P - y.P);
};
console.log("PEAK FLOW (degrees of picture per screen):");
for (const r of top(rows, "flow", 18)) console.log(`  P ${r.P.toFixed(2)}  flow ${r.flow.toFixed(0)}  move ${r.move.toFixed(1)} m/screen  turn ${r.turn.toFixed(0)} deg/screen  subject ${r.dist.toFixed(1)} m`);
console.log("JOLTS (change of flow per screen):");
for (const r of top(jolt, "j", 18)) console.log(`  P ${r.P.toFixed(2)}  jolt ${r.j.toFixed(0)}  flow ${r.flow.toFixed(0)}`);
