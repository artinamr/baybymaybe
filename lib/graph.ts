/**
 * THE CURRENT — ch03's constellation (docs/SPEC.md §5 "03 · The current").
 *
 * Nodes are the 24 fragments where the F3 formation left them; edges are their
 * k-nearest neighbours (k = 3), patched so the graph is ONE connected piece
 * (plain k-NN over two clusters happily returns two islands and a bridge that
 * only talks to itself); walkers are pulses of indigo relayed along the edges.
 *
 * Pure TS — no three, no React — so the maths runs in node. Drawing (one
 * instanced ribbon draw) and the hover raycast live in
 * components/stage/Graph.tsx.
 *
 * Walkers are TIME-based, like the ridge thread: signal keeps moving while the
 * reader lingers on a beat. The topology is rebuilt from the fragments' actual
 * positions, so it can never disagree with where the shards really are.
 *
 * Zero allocations after module load: every buffer below is preallocated.
 */
import { FRAG_COUNT } from "./geo/types";

export type Vec3Like = { x: number; y: number; z: number };

/* ------------------------------------------------------------------------ */
/* Tunables (SPEC §5 ch03)                                                    */
/* ------------------------------------------------------------------------ */

export const GRAPH_K = 3;
/** k-NN yields ≤ 24·3 = 72 undirected edges; connectivity patches add ≤ 23. */
export const MAX_EDGES = 96;
export const MAX_WALKERS = 10;
/** Mobile (SPEC §12): fewer walkers in the top band. */
export const MAX_WALKERS_MOBILE = 6;
/** World units per second. */
export const WALKER_SPEED = 1.6;
/** Beat spawns per second. */
export const WALKER_SPAWN_RATE = 2;
export const WALKER_FORK = 0.2;
export const WALKER_HOPS_MIN = 6;
export const WALKER_HOPS_MAX = 9;
/** Head / tail length as fractions of the edge being travelled. */
export const WALKER_HEAD = 0.1;
export const WALKER_TAIL = 0.25;
/** Arrival flash decay (s). */
export const FLASH_TAU = 0.45;
/** Edges grow from the bridge outward: delay ≤ GROW_SPREAD, then a GROW_SPAN ramp. */
const GROW_SPREAD = 0.42;
const GROW_JITTER = 0.08;
const GROW_SPAN = 1 - GROW_SPREAD - GROW_JITTER;
const BRIDGE_COUNT = 3;

export const ROLE_P = 0;
export const ROLE_W = 1;
export const ROLE_BRIDGE = 2;

/** Walker behaviour: 0 free (hover), 1 beat A (P → bridge), 2 beat B (loops in W). */
export type WalkerMode = 0 | 1 | 2;

/* ------------------------------------------------------------------------ */
/* Deterministic RNG                                                          */
/* ------------------------------------------------------------------------ */

/** mulberry32 — the project's seeded PRNG (SPEC §4.2). Returns [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------------ */
/* Per-fragment arrival flash (the Director folds this into fragTex flash)    */
/* ------------------------------------------------------------------------ */

/** 0..1 per fragment; set to 1 when a walker arrives, decays with τ = FLASH_TAU. */
export const graphFlash = new Float32Array(FRAG_COUNT);

export function decayFlash(dt: number): void {
  if (dt <= 0) return;
  const k = Math.exp(-dt / FLASH_TAU);
  for (let i = 0; i < FRAG_COUNT; i++) {
    const v = graphFlash[i] * k;
    graphFlash[i] = v < 1e-3 ? 0 : v;
  }
}

/* ------------------------------------------------------------------------ */
/* Topology                                                                   */
/* ------------------------------------------------------------------------ */

