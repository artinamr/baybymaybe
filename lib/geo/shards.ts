import * as THREE from "three";
import { mulberry32, polysToGeometry, roundedPolys } from "./crystal";

/**
 * Relatives of the stone for the field (ch04) and the flakes: the same cut —
 * a girdle polygon with a crown above and a pavilion below — rounded the same
 * way, so they catch light exactly like the protagonist. Origin at the girdle
 * centre, +Y up.
 */
export function makeShard(o: {
  sides: number;
  crown: number;
  pavilion: number;
  radius?: number;
  jitter: number;
  seed: number;
  bevel?: number;
}): THREE.BufferGeometry {
  const rand = mulberry32(o.seed);
  const R = o.radius ?? 0.5;
  const pts: THREE.Vector3[] = [];
  const phase = rand() * Math.PI * 2;
  for (let i = 0; i < o.sides; i++) {
    const a = phase + (i / o.sides) * Math.PI * 2 + (rand() - 0.5) * o.jitter * 0.6;
    const r = R * (1 + (rand() - 0.5) * o.jitter);
    pts.push(new THREE.Vector3(Math.cos(a) * r, (rand() - 0.5) * o.jitter * 0.08, Math.sin(a) * r));
  }
  pts.push(new THREE.Vector3((rand() - 0.5) * o.jitter * 0.2, o.crown, (rand() - 0.5) * o.jitter * 0.2));
  pts.push(new THREE.Vector3((rand() - 0.5) * o.jitter * 0.3, -o.pavilion, (rand() - 0.5) * o.jitter * 0.3));
  return polysToGeometry(roundedPolys(pts, o.bevel ?? 0.012, 2));
}

/** A small rounded chip: six irregular points, like a flake knocked off a core. */
export function makeFlake(seed = 11): THREE.BufferGeometry {
  const rand = mulberry32(seed);
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + rand() * 0.5;
    pts.push(new THREE.Vector3(Math.cos(a) * (0.6 + rand() * 0.4), (rand() - 0.5) * 0.35, Math.sin(a) * (0.4 + rand() * 0.3)));
  }
  pts.push(new THREE.Vector3(0.1, 0.45, 0), new THREE.Vector3(-0.1, -0.4, 0.05));
  return polysToGeometry(roundedPolys(pts, 0.03, 1));
}

/**
 * The field's three cuts. `height` is the geometry's crown + pavilion at scale
 * 1, so Field can scale each instance to a target height and bury part of its
 * pavilion below the floor.
 */
export const FIELD_VARIANTS: {
  key: "tall4" | "irregular5" | "gem";
  count: number;
  geometry: () => THREE.BufferGeometry;
  height: number;
  pavilion: number;
}[] = [
  {
    key: "tall4",
    count: 30,
    height: 0.34 + 2.2,
    pavilion: 2.2,
    geometry: () => makeShard({ sides: 4, crown: 0.34, pavilion: 2.2, radius: 0.36, jitter: 0.12, seed: 41 }),
  },
  {
    key: "irregular5",
    count: 24,
    height: 0.5 + 1.6,
    pavilion: 1.6,
    geometry: () => makeShard({ sides: 5, crown: 0.5, pavilion: 1.6, radius: 0.42, jitter: 0.35, seed: 97 }),
  },
  {
    key: "gem",
    count: 18,
    height: 0.62 + 1.1,
    pavilion: 1.1,
    geometry: () => makeShard({ sides: 6, crown: 0.62, pavilion: 1.1, radius: 0.5, jitter: 0.08, seed: 7 }),
  },
];
