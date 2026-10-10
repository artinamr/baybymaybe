import * as THREE from "three";

const UP = new THREE.Vector3(0, 1, 0);

/**
 * A path a customer rolls along: a centripetal Catmull-Rom curve through
 * control points, sampled once by arc length so that "where is s metres
 * along" is a cheap lookup. Also gives the frame a rail is built in: the
 * tangent, a level side vector, and the up that sits under a marble.
 */
export class Track {
  readonly length: number;
  private pts: Float32Array;
  private tans: Float32Array;
  private step: number;
  private n: number;
  readonly curve: THREE.Curve<THREE.Vector3>;

  constructor(points: THREE.Vector3[] | THREE.Curve<THREE.Vector3>, step = 0.05) {
    this.curve = Array.isArray(points) ? new THREE.CatmullRomCurve3(points, false, "centripetal", 0.5) : points;
    const L = this.curve.getLength();
    this.length = L;
    this.n = Math.max(2, Math.ceil(L / step) + 1);
    this.step = L / (this.n - 1);
    this.pts = new Float32Array(this.n * 3);
    this.tans = new Float32Array(this.n * 3);
    const p = new THREE.Vector3();
    const t = new THREE.Vector3();
    for (let i = 0; i < this.n; i++) {
      const u = i / (this.n - 1);
      this.curve.getPointAt(u, p);
      this.curve.getTangentAt(u, t).normalize();
      this.pts.set([p.x, p.y, p.z], i * 3);
      this.tans.set([t.x, t.y, t.z], i * 3);
    }
  }

  /** The point s along (clamped). */
  at(s: number, out: THREE.Vector3): THREE.Vector3 {
    const f = Math.min(this.n - 1.0001, Math.max(0, s / this.step));
    const i = Math.floor(f);
    const k = f - i;
    const a = i * 3;
    const b = a + 3;
    return out.set(
      this.pts[a] + (this.pts[b] - this.pts[a]) * k,
      this.pts[a + 1] + (this.pts[b + 1] - this.pts[a + 1]) * k,
      this.pts[a + 2] + (this.pts[b + 2] - this.pts[a + 2]) * k
    );
  }

  /** The unit tangent s along. */
  tangent(s: number, out: THREE.Vector3): THREE.Vector3 {
    const f = Math.min(this.n - 1.0001, Math.max(0, s / this.step));
    const i = Math.floor(f);
    const k = f - i;
    const a = i * 3;
    const b = a + 3;
    return out
      .set(
        this.tans[a] + (this.tans[b] - this.tans[a]) * k,
        this.tans[a + 1] + (this.tans[b + 1] - this.tans[a + 1]) * k,
        this.tans[a + 2] + (this.tans[b + 2] - this.tans[a + 2]) * k
      )
      .normalize();
  }

  /** The rail frame s along: tangent, a level side vector, and the up under it. */
  frame(s: number, T: THREE.Vector3, side: THREE.Vector3, up: THREE.Vector3) {
    this.tangent(s, T);
    side.crossVectors(T, UP);
    if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
    side.normalize();
    up.crossVectors(side, T).normalize();
  }

  /** How far along the path a point is, roughly (for building). */
  nearest(p: THREE.Vector3): number {
    let best = 0;
    let bd = Infinity;
    for (let i = 0; i < this.n; i++) {
      const dx = this.pts[i * 3] - p.x;
      const dy = this.pts[i * 3 + 1] - p.y;
      const dz = this.pts[i * 3 + 2] - p.z;
      const d = dx * dx + dy * dy + dz * dz;
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    return best * this.step;
  }
}

/** A helix: radius r round (cx, cz), from angle a0 to a1 (radians), rising y0 → y1. */
export class Helix extends THREE.Curve<THREE.Vector3> {
  constructor(
    public cx: number,
    public cz: number,
    public r: number,
    public a0: number,
    public a1: number,
    public y0: number,
    public y1: number
  ) {
    super();
  }
  getPoint(u: number, out = new THREE.Vector3()) {
    const a = this.a0 + (this.a1 - this.a0) * u;
    return out.set(this.cx + Math.cos(a) * this.r, this.y0 + (this.y1 - this.y0) * u, this.cz + Math.sin(a) * this.r);
  }
}