export const graph = {
  /** Set by buildGraph; the drawing code reads nothing until it is true. */
  built: false,
  /** Increments on every build (lets consumers drop per-edge state). */
  version: 0,
  edgeCount: 0,
  /** Edge e runs A → B; it GROWS from A (the endpoint nearer the bridge). */
  edgeA: new Uint8Array(MAX_EDGES),
  edgeB: new Uint8Array(MAX_EDGES),
  /** Grow delay 0..GROW_SPREAD+GROW_JITTER (in units of sceneState.graph.grow). */
  edgeDelay: new Float32Array(MAX_EDGES),
  /** ROLE_P / ROLE_W / ROLE_BRIDGE per node. */
  role: new Uint8Array(FRAG_COUNT),
  /** Hops to the nearest bridge node (BFS). */
  hop: new Uint8Array(FRAG_COUNT),
  maxHop: 1,
  /** CSR adjacency: neighbours of n are adjNode[adjStart[n] .. adjStart[n+1]). */
  adjStart: new Uint16Array(FRAG_COUNT + 1),
  adjNode: new Uint8Array(MAX_EDGES * 2),
  adjEdge: new Uint8Array(MAX_EDGES * 2),
  /**
   * The last TWO traversals of each edge, for the indigo stain the tail leaves
   * behind (shaders/ribbon.ts). Slot s of edge e at [2e + s]:
   *   stainT0   time (s) the walker was (or would have been) at the A end
   *   stainRate edge-param per second, SIGNED: > 0 travelled A→B, < 0 B→A, 0 none.
   * Two slots so a second walker never erases a stain that is still fading.
   */
  stainT0: new Float32Array(MAX_EDGES * 2),
  stainRate: new Float32Array(MAX_EDGES * 2),
};

// Build scratch — preallocated so a rebuild mid-scroll never allocates.
const N = FRAG_COUNT;
const _d2 = new Float32Array(N * N);
const _has = new Uint8Array(N * N);
const _proj = new Float32Array(N);
const _parent = new Int8Array(N);
const _queue = new Uint8Array(N);
const _deg = new Uint16Array(N);
const _bestD = new Float32Array(GRAPH_K);
const _bestJ = new Int8Array(GRAPH_K);
const _growRand = mulberry32(0x5b3df0 ^ 0x9e3779b9);

function find(i: number): number {
  while (_parent[i] !== i) {
    _parent[i] = _parent[_parent[i]];
    i = _parent[i];
  }
  return i;
}

function addEdge(i: number, j: number): boolean {
  if (i === j || _has[i * N + j] || graph.edgeCount >= MAX_EDGES) return false;
  _has[i * N + j] = _has[j * N + i] = 1;
  graph.edgeA[graph.edgeCount] = i;
  graph.edgeB[graph.edgeCount] = j;
  graph.edgeCount++;
  const a = find(i);
  const b = find(j);
  if (a !== b) _parent[a] = b;
  return true;
}

/**
 * Rebuild the topology from the fragments' current world positions (call when
 * they sit in F3 — see Graph.tsx). Roles are found geometrically along the
 * formation's principal axis, so this does not depend on how the formation
 * module labels its bridge nodes: the three nodes nearest the plane between
 * the clusters are the bridge; the rest fall to P (−axis) or W (+axis).
 */
