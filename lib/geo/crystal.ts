import * as THREE from "three";
import { ConvexHull } from "three/addons/math/ConvexHull.js";
import { FRAG_COUNT, STONE, type FragInfo, type Piece, type StoneBuild } from "./types";

/**
 * THE STONE — geometry (docs/SPEC.md §4.1–4.2).
 *
 * 1. The intact stone is the Minkowski sum of the defining polytope with a
 *    small sphere: every facet moves out by r, every ridge becomes a rounded
 *    strip, every corner a sphere patch. Each point remembers the brush
 *    direction that produced it, so bevel normals are EXACT (a smooth
 *    round-over that carries a crisp moving highlight) and facets stay
 *    perfectly flat. Verified on the real GPU in the prior pass.
 *
 * 2. The fracture clips that rounded surface, polygon by polygon, into 24
 *    convex cells: first the mark's own cuts (y = bandH, y = 0, x = 0 through
 *    the pavilion) → crown, band, two blades; then an anisotropic Voronoi
 *    inside the crown and blades so the pieces splinter along Y like obsidian.
 *    Cut faces are rebuilt as caps: the cross-section of the rounded solid on
 *    each cut plane, clipped by the cell's other planes.
 *
 * Everything is deterministic and runs in Node (scripts/fracture-check.mjs).
 */

const H = STONE.halfDiag;
const B = STONE.bandH;
const EPS = 1e-6;

/* ------------------------------------------------------------------------ */
/* PRNG                                                                      */
/* ------------------------------------------------------------------------ */

export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------------ */
/* Defining polytope                                                         */
/* ------------------------------------------------------------------------ */

/** Girdle corner r in the order the ridge attribute uses: 0 +X, 1 +Z, 2 −X, 3 −Z. */
function corner(r: number, y: number): THREE.Vector3 {
  const a = (r * Math.PI) / 2;
  return new THREE.Vector3(Math.cos(a) * H, y, Math.sin(a) * H);
}

/** The 10 defining points: 4 girdle corners at y = 0, 4 at y = bandH, apex, culet. */
export function definingPoints(): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let r = 0; r < 4; r++) pts.push(corner(r, 0));
  for (let r = 0; r < 4; r++) pts.push(corner(r, B));
  pts.push(new THREE.Vector3(...STONE.apex), new THREE.Vector3(...STONE.culet));
  return pts;
}

/* ------------------------------------------------------------------------ */
/* Rounded hull                                                              */
/* ------------------------------------------------------------------------ */

type Vert = { p: THREE.Vector3; n: THREE.Vector3 };
/** A convex surface polygon; `kind` 0 facet · 1 bevel · 2 cut. */
type Poly = { v: Vert[]; kind: number };

function sphereDirs(detail: number): THREE.Vector3[] {
  const g = new THREE.IcosahedronGeometry(1, detail);
  const p = g.getAttribute("position");
  const seen = new Map<string, THREE.Vector3>();
  for (let i = 0; i < p.count; i++) {
    const d = new THREE.Vector3().fromBufferAttribute(p, i).normalize();
    seen.set(`${d.x.toFixed(4)},${d.y.toFixed(4)},${d.z.toFixed(4)}`, d);
  }
  g.dispose();
  return [...seen.values()];
}

function hullFaces(points: THREE.Vector3[]): { tri: THREE.Vector3[]; normal: THREE.Vector3 }[] {
  const hull = new ConvexHull().setFromPoints(points);
  return hull.faces.map((f) => {
    const tri: THREE.Vector3[] = [];
    let e = f.edge;
    do {
      tri.push(e.head().point);
      e = e.next;
    } while (e !== f.edge);
    return { tri, normal: f.normal.clone() };
  });
}

/**
 * Minkowski-round a convex point set. Returns surface polygons (triangles)
 * carrying exact normals: facets (all three points swept by the same brush
 * direction) keep the flat face normal; bevel triangles use each point's brush
 * direction — the true normal of a rounded edge.
 */
export function roundedPolys(points: THREE.Vector3[], r: number, detail: number): Poly[] {
  const faceNormals = hullFaces(points).map((f) => f.normal);
  const dirs = [...sphereDirs(detail), ...faceNormals];
  const cloud: THREE.Vector3[] = [];
  const dirOf = new Map<THREE.Vector3, THREE.Vector3>();
  for (const v of points) {
    for (const d of dirs) {
      const q = v.clone().addScaledVector(d, r);
      cloud.push(q);
      dirOf.set(q, d);
    }
  }
  const polys: Poly[] = [];
  for (const f of hullFaces(cloud)) {
    const ds = f.tri.map((q) => dirOf.get(q)!);
    const flat = ds.every((d) => d === ds[0]);
    polys.push({
      kind: flat ? 0 : 1,
      v: f.tri.map((q, i) => ({ p: q.clone(), n: (flat ? f.normal : ds[i]).clone() })),
    });
  }
  return polys;
}

