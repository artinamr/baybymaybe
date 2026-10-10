import * as THREE from "three";

/**
 * THE KIT: a machine is many parts but few draws. Every part is a PIECE with
 * a rest pivot; its triangles go into the bucket of its material (one merged
 * geometry per material), each vertex tagged with its piece. Each frame the
 * pieces' transforms (translation, scale, rotation about the pivot, glow) go
 * into one float texture, which the vertex shader reads: wheels turn, claws
 * travel, and at the turn the whole machine can come apart piece by piece,
 * all without a single extra draw call.
 *
 * Texture: width 4, one row per piece.
 *   texel 0  translation.xyz, scale
 *   texel 1  rotation quaternion
 *   texel 2  pivot.xyz, glow
 *   texel 3  power (emissive parts' brightness), unused ×3
 */

export type Piece = {
  id: number;
  pivot: THREE.Vector3;
  /** Live transform (relative to rest). */
  t: THREE.Vector3;
  q: THREE.Quaternion;
  s: number;
  glow: number;
  power: number;
  /** Free tags for whoever animates it. */
  tag: string;
  /** Rough size, for the teardown / assembly. */
  size: number;
};

type Bucket = {
  pos: number[];
  nrm: number[];
  col: number[];
  piece: number[];
  rust: number[];
  along: number[];
  index: number[];
};

const _v = new THREE.Vector3();
const _n = new THREE.Vector3();
const _m3 = new THREE.Matrix3();

export class Kit {
  pieces: Piece[] = [];
  buckets = new Map<string, Bucket>();
  tex: THREE.DataTexture | null = null;
  private data: Float32Array | null = null;

  piece(pivot: THREE.Vector3, tag = "", size = 1): Piece {
    const p: Piece = {
      id: this.pieces.length,
      pivot: pivot.clone(),
      t: new THREE.Vector3(),
      q: new THREE.Quaternion(),
      s: 1,
      glow: 0,
      power: 1,
      tag,
      size,
    };
    this.pieces.push(p);
    return p;
  }

  private bucket(key: string): Bucket {
    let b = this.buckets.get(key);
    if (!b) this.buckets.set(key, (b = { pos: [], nrm: [], col: [], piece: [], rust: [], along: [], index: [] }));
    return b;
  }

  /**
   * Add a geometry (in its own space) placed by `m` into `bucket`, as part of
   * piece `p`. `color` is linear RGB (may exceed 1 for light). `along` (per
   * vertex, optional) is distance along a path, for light that travels.
   */
  add(
    bucket: string,
    geo: THREE.BufferGeometry,
    p: Piece,
    m: THREE.Matrix4 | null,
    color: THREE.Color | [number, number, number],
    rust = 0,
    along?: (i: number, pos: THREE.Vector3) => number
  ) {
    const b = this.bucket(bucket);
    const g = geo;
    const P = g.getAttribute("position") as THREE.BufferAttribute;
    const N = g.getAttribute("normal") as THREE.BufferAttribute | undefined;
    const base = b.pos.length / 3;
    if (m) _m3.getNormalMatrix(m);
    const c = Array.isArray(color) ? color : [color.r, color.g, color.b];
    for (let i = 0; i < P.count; i++) {
      _v.fromBufferAttribute(P, i);
      if (m) _v.applyMatrix4(m);
      b.pos.push(_v.x, _v.y, _v.z);
      if (N) {
        _n.fromBufferAttribute(N, i);
        if (m) _n.applyMatrix3(_m3).normalize();
      } else _n.set(0, 1, 0);
      b.nrm.push(_n.x, _n.y, _n.z);
      b.col.push(c[0], c[1], c[2]);
      b.piece.push(p.id);
      b.rust.push(rust);
      b.along.push(along ? along(i, _v) : 0);
    }
    if (g.index) {
      const I = g.index;
      for (let i = 0; i < I.count; i++) b.index.push(base + I.getX(i));
    } else {
      for (let i = 0; i < P.count; i++) b.index.push(base + i);
    }
  }

  /** The merged geometry of one bucket. */
  geometry(bucket: string): THREE.BufferGeometry | null {
    const b = this.buckets.get(bucket);
    if (!b || !b.pos.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(b.pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(b.nrm, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(b.col, 3));
    g.setAttribute("aPiece", new THREE.Float32BufferAttribute(b.piece, 1));
    g.setAttribute("aRust", new THREE.Float32BufferAttribute(b.rust, 1));
    g.setAttribute("aAlong", new THREE.Float32BufferAttribute(b.along, 1));
    const n = b.pos.length / 3;
    g.setIndex(n > 65535 ? new THREE.Uint32BufferAttribute(b.index, 1) : new THREE.Uint16BufferAttribute(b.index, 1));
    g.computeBoundingSphere();
    // The pieces move far from where they were built: never cull the whole.
    g.boundingSphere!.radius = 1e5;
    return g;
  }

  /** The pieces' texture (made once; `upload` refreshes it). */
  texture(): THREE.DataTexture {
    if (this.tex) return this.tex;
    const n = Math.max(1, this.pieces.length);
    this.data = new Float32Array(4 * 4 * n);
    this.tex = new THREE.DataTexture(this.data, 4, n, THREE.RGBAFormat, THREE.FloatType);
    this.tex.minFilter = THREE.NearestFilter;
    this.tex.magFilter = THREE.NearestFilter;
    this.tex.generateMipmaps = false;
    this.upload();
    return this.tex;
  }

  upload() {
    const d = this.data;
    if (!d || !this.tex) return;
    for (const p of this.pieces) {
      const o = p.id * 16;
      d[o] = p.t.x;
      d[o + 1] = p.t.y;
      d[o + 2] = p.t.z;
      d[o + 3] = p.s;
      d[o + 4] = p.q.x;
      d[o + 5] = p.q.y;
      d[o + 6] = p.q.z;
      d[o + 7] = p.q.w;
      d[o + 8] = p.pivot.x;
      d[o + 9] = p.pivot.y;
      d[o + 10] = p.pivot.z;
      d[o + 11] = p.glow;
      d[o + 12] = p.power;
    }
    this.tex.needsUpdate = true;
  }

  /** Back to rest. */
  rest() {
    for (const p of this.pieces) {
      p.t.set(0, 0, 0);
      p.q.identity();
      p.s = 1;
      p.glow = 0;
    }
  }
}

/** GLSL shared by every kit material: read the piece, move a point and a normal. */
export const PIECE_GLSL = /* glsl */ `
attribute float aPiece;
uniform highp sampler2D uPieces;
vec3 pcT; float pcS; vec4 pcQ; vec3 pcP; float pcGlow; float pcPower;
vec3 qrot(vec4 q, vec3 v) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }
void loadPiece() {
  int id = int(aPiece + 0.5);
  vec4 a = texelFetch(uPieces, ivec2(0, id), 0);
  vec4 b = texelFetch(uPieces, ivec2(1, id), 0);
  vec4 c = texelFetch(uPieces, ivec2(2, id), 0);
  vec4 d = texelFetch(uPieces, ivec2(3, id), 0);
  pcT = a.xyz; pcS = a.w; pcQ = b; pcP = c.xyz; pcGlow = c.w; pcPower = d.x;
}
vec3 piecePoint(vec3 p) { return pcP + pcT + pcS * qrot(pcQ, p - pcP); }
vec3 pieceNormal(vec3 n) { return qrot(pcQ, n); }
`;