export function buildGraph(pos: ArrayLike<Vec3Like>): void {
  // Pairwise squared distances.
  let mx = 0;
  let my = 0;
  let mz = 0;
  for (let i = 0; i < N; i++) {
    mx += pos[i].x;
    my += pos[i].y;
    mz += pos[i].z;
  }
  mx /= N;
  my /= N;
  mz /= N;
  for (let i = 0; i < N; i++) {
    for (let j = i; j < N; j++) {
      const dx = pos[i].x - pos[j].x;
      const dy = pos[i].y - pos[j].y;
      const dz = pos[i].z - pos[j].z;
      _d2[i * N + j] = _d2[j * N + i] = dx * dx + dy * dy + dz * dz;
    }
  }

  // 1 · Principal axis by power iteration on the covariance. Two clusters
  //     make it unambiguous; oriented so P lands on the −X side of the world.
  let cxx = 0, cxy = 0, cxz = 0, cyy = 0, cyz = 0, czz = 0;
  for (let i = 0; i < N; i++) {
    const x = pos[i].x - mx;
    const y = pos[i].y - my;
    const z = pos[i].z - mz;
    cxx += x * x;
    cxy += x * y;
    cxz += x * z;
    cyy += y * y;
    cyz += y * z;
    czz += z * z;
  }
  let ax = 1, ay = 0, az = 0;
  if (cxx + cyy + czz > 1e-8) {
    for (let it = 0; it < 24; it++) {
      const nx = cxx * ax + cxy * ay + cxz * az;
      const ny = cxy * ax + cyy * ay + cyz * az;
      const nz = cxz * ax + cyz * ay + czz * az;
      const l = Math.hypot(nx, ny, nz);
      if (l < 1e-12) break;
      ax = nx / l;
      ay = ny / l;
      az = nz / l;
    }
    if (ax < 0) {
      ax = -ax;
      ay = -ay;
      az = -az;
    }
  }
  for (let i = 0; i < N; i++) {
    _proj[i] = (pos[i].x - mx) * ax + (pos[i].y - my) * ay + (pos[i].z - mz) * az;
    graph.role[i] = 255;
  }
  for (let b = 0; b < BRIDGE_COUNT; b++) {
    let best = -1;
    let bestV = Infinity;
    for (let i = 0; i < N; i++) {
      if (graph.role[i] !== 255) continue;
      const v = Math.abs(_proj[i]);
      if (v < bestV) {
        bestV = v;
        best = i;
      }
    }
    graph.role[best] = ROLE_BRIDGE;
  }
  for (let i = 0; i < N; i++) {
    if (graph.role[i] === 255) graph.role[i] = _proj[i] < 0 ? ROLE_P : ROLE_W;
  }

  // 2 · k-NN edges (undirected, deduplicated).
  _has.fill(0);
  graph.edgeCount = 0;
  for (let i = 0; i < N; i++) _parent[i] = i;
  for (let i = 0; i < N; i++) {
    _bestD.fill(Infinity);
    _bestJ.fill(-1);
    for (let j = 0; j < N; j++) {
      if (j === i) continue;
      const d = _d2[i * N + j];
      if (d >= _bestD[GRAPH_K - 1]) continue;
      let k = GRAPH_K - 1;
      while (k > 0 && _bestD[k - 1] > d) {
        _bestD[k] = _bestD[k - 1];
        _bestJ[k] = _bestJ[k - 1];
        k--;
      }
      _bestD[k] = d;
      _bestJ[k] = j;
    }
    for (let k = 0; k < GRAPH_K; k++) if (_bestJ[k] >= 0) addEdge(i, _bestJ[k]);
  }

  // 3 · Connectivity: join components by their shortest cross edge until one
  //     remains (Kruskal restricted to cross-component pairs). Walkers must be
  //     able to carry signal from P, across the bridge, into W.
  for (;;) {
    let bi = -1;
    let bj = -1;
    let bd = Infinity;
    for (let i = 0; i < N; i++) {
      const ri = find(i);
      for (let j = i + 1; j < N; j++) {
        if (find(j) === ri) continue;
        const d = _d2[i * N + j];
        if (d < bd) {
          bd = d;
          bi = i;
          bj = j;
        }
      }
    }
    if (bi < 0 || !addEdge(bi, bj)) break;
  }

  // 4 · CSR adjacency.
  _deg.fill(0);
  for (let e = 0; e < graph.edgeCount; e++) {
    _deg[graph.edgeA[e]]++;
    _deg[graph.edgeB[e]]++;
  }
  graph.adjStart[0] = 0;
  for (let i = 0; i < N; i++) graph.adjStart[i + 1] = graph.adjStart[i] + _deg[i];
  _deg.fill(0);
  for (let e = 0; e < graph.edgeCount; e++) {
    const a = graph.edgeA[e];
    const b = graph.edgeB[e];
    let s = graph.adjStart[a] + _deg[a]++;
    graph.adjNode[s] = b;
    graph.adjEdge[s] = e;
    s = graph.adjStart[b] + _deg[b]++;
    graph.adjNode[s] = a;
    graph.adjEdge[s] = e;
  }

  // 5 · BFS hops from the bridge.
  let head = 0;
  let tail = 0;
  for (let i = 0; i < N; i++) {
    graph.hop[i] = 255;
    if (graph.role[i] === ROLE_BRIDGE) {
      graph.hop[i] = 0;
      _queue[tail++] = i;
    }
  }
  while (head < tail) {
    const n = _queue[head++];
    for (let s = graph.adjStart[n]; s < graph.adjStart[n + 1]; s++) {
      const m = graph.adjNode[s];
      if (graph.hop[m] === 255) {
        graph.hop[m] = graph.hop[n] + 1;
        _queue[tail++] = m;
      }
    }
  }
  let maxHop = 1;
  for (let i = 0; i < N; i++) {
    if (graph.hop[i] === 255) graph.hop[i] = 0; // unreachable only if every node coincides
    if (graph.hop[i] > maxHop) maxHop = graph.hop[i];
  }
  graph.maxHop = maxHop;

  // 6 · Orient every edge to grow from the bridge outward: the network is seen
  //     to spread from the centre into both clusters rather than appear at once.
  for (let e = 0; e < graph.edgeCount; e++) {
    const a = graph.edgeA[e];
    const b = graph.edgeB[e];
    const swap =
      graph.hop[b] < graph.hop[a] ||
      (graph.hop[b] === graph.hop[a] && Math.abs(_proj[b]) < Math.abs(_proj[a]));
    if (swap) {
      graph.edgeA[e] = b;
      graph.edgeB[e] = a;
    }
    graph.edgeDelay[e] = (GROW_SPREAD * graph.hop[graph.edgeA[e]]) / maxHop + GROW_JITTER * _growRand();
  }
  // Adjacency is orientation-independent, so the CSR above stays valid.

  graph.stainT0.fill(0);
  graph.stainRate.fill(0);
  graph.built = true;
  graph.version++;
  clearWalkers();
}

