import * as THREE from "three";
import { getStone } from "./geo/crystal";
import { sceneState } from "./sceneState";
import { CHAPTERS, chapter, filmS, pageS } from "./chapters";
import { scroll } from "./stores";
import { STONE } from "./geo/types";

import { fragTex } from "./fragTex";

/**
 * THE BRIDGE — once per frame, after the camera and before the render, it
 * projects the 3D onto the page and writes the DOM that must track it
 * (CONTRACTS §3 E5):
 *   · the ch01 inversion clip (letters flip ink → paper exactly where the black
 *     stone passes behind them)
 *   · the ch02 layer rows' focus (the layer the scroll or the pointer has lit)
 *   · --dusk (ch03 turns the page to night)
 *   · the specimen card's live camera readout
 *   · --stone-x / --stone-y (the paper's radial lift follows the stone)
 *   · the ch06 bookend clip and the mark-lock flag
 * Every write is skipped when the value hasn't changed.
 */

const v = new THREE.Vector3();
const hz = new THREE.Vector3();
const pts: { x: number; y: number }[] = Array.from({ length: 10 }, () => ({ x: 0, y: 0 }));
const hull: { x: number; y: number }[] = [];
const last = new Map<string, string>();
let readoutAt = 0;

function write(key: string, value: string, apply: (v: string) => void) {
  if (last.get(key) === value) return;
  last.set(key, value);
  apply(value);
}

function project(p: THREE.Vector3, cam: THREE.Camera, W: number, H: number) {
  v.copy(p).project(cam);
  return { x: (v.x * 0.5 + 0.5) * W, y: (1 - (v.y * 0.5 + 0.5)) * H, z: v.z };
}