/** Flatten polygons to a non-indexed geometry with position / normal / aKind. */
export function polysToGeometry(polys: Poly[]): THREE.BufferGeometry {
  const pos: number[] = [];
  const nrm: number[] = [];
  const kind: number[] = [];
  for (const poly of polys) {
    for (let i = 1; i < poly.v.length - 1; i++) {
      for (const v of [poly.v[0], poly.v[i], poly.v[i + 1]]) {
        pos.push(v.p.x, v.p.y, v.p.z);
        nrm.push(v.n.x, v.n.y, v.n.z);
        kind.push(poly.kind);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute("aKind", new THREE.Float32BufferAttribute(kind, 1));
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

/* ------------------------------------------------------------------------ */
/* Clipping                                                                  */
/* ------------------------------------------------------------------------ */

/** Half-space n·x ≤ d. `type` 1 Voronoi · 2 primary mark cut. */
type Plane = { n: THREE.Vector3; d: number; type: 1 | 2 };

const side = (pl: Plane, p: THREE.Vector3) => pl.n.dot(p) - pl.d;

function lerpVert(a: Vert, b: Vert, t: number): Vert {
  const n = a.n.clone().lerp(b.n, t);
  if (n.lengthSq() > EPS) n.normalize();
  else n.copy(a.n);
  return { p: a.p.clone().lerp(b.p, t), n };
}

/** Sutherland–Hodgman: keep the part of a convex polygon inside the half-space. */
function clipPoly(v: Vert[], pl: Plane): Vert[] {
  const out: Vert[] = [];
  for (let i = 0; i < v.length; i++) {
    const a = v[i];
    const b = v[(i + 1) % v.length];
    const sa = side(pl, a.p);
    const sb = side(pl, b.p);
    if (sa <= EPS) out.push(a);
    if ((sa < -EPS && sb > EPS) || (sa > EPS && sb < -EPS)) out.push(lerpVert(a, b, sa / (sa - sb)));
  }
  return out;
}

/** Orthonormal basis of a plane, for 2D hulls on it. */
function planeBasis(n: THREE.Vector3): [THREE.Vector3, THREE.Vector3] {
  const u = Math.abs(n.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const a = u.clone().cross(n).normalize();
  const b = n.clone().cross(a).normalize();
  return [a, b];
}

/** 2D convex hull (monotone chain) of points on a plane, CCW seen from +n. */
function hullOnPlane(points: THREE.Vector3[], n: THREE.Vector3): THREE.Vector3[] {
  const [a, b] = planeBasis(n);
  const pts = points.map((p) => ({ p, x: p.dot(a), y: p.dot(b) }));
  pts.sort((u, v) => u.x - v.x || u.y - v.y);
  const uniq = pts.filter((q, i) => i === 0 || Math.abs(q.x - pts[i - 1].x) > 1e-7 || Math.abs(q.y - pts[i - 1].y) > 1e-7);
  if (uniq.length < 3) return [];
  const cross = (o: (typeof uniq)[0], p: (typeof uniq)[0], q: (typeof uniq)[0]) => (p.x - o.x) * (q.y - o.y) - (p.y - o.y) * (q.x - o.x);
  const lower: typeof uniq = [];
  for (const q of uniq) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 1e-12) lower.pop();
    lower.push(q);
  }
  const upper: typeof uniq = [];
  for (let i = uniq.length - 1; i >= 0; i--) {
    const q = uniq[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 1e-12) upper.pop();
    upper.push(q);
  }
  upper.pop();
  lower.pop();
  return [...lower, ...upper].map((q) => q.p);
}

/** Cross-section of the rounded solid on the plane n·x = d (a convex polygon). */
function crossSection(surface: Poly[], n: THREE.Vector3, d: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (const poly of surface) {
    const v = poly.v;
    for (let i = 0; i < v.length; i++) {
      const a = v[i].p;
      const b = v[(i + 1) % v.length].p;
      const sa = n.dot(a) - d;
      const sb = n.dot(b) - d;
      if ((sa < 0 && sb > 0) || (sa > 0 && sb < 0)) pts.push(a.clone().lerp(b, sa / (sa - sb)));
      else if (Math.abs(sa) < 1e-9) pts.push(a.clone());
    }
  }
  return hullOnPlane(pts, n);
}

/* ------------------------------------------------------------------------ */
/* Cells                                                                     */
/* ------------------------------------------------------------------------ */

type Cell = { piece: Piece; planes: Plane[] };

const PIECE_PLANES: Record<Piece, Plane[]> = {
  crown: [{ n: new THREE.Vector3(0, -1, 0), d: -B, type: 2 }],
  band: [
    { n: new THREE.Vector3(0, 1, 0), d: B, type: 2 },
    { n: new THREE.Vector3(0, -1, 0), d: 0, type: 2 },
  ],
  bladeL: [
    { n: new THREE.Vector3(0, 1, 0), d: 0, type: 2 },
    { n: new THREE.Vector3(1, 0, 0), d: 0, type: 2 },
  ],
  bladeR: [
    { n: new THREE.Vector3(0, 1, 0), d: 0, type: 2 },
    { n: new THREE.Vector3(-1, 0, 0), d: 0, type: 2 },
  ],
};

/** Anisotropic metric: distances along Y count 0.55× → cells elongate along Y. */
const M2 = new THREE.Vector3(1, 0.55 * 0.55, 1);

function voronoiPlane(si: THREE.Vector3, sj: THREE.Vector3): Plane {
  // |M(x−si)|² ≤ |M(x−sj)|²  ⇔  2x·M²(sj−si) ≤ |Msj|² − |Msi|²
  const n = sj.clone().sub(si).multiply(M2);
  const len = n.length();
  const d = (sj.clone().multiply(sj).dot(M2) - si.clone().multiply(si).dot(M2)) / 2;
  return { n: n.divideScalar(len), d: d / len, type: 1 };
}

type Built = {
  polys: Poly[]; // surface + caps, object space
  caps: { plane: Plane; poly: THREE.Vector3[] }[];
  volume: number;
  centroid: THREE.Vector3;
};

function buildCell(surface: Poly[], cell: Cell): Built | null {
  const polys: Poly[] = [];
  for (const poly of surface) {
    let v = poly.v;
    for (const pl of cell.planes) {
      v = clipPoly(v, pl);
      if (v.length < 3) break;
    }
    if (v.length >= 3) polys.push({ v, kind: poly.kind });
  }
  const caps: Built["caps"] = [];
  for (const pl of cell.planes) {
    let sec = crossSection(surface, pl.n, pl.d);
    for (const other of cell.planes) {
      if (other === pl || sec.length < 3) continue;
      sec = clipPoly(
        sec.map((p) => ({ p, n: pl.n })),
        other
      ).map((q) => q.p);
    }
    if (sec.length < 3) continue;
    // hullOnPlane is CCW seen from +n; the cap faces OUT of the cell (+n), keep it.
    const ordered = hullOnPlane(sec, pl.n);
    if (ordered.length < 3) continue;
    caps.push({ plane: pl, poly: ordered });
    polys.push({ v: ordered.map((p) => ({ p: p.clone(), n: pl.n.clone() })), kind: 2 });
  }
  // Volume + centroid by tetra decomposition about the origin.
  let vol = 0;
  const c = new THREE.Vector3();
  const t = new THREE.Vector3();
  for (const poly of polys) {
    for (let i = 1; i < poly.v.length - 1; i++) {
      const a = poly.v[0].p;
      const b = poly.v[i].p;
      const d = poly.v[i + 1].p;
      const v6 = a.dot(t.copy(b).cross(d));
      vol += v6 / 6;
      c.x += ((a.x + b.x + d.x) * v6) / 24;
      c.y += ((a.y + b.y + d.y) * v6) / 24;
      c.z += ((a.z + b.z + d.z) * v6) / 24;
    }
  }
  if (vol < 1e-6) return null;
  c.divideScalar(vol);
  return { polys, caps, volume: vol, centroid: c };
}

/* ------------------------------------------------------------------------ */
/* Seeds                                                                     */
/* ------------------------------------------------------------------------ */

function insidePolytope(p: THREE.Vector3, faces: { n: THREE.Vector3; d: number }[], margin: number) {
  return faces.every((f) => f.n.dot(p) <= f.d - margin);
}

function pieceSeeds(piece: Piece, count: number, rand: () => number, faces: { n: THREE.Vector3; d: number }[]): THREE.Vector3[] {
  const yLo = piece === "crown" ? B + 0.02 : STONE.culet[1] + 0.12;
  const yHi = piece === "crown" ? STONE.apex[1] - 0.12 : -0.02;
  const xLo = piece === "bladeR" ? 0.015 : -H;
  const xHi = piece === "bladeL" ? -0.015 : H;
  // Poisson-ish: best of k candidates (farthest from existing seeds, anisotropic).
  const seeds: THREE.Vector3[] = [];
  const dist = (a: THREE.Vector3, b: THREE.Vector3) => Math.hypot(a.x - b.x, (a.y - b.y) * 0.55, a.z - b.z);
  let guard = 0;
  while (seeds.length < count && guard++ < 4000) {
    let best: THREE.Vector3 | null = null;
    let bestD = -1;
    for (let k = 0; k < 24; k++) {
      const p = new THREE.Vector3(
        THREE.MathUtils.lerp(xLo, xHi, rand()),
        THREE.MathUtils.lerp(yLo, yHi, rand()),
        THREE.MathUtils.lerp(-H, H, rand())
      );
      if (!insidePolytope(p, faces, 0.03)) continue;
      const d = seeds.length ? Math.min(...seeds.map((s) => dist(s, p))) : 1;
      if (d > bestD) {
        bestD = d;
        best = p;
      }
    }
    if (best) seeds.push(best);
  }
  return seeds;
}

/* ------------------------------------------------------------------------ */
/* Build                                                                     */
/* ------------------------------------------------------------------------ */

const SEEDS: Record<Piece, number> = { crown: 5, band: 0, bladeL: 9, bladeR: 9 };

function meridian(r: number): THREE.Vector3[] {
  return [new THREE.Vector3(...STONE.apex), corner(r, B), corner(r, 0), new THREE.Vector3(...STONE.culet)];
}

function distToPolyline(p: THREE.Vector3, line: THREE.Vector3[]): number {
  let best = Infinity;
  const ab = new THREE.Vector3();
  const ap = new THREE.Vector3();
  for (let i = 0; i < line.length - 1; i++) {
    ab.subVectors(line[i + 1], line[i]);
    ap.subVectors(p, line[i]);
    const t = THREE.MathUtils.clamp(ap.dot(ab) / Math.max(ab.lengthSq(), EPS), 0, 1);
    best = Math.min(best, ap.addScaledVector(ab, -t).length());
  }
  return best;
}

/** Principal axis by power iteration on the vertex covariance. */
function principalAxis(pts: THREE.Vector3[], c: THREE.Vector3): { axis: THREE.Vector3; length: number } {
  const m = [0, 0, 0, 0, 0, 0]; // xx yy zz xy xz yz
  for (const p of pts) {
    const x = p.x - c.x;
    const y = p.y - c.y;
    const z = p.z - c.z;
    m[0] += x * x;
    m[1] += y * y;
    m[2] += z * z;
    m[3] += x * y;
    m[4] += x * z;
    m[5] += y * z;
  }
  const v = new THREE.Vector3(0.3, 1, 0.2).normalize();
  for (let k = 0; k < 32; k++) {
    const nx = m[0] * v.x + m[3] * v.y + m[4] * v.z;
    const ny = m[3] * v.x + m[1] * v.y + m[5] * v.z;
    const nz = m[4] * v.x + m[5] * v.y + m[2] * v.z;
    v.set(nx, ny, nz).normalize();
  }
  let lo = Infinity;
  let hi = -Infinity;
  for (const p of pts) {
    const s = v.x * (p.x - c.x) + v.y * (p.y - c.y) + v.z * (p.z - c.z);
    lo = Math.min(lo, s);
    hi = Math.max(hi, s);
  }
  return { axis: v, length: hi - lo };
}

function buildStone(): StoneBuild {
  const defining = definingPoints();
  const surface = roundedPolys(defining, STONE.bevel, 3);
  const faces = hullFaces(defining).map((f) => ({ n: f.normal, d: f.normal.dot(f.tri[0]) }));

  // Cells: pieces, then Voronoi inside pieces. Re-roll a piece's seeds until no
  // cell is a sliver (< 0.4 × the piece's mean volume).
  const cells: Built[] = [];
  const cellPiece: Piece[] = [];
  const pieces: Piece[] = ["bladeL", "bladeR", "band", "crown"];
  for (const piece of pieces) {
    const base = PIECE_PLANES[piece];
    const n = SEEDS[piece];
    if (n === 0) {
      const b = buildCell(surface, { piece, planes: base });
      if (b) {
        cells.push(b);
        cellPiece.push(piece);
      }
      continue;
    }
    let chosen: Built[] | null = null;
    let fallback: Built[] = [];
    let fallbackScore = -1;
    for (let attempt = 0; attempt < 24 && !chosen; attempt++) {
      const rand = mulberry32(0x5b3df0 + attempt * 7919 + piece.length * 131);
      const seeds = pieceSeeds(piece, n, rand, faces);
      if (seeds.length < n) continue;
      const built: Built[] = [];
      for (let i = 0; i < seeds.length; i++) {
        const planes = [...base];
        for (let j = 0; j < seeds.length; j++) if (j !== i) planes.push(voronoiPlane(seeds[i], seeds[j]));
        const b = buildCell(surface, { piece, planes });
        if (b) built.push(b);
      }
      if (built.length < n) continue;
      const mean = built.reduce((a, b) => a + b.volume, 0) / built.length;
      const minRatio = Math.min(...built.map((b) => b.volume)) / mean;
      if (minRatio >= 0.4) chosen = built;
      else if (minRatio > fallbackScore) {
        fallbackScore = minRatio;
        fallback = built;
      }
    }
    for (const b of chosen ?? fallback) {
      cells.push(b);
      cellPiece.push(piece);
    }
  }
  if (cells.length !== FRAG_COUNT) {
    throw new Error(`crystal: expected ${FRAG_COUNT} fragments, built ${cells.length}`);
  }

  // Per-fragment facts.
  const core = new THREE.Vector3(0, -0.3, 0);
  const order = cells.map((_, i) => i).sort((a, b) => cells[b].volume - cells[a].volume);
  const tierOf = new Array<number>(cells.length);
  order.forEach((ci, rank) => (tierOf[ci] = Math.min(3, Math.floor((rank * 4) / cells.length))));
  // Method groups from the culet up: blades in thirds by height, band + crown last.
  const bladeIdx = cells.map((_, i) => i).filter((i) => cellPiece[i] === "bladeL" || cellPiece[i] === "bladeR");
  bladeIdx.sort((a, b) => cells[a].centroid.y - cells[b].centroid.y);
  const groupOf = new Array<number>(cells.length).fill(3);
  bladeIdx.forEach((ci, k) => (groupOf[ci] = Math.min(2, Math.floor((k * 3) / bladeIdx.length))));
  // Clusters: P = left blade + the crown's −x half; W = the rest.
  const clusterOf = cells.map((c, i): "P" | "W" =>
    cellPiece[i] === "bladeL" || (cellPiece[i] === "crown" && c.centroid.x < 0) ? "P" : "W"
  );

  const frags: FragInfo[] = cells.map((c, i) => {
    const verts = c.polys.flatMap((p) => p.v.map((v) => v.p));
    const pa = principalAxis(verts, c.centroid);
    let largest = c.caps[0];
    let area = -1;
    for (const cap of c.caps) {
      let a = 0;
      for (let k = 1; k < cap.poly.length - 1; k++) {
        a += new THREE.Vector3()
          .subVectors(cap.poly[k], cap.poly[0])
          .cross(new THREE.Vector3().subVectors(cap.poly[k + 1], cap.poly[0]))
          .length();
      }
      if (a > area) {
        area = a;
        largest = cap;
      }
    }
    const out = c.centroid.clone().sub(core);
    if (out.lengthSq() < EPS) out.set(0, 1, 0);
    return {
      index: i,
      centroid: c.centroid.clone(),
      volume: c.volume,
      piece: cellPiece[i],
      cutNormal: largest ? largest.plane.n.clone() : new THREE.Vector3(0, 1, 0),
      out: out.normalize(),
      longAxis: pa.axis,
      length: pa.length,
      tier: tierOf[i],
      group: groupOf[i],
      cluster: clusterOf[i],
      radius: Math.max(...verts.map((v) => v.distanceTo(c.centroid))),
    };
  });

  // Merge into one geometry with every attribute.
  const meridians = [0, 1, 2, 3].map(meridian);
  const A = {
    position: [] as number[],
    normal: [] as number[],
    aFrag: [] as number[],
    aKind: [] as number[],
    aRidge: [] as number[],
    aRidgeT: [] as number[],
    aBary: [] as number[],
    aCrack: [] as number[],
    aObj: [] as number[],
    aFaceC: [] as number[],
    aFaceR: [] as number[],
    aRipO: [] as number[],
  };
  const apexY = STONE.apex[1];
  const BARY = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  const onPlane = (p: THREE.Vector3, pl: Plane) => Math.abs(side(pl, p)) < 1e-5;

  cells.forEach((cell, fi) => {
    const planes = [...PIECE_PLANES[cellPiece[fi]]];
    // Recover this cell's Voronoi planes from its caps (same objects).
    for (const cap of cell.caps) if (!planes.includes(cap.plane)) planes.push(cap.plane);
    const ctr = cell.centroid;
    for (const poly of cell.polys) {
      // Cap metadata (object space).
      let faceC = new THREE.Vector3();
      let faceR = 0;
      let ripO = new THREE.Vector3();
      if (poly.kind === 2) {
        faceC = poly.v.reduce((a, v) => a.add(v.p), new THREE.Vector3()).divideScalar(poly.v.length);
        faceR = Math.max(...poly.v.map((v) => v.p.distanceTo(faceC)));
        ripO = poly.v[0].p.clone();
      }
      for (let i = 1; i < poly.v.length - 1; i++) {
        const tri = [poly.v[0], poly.v[i], poly.v[i + 1]];
        // Crack type of the edge opposite each corner: an outer-surface edge lying on a cut plane.
        const crack = [0, 0, 0];
        if (poly.kind !== 2) {
          for (let k = 0; k < 3; k++) {
            const a = tri[(k + 1) % 3].p;
            const b = tri[(k + 2) % 3].p;
            for (const pl of planes) {
              if (onPlane(a, pl) && onPlane(b, pl)) {
                crack[k] = Math.max(crack[k], pl.type);
              }
            }
          }
        }
        tri.forEach((v, k) => {
          A.position.push(v.p.x - ctr.x, v.p.y - ctr.y, v.p.z - ctr.z);
          A.normal.push(v.n.x, v.n.y, v.n.z);
          A.aFrag.push(fi);
          A.aKind.push(poly.kind);
          let ridge = -1;
          if (poly.kind === 1) {
            let best = STONE.bevel * 2.6;
            for (let r = 0; r < 4; r++) {
              const d = distToPolyline(v.p, meridians[r]);
              if (d < best) {
                best = d;
                ridge = r;
              }
            }
          }
          A.aRidge.push(ridge);
          A.aRidgeT.push((apexY - v.p.y) / STONE.height);
          A.aBary.push(...BARY[k]);
          A.aCrack.push(...crack);
          A.aObj.push(v.p.x, v.p.y, v.p.z);
          A.aFaceC.push(faceC.x, faceC.y, faceC.z);
          A.aFaceR.push(faceR);
          A.aRipO.push(ripO.x, ripO.y, ripO.z);
        });
      }
    }
  });

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(A.position, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(A.normal, 3));
  g.setAttribute("aFrag", new THREE.Float32BufferAttribute(A.aFrag, 1));
  g.setAttribute("aKind", new THREE.Float32BufferAttribute(A.aKind, 1));
  g.setAttribute("aRidge", new THREE.Float32BufferAttribute(A.aRidge, 1));
  g.setAttribute("aRidgeT", new THREE.Float32BufferAttribute(A.aRidgeT, 1));
  g.setAttribute("aBary", new THREE.Float32BufferAttribute(A.aBary, 3));
  g.setAttribute("aCrack", new THREE.Float32BufferAttribute(A.aCrack, 3));
  g.setAttribute("aObj", new THREE.Float32BufferAttribute(A.aObj, 3));
  g.setAttribute("aFaceC", new THREE.Float32BufferAttribute(A.aFaceC, 3));
  g.setAttribute("aFaceR", new THREE.Float32BufferAttribute(A.aFaceR, 1));
  g.setAttribute("aRipO", new THREE.Float32BufferAttribute(A.aRipO, 3));
  // Fragment transforms move the pieces far from their object-space positions.
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);

  return {
    geometry: g,
    frags,
    definingPoints: defining,
    ridges: meridians,
    crackOrigin: corner(1, 0),
  };
}

let stoneCache: StoneBuild | null = null;
let hullCache: THREE.BufferGeometry | null = null;

/** The stone (memoized — built once per page). */
export function getStone(): StoneBuild {
  if (!stoneCache) stoneCache = buildStone();
  return stoneCache;
}

/** The intact rounded hull in object space — the hover proxy. */
export function stoneHullGeometry(): THREE.BufferGeometry {
  if (!hullCache) hullCache = polysToGeometry(roundedPolys(definingPoints(), STONE.bevel, 1));
  return hullCache;
}