/** Eased 0..1 length of edge e for the chapter's grow value. */
export function edgeGrow(e: number, grow: number): number {
  if (grow >= 1) return 1;
  const u = (grow - graph.edgeDelay[e]) / GROW_SPAN;
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  const v = 1 - u;
  return 1 - v * v * v; // easeOutCubic — the line arrives, it doesn't drift in
}

/* ------------------------------------------------------------------------ */
/* Walkers                                                                    */
/* ------------------------------------------------------------------------ */

const W = MAX_WALKERS;
export const walkers = {
  count: 0,
  alive: new Uint8Array(W),
  mode: new Uint8Array(W),
  /** Current edge, travelled from → to; t = distance / length (> 1 while draining). */
  from: new Uint8Array(W),
  to: new Uint8Array(W),
  edge: new Uint8Array(W),
  t: new Float32Array(W),
  /** Live length of the current / previous edge (world units). */
  len: new Float32Array(W),
  prevLen: new Float32Array(W),
  /** The previous edge still carries the tail after a hop. */
  hasPrev: new Uint8Array(W),
  prevFrom: new Uint8Array(W),
  prevTo: new Uint8Array(W),
  hops: new Uint8Array(W),
  maxHops: new Uint8Array(W),
  /** Final node reached: the head runs on into the fragment and the tail follows it in. */
  draining: new Uint8Array(W),
  /** Spawn time — the oldest walker is recycled when a hover needs a slot. */
  born: new Float32Array(W),
};
let spawnAcc = 0;
const _wrand = mulberry32(0x5b3df0 ^ 0x00c0ffee);
const _weights = new Float32Array(N);

