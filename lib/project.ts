import * as THREE from "three";
import { getStone } from "./geo/crystal";
import { sceneState } from "./sceneState";
import { scroll } from "./stores";
import { STONE } from "./geo/types";

/**
 * THE BRIDGE — once per frame, after the camera and before the render, it
 * projects the 3D onto the page and writes the DOM that must track it
 * (CONTRACTS §3 E5):
 *   · the ch01 inversion clip (letters flip ink → paper exactly where the black
 *     stone passes behind them)
 *   · the ch02 leader lines from each layer row to its lit floor
 *   · the specimen card's live camera readout
 *   · --stone-x / --stone-y (the paper's radial lift follows the stone)
 *   · the ch06 bookend clip and the mark-lock flag
 * Every write is skipped when the value hasn't changed.
 */

const v = new THREE.Vector3();
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

let inversionEls: HTMLElement[] | null = null;
let leaderPaths: SVGPathElement[] = [];
let leaderDots: SVGCircleElement[] = [];
let tierRows: HTMLElement[] = [];
let readoutEls: HTMLElement[] = [];
let leadersSvg: SVGSVGElement | null = null;
let lastQuery = 0;

function query(now: number) {
  if (inversionEls && now - lastQuery < 1000) return;
  lastQuery = now;
  inversionEls = Array.from(document.querySelectorAll<HTMLElement>("[data-inversion]"));
  leadersSvg = document.querySelector<SVGSVGElement>("#leaders");
  leaderPaths = [0, 1, 2, 3].map((i) => document.querySelector<SVGPathElement>(`[data-leader="${i}"]`)).filter(Boolean) as SVGPathElement[];
  leaderDots = [0, 1, 2, 3].map((i) => document.querySelector<SVGCircleElement>(`[data-leader-dot="${i}"]`)).filter(Boolean) as SVGCircleElement[];
  tierRows = [0, 1, 2, 3].map((i) => document.querySelector<HTMLElement>(`[data-tier-row="${i}"]`)).filter(Boolean) as HTMLElement[];
  readoutEls = Array.from(document.querySelectorAll<HTMLElement>("[data-readout]"));
}

export function runBridge(camera: THREE.PerspectiveCamera, W: number, H: number): void {
  const now = performance.now();
  query(now);
  const root = document.documentElement;
  const S = scroll.S;
  const stone = getStone();

  /* ---- stone centre → paper lift ------------------------------------- */
  const c = project(
    v.set(sceneState.stone.home.x, sceneState.stone.home.y + STONE.centerY, sceneState.stone.home.z),
    camera,
    W,
    H
  );
  write("stone", `${c.x.toFixed(0)},${c.y.toFixed(0)}`, () => {
    root.style.setProperty("--stone-x", `${c.x.toFixed(0)}px`);
    root.style.setProperty("--stone-y", `${c.y.toFixed(0)}px`);
  });

  /* ---- ch01 inversion ----------------------------------------------------- */
  if (inversionEls && inversionEls.length) {
    const on = S > 0.45 && S < 2.3;
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

  /* ---- ch02 leader lines ------------------------------------------------- */
  if (leadersSvg) {
    const on = sceneState.tiers.visible && S > 3.25 && S < 4.55 && scroll.vw > 767;
    write("leaders-on", on ? "1" : "0", (val) => leadersSvg!.setAttribute("data-on", val));
    if (on) {
      for (let i = 0; i < 4; i++) {
        const row = tierRows[i];
        const path = leaderPaths[i];
        const dot = leaderDots[i];
        if (!row || !path || !dot) continue;
        const r = row.getBoundingClientRect();
        const a = project(sceneState.tiers.anchors[i], camera, W, H);
        const x1 = r.right + 12;
        const y1 = r.top + r.height / 2;
        const d = `M${x1.toFixed(1)} ${y1.toFixed(1)} L${a.x.toFixed(1)} ${a.y.toFixed(1)}`;
        write(`lp${i}`, d, (val) => path.setAttribute("d", val));
        write(`ld${i}`, `${a.x.toFixed(1)},${a.y.toFixed(1)}`, () => {
          dot.setAttribute("cx", a.x.toFixed(1));
          dot.setAttribute("cy", a.y.toFixed(1));
        });
        const f = sceneState.tiers.focus === i ? "1" : "0";
        write(`lf${i}`, f, (val) => {
          path.setAttribute("data-focus", val);
          dot.setAttribute("data-focus", val);
          row.setAttribute("data-focus", val);
        });
      }
    }
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