/** Andrew's monotone chain on the projected points. */
function convexHull(p: { x: number; y: number }[]) {
  const s = p.slice().sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: typeof s = [];
  for (const q of s) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: typeof s = [];
  for (let i = s.length - 1; i >= 0; i--) {
    const q = s[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  upper.pop();
  lower.pop();
  hull.length = 0;
  hull.push(...lower, ...upper);
  return hull;
}

/**
 * Each piece's corners (fragment-local), deduplicated — the rounded bevels
 * collapse back onto the corners they round — for projecting silhouettes.
 */
let fragCorners: Float32Array[] | null = null;
function corners(): Float32Array[] {
  if (fragCorners) return fragCorners;
  const g = getStone().geometry;
  const pos = g.getAttribute("position");
  const fid = g.getAttribute("aFrag");
  const sets = new Map<number, Map<string, [number, number, number]>>();
  for (let i = 0; i < pos.count; i++) {
    const f = Math.round(fid.getX(i));
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const key = `${Math.round(x / 0.03)},${Math.round(y / 0.03)},${Math.round(z / 0.03)}`;
    let s = sets.get(f);
    if (!s) sets.set(f, (s = new Map()));
    if (!s.has(key)) s.set(key, [x, y, z]);
  }
  const out: Float32Array[] = [];
  for (let f = 0; f < fragTex.count; f++) {
    const pts = [...(sets.get(f)?.values() ?? [])];
    out.push(new Float32Array(pts.flat()));
  }
  fragCorners = out;
  return out;
}
const scratch: { x: number; y: number }[] = Array.from({ length: 256 }, () => ({ x: 0, y: 0 }));
const scratchHull: { x: number; y: number }[] = [];
/** Monotone chain over scratch[0..n) — allocation-light (the sort is in place). */
function hullOf(n: number) {
  const s = scratch;
  // Insertion sort (n is small).
  for (let i = 1; i < n; i++) {
    const a = s[i];
    const ax = a.x;
    const ay = a.y;
    let j = i - 1;
    while (j >= 0 && (s[j].x > ax || (s[j].x === ax && s[j].y > ay))) {
      s[j + 1].x = s[j].x;
      s[j + 1].y = s[j].y;
      j--;
    }
    s[j + 1].x = ax;
    s[j + 1].y = ay;
  }
  const h = scratchHull;
  h.length = 0;
  const cross = (o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  for (let i = 0; i < n; i++) {
    while (h.length >= 2 && cross(h[h.length - 2], h[h.length - 1], s[i]) <= 0) h.pop();
    h.push(s[i]);
  }
  const lo = h.length + 1;
  for (let i = n - 2; i >= 0; i--) {
    while (h.length >= lo && cross(h[h.length - 2], h[h.length - 1], s[i]) <= 0) h.pop();
    h.push(s[i]);
  }
  h.pop();
  return h;
}

let inversionEls: HTMLElement[] | null = null;
/** The per-frame positions go on the elements that use them, never on :root —
    a custom property changed on :root restyles the whole document. */
let fieldEl: HTMLElement | null = null;
let markEl: HTMLElement | null = null;
let whyInvEls: HTMLElement[] = [];
let tierRows: HTMLElement[] = [];
let readoutEls: HTMLElement[] = [];
let lastQuery = 0;

function query(now: number) {
  if (inversionEls && now - lastQuery < 1000) return;
  lastQuery = now;
  inversionEls = Array.from(document.querySelectorAll<HTMLElement>("[data-inversion]"));
  fieldEl = document.getElementById("field");
  markEl = document.querySelector<HTMLElement>(".mark-display");
  whyInvEls = Array.from(document.querySelectorAll<HTMLElement>("[data-inv-why]"));
  tierRows = [0, 1, 2, 3].map((i) => document.querySelector<HTMLElement>(`[data-tier-row="${i}"]`)).filter(Boolean) as HTMLElement[];
  readoutEls = Array.from(document.querySelectorAll<HTMLElement>("[data-readout]"));
}

/** Whether a chapter's section is in the viewport (page S). */
function onScreen(id: "statement" | "why"): boolean {
  const c = chapter(id);
  return scroll.S > c.S0 - 1 && scroll.S < c.S1;
}

export function runBridge(camera: THREE.PerspectiveCamera, W: number, H: number): void {
  const now = performance.now();
  query(now);
  // Look-dev handle (development builds only): the film's state and the camera.
  if (process.env.NODE_ENV !== "production") (window as unknown as { __nd?: object }).__nd = { sceneState, camera, stone: getStone(), pageS, filmS, chapters: CHAPTERS };
  const root = document.documentElement;
  // Film time (the film holds while a page section is on screen).
  const S = sceneState.S;
  const stone = getStone();

  /* ---- stone centre → paper lift ------------------------------------- */
  const c = project(
    v.set(sceneState.stone.home.x, sceneState.stone.home.y + STONE.centerY, sceneState.stone.home.z),
    camera,
    W,
    H
  );
  // Under a page sheet the field is hidden: nothing to move.
  const hidden = sceneState.covered;
  if (!hidden)
    write("stone", `${c.x.toFixed(0)},${c.y.toFixed(0)}`, () => {
      fieldEl?.style.setProperty("--stone-x", `${c.x.toFixed(0)}px`);
      fieldEl?.style.setProperty("--stone-y", `${c.y.toFixed(0)}px`);
    });

  /* ---- the studio the film plays in: a faint cove (floor meeting backdrop,
         keyed to where the floor's horizon lands on the page) and a soft pool
         of light behind the subject — barely there, never a picture ---------- */
  write("cove", sceneState.env.cove.toFixed(3), (val) => fieldEl?.style.setProperty("--cove", val));
  // The haze drifts only while it can be seen (its opacity is the cove's).
  write("haze", sceneState.env.cove > 0.0005 ? "1" : "0", (val) => fieldEl?.toggleAttribute("data-haze", val === "1"));
  if (sceneState.env.cove > 0.001 && !hidden) {
    camera.getWorldDirection(hz);
    const fwdY = hz.y;
    hz.y = 0;
    if (hz.lengthSq() < 1e-6) hz.set(0, 0, -1);
    hz.normalize().multiplyScalar(5000).add(camera.position);
    let hy = project(hz, camera, W, H).y;
    // Looking steeply down, the horizon is above the frame.
    if (fwdY < -0.97) hy = -H;
    write("horizon", Math.max(-H, Math.min(2 * H, hy)).toFixed(0), (val) => fieldEl?.style.setProperty("--horizon", `${val}px`));
    // (The finale's words only near the finale: a custom property restyles them.)
    if (S > 9.25) write("markHorizon", Math.max(-H, Math.min(2 * H, hy)).toFixed(0), (val) => markEl?.style.setProperty("--horizon", `${val}px`));
    // The finale's words stand on the floor right under the stone — the line
    // its reflection starts from — not on the far horizon above it.
    if (S > 9.25) {
      const fl = project(v.set(sceneState.cam.pivot.x, sceneState.u.floorY, sceneState.cam.pivot.z), camera, W, H);
      write("floorline", Math.max(-H, Math.min(2 * H, fl.y)).toFixed(0), (val) => markEl?.style.setProperty("--floorline", `${val}px`));
    }
    const pv = project(sceneState.cam.pivot, camera, W, H);
    write("subject", `${pv.x.toFixed(0)},${pv.y.toFixed(0)}`, () => {
      fieldEl?.style.setProperty("--subject-x", `${pv.x.toFixed(0)}px`);
      fieldEl?.style.setProperty("--subject-y", `${pv.y.toFixed(0)}px`);
    });
  }

  /* ---- dusk: the page follows the film into night and back (ch03) ------- */
  const dusk = sceneState.u.dusk;
  write("dusk", dusk.toFixed(3), (val) => {
    root.style.setProperty("--dusk", val);
    // Type and chrome turn as the circle of night passes them; the aura round
    // the stone turns indigo as soon as the night leaves it.
    const t = Math.min(1, Math.max(0, (dusk - 0.26) / 0.3));
    root.style.setProperty("--dusk-ui", (t * t * (3 - 2 * t)).toFixed(3));
    const a = Math.min(1, dusk / 0.2);
    root.style.setProperty("--dusk-aura", (a * a * (3 - 2 * a)).toFixed(3));
    root.toggleAttribute("data-dusk", dusk > 0.6);
  });

  /* ---- ch01 inversion ----------------------------------------------------- */
  // (Only while its chapter is on screen: the film holds under page sections,
  // and an offscreen clip rebuilt every frame still forces a layout.)
  if (inversionEls && inversionEls.length) {
    const on = S > 0.45 && S < 2.3 && onScreen("statement");
    let poly = "polygon(0 0, 0 0, 0 0)";
    if (on) {
      const m = sceneState.stone.matrix;
      const dp = stone.definingPoints;
      for (let i = 0; i < dp.length; i++) {
        const q = project(v.copy(dp[i]).applyMatrix4(m), camera, W, H);
        pts[i].x = q.x;
        pts[i].y = q.y;
      }
      const h = convexHull(pts);
      // clip-path is relative to the element's own box.
      const r = inversionEls[0].getBoundingClientRect();
      poly = "polygon(" + h.map((p) => `${(p.x - r.left).toFixed(1)}px ${(p.y - r.top).toFixed(1)}px`).join(",") + ")";
    }
    write("inv", poly, (val) => inversionEls!.forEach((el) => (el.style.clipPath = val)));
  }

  /* ---- WHY: the words turn to paper wherever a piece passes behind them --- */
  if (whyInvEls.length) {
    let clip = "polygon(0 0, 0 0, 0 0)";
    if (S > 6.95 && S < 9.7 && onScreen("why")) {
      const box = whyInvEls[0].getBoundingClientRect();
      const C = corners();
      let d = "";
      for (let i = 0; i < C.length; i++) {
        const e = fragTex.fragWorld[i].elements;
        // Pieces scaled away to nothing (the girdle plate) cast no silhouette.
        if (e[0] * e[0] + e[1] * e[1] + e[2] * e[2] < 1e-4) continue;
        const P = C[i];
        let n = 0;
        let behind = false;
        for (let k = 0; k < P.length && n < scratch.length; k += 3) {
          v.set(P[k], P[k + 1], P[k + 2]).applyMatrix4(fragTex.fragWorld[i]).project(camera);
          if (v.z > 1 || v.z < -1) {
            behind = true;
            break;
          }
          scratch[n].x = (v.x * 0.5 + 0.5) * W - box.left;
          scratch[n].y = (1 - (v.y * 0.5 + 0.5)) * H - box.top;
          n++;
        }
        if (behind || n < 3) continue;
        const h = hullOf(n);
        if (h.length < 3) continue;
        d += `M${h[0].x.toFixed(1)} ${h[0].y.toFixed(1)}`;
        for (let k = 1; k < h.length; k++) d += `L${h[k].x.toFixed(1)} ${h[k].y.toFixed(1)}`;
        d += "Z";
      }
      if (d) clip = `path('${d}')`;
    }
    write("invwhy", clip, (val) => whyInvEls.forEach((el) => (el.style.clipPath = val)));
  }

  /* ---- ch02: the focused ring's row reads ink, the others step back ---- */
  for (let i = 0; i < tierRows.length; i++) {
    const row = tierRows[i];
    const f = sceneState.tiers.visible && sceneState.tiers.focus === i ? "1" : "0";
    write(`lf${i}`, f, (val) => row.setAttribute("data-focus", val));
  }

  /* ---- specimen readout (≤ 10 Hz) --------------------------------------- */
  if (now - readoutAt > 100 && readoutEls.length) {
    readoutAt = now;
    const cam = sceneState.cam;
    const dx = camera.position.x - cam.target.x;
    const dy = camera.position.y - cam.target.y;
    const dz = camera.position.z - cam.target.z;
    let az = (Math.atan2(dx, dz) - sceneState.stone.yaw) * (180 / Math.PI);
    az = ((az % 360) + 360) % 360;
    const el = Math.asin(dy / Math.max(1e-4, Math.hypot(dx, dy, dz))) * (180 / Math.PI);
    const txt = `AZ ${az.toFixed(1).padStart(5, "0")}° · EL ${el.toFixed(1).padStart(4, "0")}°`;
    write("readout", txt, (val) => readoutEls.forEach((e) => (e.textContent = val)));
  }

  /* ---- bookend clip + mark lock ----------------------------------------- */
  const cl = sceneState.clip;
  const clipVal = cl.active
    ? `${cl.t.toFixed(3)}|${cl.r.toFixed(3)}|${cl.b.toFixed(3)}|${cl.l.toFixed(3)}|${cl.rad.toFixed(2)}|${cl.tint.toFixed(3)}`
    : "off";
  write("clip", clipVal, () => {
    root.toggleAttribute("data-clip", cl.active);
    if (cl.active) {
      root.style.setProperty("--ci-t", `${cl.t}%`);
      root.style.setProperty("--ci-r", `${cl.r}%`);
      root.style.setProperty("--ci-b", `${cl.b}%`);
      root.style.setProperty("--ci-l", `${cl.l}%`);
      root.style.setProperty("--ci-rad", `${cl.rad}px`);
      root.style.setProperty("--ci-tint", `${cl.tint}`);
      root.style.setProperty("--ci-frame", `${cl.frame}`);
    }
  });
  write("mark", sceneState.mark.lock > 0.5 ? "1" : "0", (val) => root.toggleAttribute("data-mark", val === "1"));
}