export function clearWalkers(): void {
  walkers.alive.fill(0);
  walkers.count = 0;
  spawnAcc = 0;
}

function dist(pos: ArrayLike<Vec3Like>, a: number, b: number): number {
  const p = pos[a];
  const q = pos[b];
  return Math.max(1e-3, Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z));
}

/**
 * The walker's working length: blends from the previous edge's length to the
 * current one over the first 35 % of the hop, so head and tail (fractions of
 * "the edge") don't jump when a walker turns onto a shorter or longer edge.
 */
export function walkerScale(w: number): number {
  const L = walkers.len[w];
  if (!walkers.hasPrev[w]) return L;
  const u = Math.min(1, Math.max(0, walkers.t[w] / 0.35));
  const s = u * u * (3 - 2 * u);
  return walkers.prevLen[w] + (L - walkers.prevLen[w]) * s;
}

/**
 * Choose the next hop out of `cur` (never straight back to `back` unless it is
 * the only way out). Returns an adjacency slot, or −1 when the walker is stuck.
 * `view` points from the graph toward the camera: in beat B, neighbours that
 * turn the same way around W's centre as seen by the reader are favoured, so
 * a random walk reads as LOOPS rather than jitter.
 */
function pickNext(
  mode: number,
  cur: number,
  back: number,
  exclude: number,
  pos: ArrayLike<Vec3Like>,
  view: Vec3Like,
  wcx: number,
  wcy: number,
  wcz: number
): number {
  const s0 = graph.adjStart[cur];
  const s1 = graph.adjStart[cur + 1];
  for (let pass = 0; pass < 2; pass++) {
    let total = 0;
    for (let s = s0; s < s1; s++) {
      const nb = graph.adjNode[s];
      let w = 1;
      if (nb === exclude) w = 0;
      else if (nb === back && pass === 0) w = 0;
      else if (mode === 1) {
        // Beat A: descend toward the bridge, never wander into W.
        const dh = graph.hop[nb] - graph.hop[cur];
        w = dh < 0 ? 4 : dh === 0 ? 0.8 : 0.15;
        if (graph.role[nb] === ROLE_W) w *= 0.05;
      } else if (mode === 2) {
        // Beat B: stay inside W; prefer a consistent sense of rotation.
        if (graph.role[nb] !== ROLE_W) w = 0;
        else {
          const p = pos[cur];
          const q = pos[nb];
          const rx = p.x - wcx, ry = p.y - wcy, rz = p.z - wcz;
          const mxv = q.x - p.x, myv = q.y - p.y, mzv = q.z - p.z;
          const cx = ry * mzv - rz * myv;
          const cy = rz * mxv - rx * mzv;
          const cz = rx * myv - ry * mxv;
          w = cx * view.x + cy * view.y + cz * view.z > 0 ? 3 : 1;
        }
      }
      _weights[s - s0] = w;
      total += w;
    }
    if (total > 0) {
      let r = _wrand() * total;
      for (let s = s0; s < s1; s++) {
        r -= _weights[s - s0];
        if (r <= 0 && _weights[s - s0] > 0) return s;
      }
      for (let s = s1 - 1; s >= s0; s--) if (_weights[s - s0] > 0) return s;
    }
  }
  return -1;
}

let _wcx = 0, _wcy = 0, _wcz = 0;
function updateWCentre(pos: ArrayLike<Vec3Like>) {
  let n = 0;
  _wcx = _wcy = _wcz = 0;
  for (let i = 0; i < N; i++) {
    if (graph.role[i] !== ROLE_W) continue;
    _wcx += pos[i].x;
    _wcy += pos[i].y;
    _wcz += pos[i].z;
    n++;
  }
  if (n > 0) {
    _wcx /= n;
    _wcy /= n;
    _wcz /= n;
  }
}

function freeSlot(): number {
  for (let w = 0; w < W; w++) if (!walkers.alive[w]) return w;
  return -1;
}

