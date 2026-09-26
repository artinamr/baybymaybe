import * as THREE from "three";

/**
 * THE SKY'S CONSTANTS, shared by everything that must agree about the light:
 * the cloud sea's shading and the shadows cast on it (shaders/env.ts), the
 * room the glass reflects (PlaceEnv), the sun's glow on the page (lib/project).
 *
 * A LOW sun, off to one side: the billows get real form (lit flanks, blue
 * shadowed valleys) and anything standing over the clouds throws a long
 * shadow across them.
 */
export const SUN_DIR = new THREE.Vector3(0.78, 0.3, -0.42).normalize();

let noiseTex: THREE.DataTexture | null = null;

/** Tileable gradient noise on a `period`-cell lattice (0..1 coords). */
function makePerlin(period: number, seed: number) {
  const g: [number, number][] = [];
  let s = seed >>> 0;
  const rnd = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = 0; i < period * period; i++) {
    const a = rnd() * Math.PI * 2;
    g.push([Math.cos(a), Math.sin(a)]);
  }
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  return (x: number, y: number) => {
    const px = x * period;
    const py = y * period;
    const x0 = Math.floor(px);
    const y0 = Math.floor(py);
    const fx = px - x0;
    const fy = py - y0;
    const dot = (ix: number, iy: number, dx: number, dy: number) => {
      const gg = g[(((iy % period) + period) % period) * period + (((ix % period) + period) % period)];
      return gg[0] * dx + gg[1] * dy;
    };
    const n00 = dot(x0, y0, fx, fy);
    const n10 = dot(x0 + 1, y0, fx - 1, fy);
    const n01 = dot(x0, y0 + 1, fx, fy - 1);
    const n11 = dot(x0 + 1, y0 + 1, fx - 1, fy - 1);
    const u = fade(fx);
    const v = fade(fy);
    return (n00 + (n10 - n00) * u) * (1 - v) + (n01 + (n11 - n01) * u) * v;
  };
}

/** Tileable inverted-Worley domes on a `period`-cell grid (cumulus "cauliflower"). */
function makeDomes(period: number, seed: number) {
  let s = seed >>> 0;
  const rnd = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pts: [number, number][] = [];
  for (let i = 0; i < period * period; i++) pts.push([rnd(), rnd()]);
  return (x: number, y: number) => {
    const px = x * period;
    const py = y * period;
    const cx = Math.floor(px);
    const cy = Math.floor(py);
    let best = 9;
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        const gx = cx + i;
        const gy = cy + j;
        const p = pts[(((gy % period) + period) % period) * period + (((gx % period) + period) % period)];
        const dx = gx + p[0] - px;
        const dy = gy + p[1] - py;
        best = Math.min(best, dx * dx + dy * dy);
      }
    }
    // A dome: 1 at a cell's heart, rounding down to 0 at its edge.
    const d = Math.sqrt(best);
    return Math.max(0, 1 - d * d * 1.15);
  };
}

/**
 * One 256² tileable noise texture for every cloud in the sky:
 *   r  fbm (5 octaves) — the billows' body
 *   g  a second, independent fbm — domain warp
 *   b  a third — domain warp / detail
 *   a  round domes (inverted Worley, two scales) — cumulus tops
 * Built once, on first use (~40 ms), linear-filtered, mipmapped, repeating.
 */
export function cloudNoiseTexture(): THREE.DataTexture {
  if (noiseTex) return noiseTex;
  const N = 256;
  const data = new Uint8Array(N * N * 4);
  const fbm = (fns: ((x: number, y: number) => number)[], x: number, y: number) => {
    let a = 0.5;
    let s = 0;
    let n = 0;
    for (const f of fns) {
      s += a * f(x, y);
      n += a;
      a *= 0.5;
    }
    return s / n;
  };
  const oct = (seed: number) => [4, 8, 16, 32, 64].map((p, i) => makePerlin(p, seed + i * 101));
  const R = oct(0x51a1);
  const G = oct(0x7c33);
  const B = oct(0x2e9d);
  const d1 = makeDomes(6, 0x3b1);
  const d2 = makeDomes(14, 0x9f7);
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const x = i / N;
      const y = j / N;
      const o = (j * N + i) * 4;
      const r = fbm(R, x, y) * 1.6 + 0.5;
      const g = fbm(G, x, y) * 1.6 + 0.5;
      const b = fbm(B, x, y) * 1.6 + 0.5;
      const dm = 0.7 * d1(x, y) + 0.3 * d2(x, y);
      data[o] = Math.max(0, Math.min(255, Math.round(r * 255)));
      data[o + 1] = Math.max(0, Math.min(255, Math.round(g * 255)));
      data[o + 2] = Math.max(0, Math.min(255, Math.round(b * 255)));
      data[o + 3] = Math.max(0, Math.min(255, Math.round(dm * 255)));
    }
  }
  const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.colorSpace = THREE.NoColorSpace;
  t.needsUpdate = true;
  noiseTex = t;
  return t;
}