/** Put walker w on the edge behind adjacency slot s, `carry` world units along it. */
function enter(w: number, fromNode: number, s: number, carry: number, time: number, pos: ArrayLike<Vec3Like>) {
  const to = graph.adjNode[s];
  const e = graph.adjEdge[s];
  const L = dist(pos, fromNode, to);
  walkers.from[w] = fromNode;
  walkers.to[w] = to;
  walkers.edge[w] = e;
  walkers.len[w] = L;
  walkers.t[w] = carry / L;
  // Stain: record when the head passed (would have passed) the A end, and
  // the signed rate it covers the edge at. Overwrite the older of two slots.
  const k = graph.stainRate[2 * e] === 0 || graph.stainT0[2 * e] <= graph.stainT0[2 * e + 1] ? 2 * e : 2 * e + 1;
  const rate = WALKER_SPEED / L;
  const aToB = graph.edgeA[e] === fromNode;
  const tStart = time - carry / WALKER_SPEED; // head at `fromNode`
  graph.stainT0[k] = aToB ? tStart : tStart - 1 / rate; // param 0 = A end
  graph.stainRate[k] = aToB ? rate : -rate;
}

function spawnAt(
  node: number,
  mode: WalkerMode,
  time: number,
  pos: ArrayLike<Vec3Like>,
  view: Vec3Like,
  back: number,
  carry: number,
  hops: number,
  maxHops: number,
  prevFrom: number,
  prevTo: number,
  prevLen: number,
  exclude: number
): number {
  const w = freeSlot();
  if (w < 0) return -1;
  const s = pickNext(mode, node, back, exclude, pos, view, _wcx, _wcy, _wcz);
  if (s < 0) return -1;
  walkers.alive[w] = 1;
  walkers.count++;
  walkers.mode[w] = mode;
  walkers.hops[w] = hops;
  walkers.maxHops[w] = maxHops;
  walkers.draining[w] = 0;
  walkers.born[w] = time;
  walkers.hasPrev[w] = prevFrom >= 0 ? 1 : 0;
  if (prevFrom >= 0) {
    walkers.prevFrom[w] = prevFrom;
    walkers.prevTo[w] = prevTo;
    walkers.prevLen[w] = prevLen;
  }
  enter(w, node, s, carry, time, pos);
  return w;
}

function rollHops(): number {
  return WALKER_HOPS_MIN + Math.floor(_wrand() * (WALKER_HOPS_MAX - WALKER_HOPS_MIN + 1));
}

/**
 * Fire a walker from `node` (hover). Recycles the oldest walker when all slots
 * are busy, so the pointer always gets an answer. Returns false if the node
 * has nowhere to go.
 */
export function spawnWalker(node: number, mode: WalkerMode, time: number, pos: ArrayLike<Vec3Like>, view: Vec3Like, max = MAX_WALKERS): boolean {
  if (!graph.built || node < 0 || node >= N) return false;
  updateWCentre(pos);
  if (walkers.count >= Math.min(max, W)) {
    let oldest = -1;
    let bt = Infinity;
    for (let w = 0; w < W; w++) {
      if (walkers.alive[w] && walkers.born[w] < bt) {
        bt = walkers.born[w];
        oldest = w;
      }
    }
    if (oldest < 0) return false;
    walkers.alive[oldest] = 0;
    walkers.count--;
  }
  const w = spawnAt(node, mode, time, pos, view, -1, 0, 0, rollHops(), -1, -1, 0, -1);
  if (w >= 0) graphFlash[node] = Math.max(graphFlash[node], 0.6);
  return w >= 0;
}

/** Beat A enters P at its far edge; beat B starts anywhere in W. */
function pickSpawnNode(mode: WalkerMode): number {
  let total = 0;
  for (let i = 0; i < N; i++) {
    let w = 0;
    if (mode === 1 && graph.role[i] === ROLE_P) w = graph.hop[i] >= 2 ? graph.hop[i] * graph.hop[i] : 0.25;
    else if (mode === 2 && graph.role[i] === ROLE_W) w = 1;
    _weights[i] = w;
    total += w;
  }
  if (total <= 0) return -1;
  let r = _wrand() * total;
  for (let i = 0; i < N; i++) {
    r -= _weights[i];
    if (r <= 0 && _weights[i] > 0) return i;
  }
  return -1;
}

function kill(w: number) {
  walkers.alive[w] = 0;
  walkers.count--;
}

/**
 * Advance every walker by dt seconds (and spawn for the active beat).
 *   beat   0 none · 1 A · 2 B (sceneState.graph.beat)
 *   spawn  whether beat spawns are allowed this frame (grown, not fading, motion ok)
 *   max    walker cap (10, 6 on mobile)
 *   view   unit vector from the graph toward the camera (beat-B loop sense)
 */
export function stepWalkers(
  dt: number,
  time: number,
  pos: ArrayLike<Vec3Like>,
  beat: number,
  spawn: boolean,
  max: number,
  view: Vec3Like
): void {
  if (!graph.built) return;
  updateWCentre(pos);
  const cap = Math.min(max, W);

  if (spawn && (beat === 1 || beat === 2)) {
    spawnAcc += dt * WALKER_SPAWN_RATE;
    while (spawnAcc >= 1) {
      if (walkers.count >= cap) {
        spawnAcc = Math.min(spawnAcc, 1);
        break;
      }
      spawnAcc -= 1;
      const node = pickSpawnNode(beat as WalkerMode);
      if (node >= 0) spawnAt(node, beat as WalkerMode, time, pos, view, -1, 0, 0, rollHops(), -1, -1, 0, -1);
    }
  } else spawnAcc = 0;

  for (let w = 0; w < W; w++) {
    if (!walkers.alive[w]) continue;
    // Lengths are live: fragments tumble about their centroids, so this only
    // moves if the formation itself moves, but it keeps head/tail honest.
    walkers.len[w] = dist(pos, walkers.from[w], walkers.to[w]);
    if (walkers.hasPrev[w]) walkers.prevLen[w] = dist(pos, walkers.prevFrom[w], walkers.prevTo[w]);
    walkers.t[w] += (WALKER_SPEED * dt) / walkers.len[w];

    if (walkers.draining[w]) {
      const trail = (WALKER_HEAD + WALKER_TAIL) * walkerScale(w);
      if ((walkers.t[w] - 1) * walkers.len[w] >= trail) kill(w);
      continue;
    }

    // At most a couple of hops per frame even after a long stall.
    for (let guard = 0; guard < 3 && walkers.t[w] >= 1; guard++) {
      const at = walkers.to[w];
      const from = walkers.from[w];
      const L = walkers.len[w];
      graphFlash[at] = 1;
      walkers.hops[w]++;
      const mode = walkers.mode[w];
      const final = walkers.hops[w] >= walkers.maxHops[w] || (mode === 1 && graph.role[at] === ROLE_BRIDGE);
      const s = final ? -1 : pickNext(mode, at, from, -1, pos, view, _wcx, _wcy, _wcz);
      if (s < 0) {
        walkers.draining[w] = 1;
        break;
      }
      const carry = (walkers.t[w] - 1) * L;
      // Fork: a second walker takes another way out, sharing the tail behind.
      if (_wrand() < WALKER_FORK && walkers.count < cap) {
        spawnAt(at, mode as WalkerMode, time, pos, view, from, carry, walkers.hops[w], walkers.maxHops[w], from, at, L, graph.adjNode[s]);
      }
      walkers.hasPrev[w] = 1;
      walkers.prevFrom[w] = from;
      walkers.prevTo[w] = at;
      walkers.prevLen[w] = L;
      enter(w, at, s, carry, time, pos);
    }
  }
}
