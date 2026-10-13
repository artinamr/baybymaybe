import * as THREE from "three";
import { BODY, Figure } from "./figure";
import { phone as phoneGeo } from "./places";
import { satinMat } from "./mats";

/**
 * THE PEOPLE'S POSES. A pose is data: where the figure stands and faces,
 * the angles of its body, where its hands and feet go (and how they turn),
 * and what it looks at. Poses are made by the beats of the story (sitting
 * with a phone, typing, standing, walking) as pure functions of the film's
 * clock and real time (breath, small life), blended across each change of
 * beat, then put on a figure (two-bone IK for the limbs).
 */

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
type E3 = [number, number, number];
export type End = { p: THREE.Vector3; pole: THREE.Vector3; q: THREE.Quaternion | null };
export type Pose = {
  root: THREE.Vector3;
  yaw: number;
  hip: THREE.Vector3;
  hipR: E3;
  spine: E3;
  chest: E3;
  neck: E3;
  head: E3;
  look: THREE.Vector3 | null;
  lookK: number;
  hands: [End, End];
  feet: [End, End];
  /** A held phone: its world place and turn (or null), and which hand it follows. */
  phone: { p: THREE.Vector3; q: THREE.Quaternion } | null;
  visible: number;
};

export function newPose(): Pose {
  const end = (): End => ({ p: new THREE.Vector3(), pole: V(0, 0, 1), q: null });
  return {
    root: new THREE.Vector3(),
    yaw: 0,
    hip: V(0, BODY.hip, 0),
    hipR: [0, 0, 0],
    spine: [0, 0, 0],
    chest: [0, 0, 0],
    neck: [0, 0, 0],
    head: [0, 0, 0],
    look: null,
    lookK: 0,
    hands: [end(), end()],
    feet: [end(), end()],
    phone: null,
    visible: 1,
  };
}

const lerpE = (a: E3, b: E3, k: number, o: E3): E3 => {
  o[0] = a[0] + (b[0] - a[0]) * k;
  o[1] = a[1] + (b[1] - a[1]) * k;
  o[2] = a[2] + (b[2] - a[2]) * k;
  return o;
};
const wrapPi = (x: number) => x - Math.PI * 2 * Math.round(x / (Math.PI * 2));

/** Blend two poses (k = 0 → a, 1 → b) into out. */
export function blend(a: Pose, b: Pose, k: number, out: Pose): Pose {
  if (k <= 0) return copyPose(a, out);
  if (k >= 1) return copyPose(b, out);
  out.root.lerpVectors(a.root, b.root, k);
  out.yaw = a.yaw + wrapPi(b.yaw - a.yaw) * k;
  out.hip.lerpVectors(a.hip, b.hip, k);
  lerpE(a.hipR, b.hipR, k, out.hipR);
  lerpE(a.spine, b.spine, k, out.spine);
  lerpE(a.chest, b.chest, k, out.chest);
  lerpE(a.neck, b.neck, k, out.neck);
  lerpE(a.head, b.head, k, out.head);
  if (a.look && b.look) {
    out.look = (out.look ?? new THREE.Vector3()).lerpVectors(a.look, b.look, k);
    out.lookK = a.lookK + (b.lookK - a.lookK) * k;
  } else if (a.look || b.look) {
    out.look = (out.look ?? new THREE.Vector3()).copy((a.look ?? b.look)!);
    out.lookK = a.look ? a.lookK * (1 - k) : b.lookK * k;
  } else out.look = null;
  for (const key of ["hands", "feet"] as const)
    for (let i = 0; i < 2; i++) {
      const A = a[key][i];
      const B = b[key][i];
      const O = out[key][i];
      O.p.lerpVectors(A.p, B.p, k);
      O.pole.lerpVectors(A.pole, B.pole, k);
      if (A.q && B.q) O.q = (O.q ?? new THREE.Quaternion()).slerpQuaternions(A.q, B.q, k);
      else O.q = A.q ?? B.q ? (O.q ?? new THREE.Quaternion()).copy((k < 0.5 ? A.q ?? B.q : B.q ?? A.q)!) : null;
    }
  if (a.phone && b.phone) {
    out.phone = out.phone ?? { p: new THREE.Vector3(), q: new THREE.Quaternion() };
    out.phone.p.lerpVectors(a.phone.p, b.phone.p, k);
    out.phone.q.slerpQuaternions(a.phone.q, b.phone.q, k);
  } else out.phone = (k < 0.5 ? a.phone : b.phone) ? { p: (k < 0.5 ? a.phone : b.phone)!.p.clone(), q: (k < 0.5 ? a.phone : b.phone)!.q.clone() } : null;
  out.visible = a.visible + (b.visible - a.visible) * k;
  return out;
}

export function copyPose(a: Pose, o: Pose): Pose {
  o.root.copy(a.root);
  o.yaw = a.yaw;
  o.hip.copy(a.hip);
  lerpE(a.hipR, a.hipR, 0, o.hipR);
  lerpE(a.spine, a.spine, 0, o.spine);
  lerpE(a.chest, a.chest, 0, o.chest);
  lerpE(a.neck, a.neck, 0, o.neck);
  lerpE(a.head, a.head, 0, o.head);
  o.look = a.look ? (o.look ?? new THREE.Vector3()).copy(a.look) : null;
  o.lookK = a.lookK;
  for (const key of ["hands", "feet"] as const)
    for (let i = 0; i < 2; i++) {
      o[key][i].p.copy(a[key][i].p);
      o[key][i].pole.copy(a[key][i].pole);
      o[key][i].q = a[key][i].q ? (o[key][i].q ?? new THREE.Quaternion()).copy(a[key][i].q!) : null;
    }
  o.phone = a.phone ? { p: a.phone.p.clone(), q: a.phone.q.clone() } : null;
  o.visible = a.visible;
  return o;
}

/** Put a pose on a figure. */
export function apply(fig: Figure, p: Pose) {
  fig.root.visible = p.visible > 0.01;
  if (!fig.root.visible) return;
  fig.rest();
  fig.place(p.root.x, p.root.y, p.root.z, p.yaw);
  fig.body(p.hipR[0], p.hipR[1], p.hipR[2], p.spine, p.chest, p.neck, p.head, p.hip);
  fig.root.updateMatrixWorld(true);
  for (let i = 0; i < 2; i++) fig.reach(fig.legs[i], p.feet[i].p, p.feet[i].pole, p.feet[i].q);
  for (let i = 0; i < 2; i++) fig.reach(fig.arms[i], p.hands[i].p, p.hands[i].pole, p.hands[i].q);
  if (p.look) fig.look(p.look, p.lookK);
}

/* ------------------------------------------------------------------ */
/* Helpers in a person's own frame (+Z forward, +X their left)          */
/* ------------------------------------------------------------------ */

const _q = new THREE.Quaternion();
const _v = new THREE.Vector3();
function frame(root: THREE.Vector3, yaw: number) {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return {
    p: (x: number, y: number, z: number, out = new THREE.Vector3()) => out.set(root.x + x * c + z * s, root.y + y, root.z - x * s + z * c),
    /** A unit direction in the frame. */
    d: (x: number, y: number, z: number, out = new THREE.Vector3()) => out.set(x * c + z * s, y, -x * s + z * c).normalize(),
    /** An offset in the frame (not normalised). */
    o: (x: number, y: number, z: number, out = new THREE.Vector3()) => out.set(x * c + z * s, y, -x * s + z * c),
    q: (rx: number, ry: number, rz: number, out = new THREE.Quaternion()) => out.setFromEuler(new THREE.Euler(rx, ry + yaw, rz, "YXZ")),
  };
}

/** Slow breath: 0..1, about 15 a minute. */
const breath = (t: number) => 0.5 + 0.5 * Math.sin(t * 1.6);
/** A smooth noise in time (a few sines), roughly -1..1. */
export const wob = (t: number, seed = 0) => (Math.sin(t * 0.73 + seed * 1.7) * 0.55 + Math.sin(t * 1.31 + seed * 3.1) * 0.3 + Math.sin(t * 2.17 + seed * 0.4) * 0.15);

/**
 * SITTING ON A SOFA WITH A PHONE. `seat`: the hip point; `yaw`: facing;
 * `floor`: the floor's height. `raise` 0 (phone low in the lap) … 1 (held up
 * to read); `thumb` 0..1 how busy the thumb is (scrolling, typing);
 * `lean` 0 (upright) … 1 (sunk back into the cushions).
 */
export function sofaPhone(o: Pose, seat: THREE.Vector3, yaw: number, floor: number, t: number, raise: number, thumb: number, lean: number) {
  const root = V(seat.x, floor, seat.z);
  const F = frame(root, yaw);
  o.root.copy(root);
  o.yaw = yaw;
  const sh = seat.y - floor;
  const br = breath(t);
  o.hip.set(0, sh + 0.08, -0.03 - lean * 0.05);
  o.hipR = [-0.28 - lean * 0.14, 0, 0];
  o.spine = [0.16 + lean * 0.02, 0, 0.0];
  o.chest = [0.14 + br * 0.015 + raise * 0.03, 0.02 * wob(t, 2), 0];
  o.neck = [0.3 - raise * 0.08, 0, 0];
  o.head = [0.36 - raise * 0.12, 0.04 * wob(t * 0.5, 5), 0];
  // The phone: low over the lap, or up in front of the face.
  const ph = F.p(0.0, sh + 0.5 + raise * 0.14 - lean * 0.03, 0.17 + raise * 0.05 + 0.012 * wob(t * 0.4, 3));
  const face = F.p(0, sh + 0.8 - lean * 0.06, 0.02 - lean * 0.06);
  // The screen faces the face; the phone's top leans away.
  const n = face.clone().sub(ph).normalize();
  const up = F.d(0, 1, 0).addScaledVector(n, -F.d(0, 1, 0).dot(n)).normalize();
  const xr = new THREE.Vector3().crossVectors(up, n).normalize();
  const m = new THREE.Matrix4().makeBasis(xr, up, n);
  const pq = new THREE.Quaternion().setFromRotationMatrix(m);
  o.phone = o.phone ?? { p: new THREE.Vector3(), q: new THREE.Quaternion() };
  o.phone.p.copy(ph);
  o.phone.q.copy(pq);
  o.look = ph.clone();
  o.lookK = 0.85;
  // Hands: cupping the phone from below, the right thumb working.
  const tap = thumb > 0 ? Math.max(0, Math.sin(t * 13.0 + Math.sin(t * 3.1) * 2)) * 0.006 * thumb : 0;
  for (let i = 0; i < 2; i++) {
    const sg = i === 0 ? 1 : -1;
    // Phone-local: x to the phone's right (= the person's left? the screen faces them: its +x is their left... no: their right).
    const local = V(-sg * 0.046, -0.1 + (i === 1 ? tap : 0), -0.03);
    const w = local.applyQuaternion(pq).add(ph);
    o.hands[i].p.copy(w);
    o.hands[i].pole.copy(F.d(sg * 0.35, -1.0, -0.25));
    const fingers = up.clone().addScaledVector(xr, sg * 0.12).addScaledVector(n, -0.25).normalize();
    const palm = n.clone().negate().addScaledVector(xr, sg * 0.55).normalize();
    o.hands[i].q = Figure.handQ(fingers, palm, o.hands[i].q ?? new THREE.Quaternion());
  }
  // Feet: flat on the floor in front, a little apart, one forward.
  for (let i = 0; i < 2; i++) {
    const sg = i === 0 ? 1 : -1;
    o.feet[i].p.copy(F.p(sg * 0.13, 0.075, 0.38 + (i === 0 ? 0.04 : -0.03) + lean * 0.06));
    o.feet[i].pole.copy(F.d(sg * 0.15, 0.2, 1));
    o.feet[i].q = Figure.footQ(F.d(sg * 0.12, 0, 1), o.feet[i].q ?? new THREE.Quaternion());
  }
  o.visible = 1;
  return o;
}

/**
 * AT THE DESK, TYPING. `keys`: the keyboard's middle (world). `busy` 0..1
 * how hard they type; `slump` 0 (upright) … 1 (late, tired, leaning in).
 */
export function deskType(o: Pose, seat: THREE.Vector3, yaw: number, floor: number, keys: THREE.Vector3, t: number, busy: number, slump: number) {
  const root = V(seat.x, floor, seat.z);
  const F = frame(root, yaw);
  o.root.copy(root);
  o.yaw = yaw;
  const sh = seat.y - floor;
  const br = breath(t);
  o.hip.set(0, sh + 0.02, 0.02);
  o.hipR = [-0.06 - slump * 0.05, 0, 0];
  o.spine = [0.1 + slump * 0.12, 0, 0];
  o.chest = [0.06 + br * 0.012 + slump * 0.1, 0.015 * wob(t, 1), 0];
  o.neck = [0.12 + slump * 0.08, 0, 0];
  o.head = [0.2 + slump * 0.06, 0.03 * wob(t * 0.6, 4), 0];
  o.look = keys.clone().add(F.d(0, 0, 1).multiplyScalar(0.12)).setY(keys.y + 0.14);
  o.lookK = 0.75;
  // Hands on the keys, palms down, fingers forward; each bobbing as it types.
  for (let i = 0; i < 2; i++) {
    const sg = i === 0 ? 1 : -1;
    const ph = t * 9.0 + i * 1.9;
    const tap = busy * (Math.max(0, Math.sin(ph + Math.sin(ph * 0.37) * 2.2)) * 0.008 + Math.max(0, Math.sin(ph * 0.5 + 1)) * 0.004);
    const wrist = keys.clone().add(F.o(sg * 0.095, 0, -0.105));
    wrist.y = keys.y + 0.022 + tap;
    o.hands[i].p.copy(wrist);
    o.hands[i].pole.copy(F.d(sg * 0.7, -1, -0.6));
    o.hands[i].q = Figure.handQ(F.d(-sg * 0.25, -0.35, 1), V(0, -1, 0), o.hands[i].q ?? new THREE.Quaternion());
  }
  for (let i = 0; i < 2; i++) {
    const sg = i === 0 ? 1 : -1;
    o.feet[i].p.copy(F.p(sg * 0.14, 0.075, 0.36 + (i === 0 ? 0.05 : -0.02)));
    o.feet[i].pole.copy(F.d(sg * 0.1, 0.25, 1));
    o.feet[i].q = Figure.footQ(F.d(sg * 0.15, 0, 1), o.feet[i].q ?? new THREE.Quaternion());
  }
  o.phone = null;
  o.visible = 1;
  return o;
}

/** STANDING, arms at rest. */
export function stand(o: Pose, at: THREE.Vector3, yaw: number, t: number, look: THREE.Vector3 | null = null) {
  const F = frame(at, yaw);
  o.root.copy(at);
  o.yaw = yaw;
  const br = breath(t);
  const sway = wob(t * 0.4, 7) * 0.012;
  o.hip.set(sway, BODY.hip - 0.012, 0);
  o.hipR = [0.02, 0, sway * 0.6];
  o.spine = [-0.02, 0, -sway * 0.4];
  o.chest = [-0.02 - br * 0.01, 0, 0];
  o.neck = [0.04, 0, 0];
  o.head = [0.05, 0, 0];
  o.look = look ? look.clone() : null;
  o.lookK = look ? 0.8 : 0;
  for (let i = 0; i < 2; i++) {
    const sg = i === 0 ? 1 : -1;
    o.hands[i].p.copy(F.p(sg * 0.235 + sway, BODY.hip - 0.12, 0.03));
    o.hands[i].pole.copy(F.d(sg * 0.3, 0, -1));
    o.hands[i].q = Figure.handQ(F.d(0, -1, 0.05), F.d(-sg, 0, 0), o.hands[i].q ?? new THREE.Quaternion());
    o.feet[i].p.copy(F.p(sg * 0.105, 0.075, i === 0 ? 0.02 : -0.03));
    o.feet[i].pole.copy(F.d(sg * 0.1, 0, 1));
    o.feet[i].q = Figure.footQ(F.d(sg * 0.16, 0, 1), o.feet[i].q ?? new THREE.Quaternion());
  }
  o.phone = null;
  o.visible = 1;
  return o;
}

/** STANDING WITH A PHONE held up to read (`raise` 0 low … 1 up), the thumb busy by `thumb`. */
export function standPhone(o: Pose, at: THREE.Vector3, yaw: number, t: number, raise: number, thumb: number) {
  stand(o, at, yaw, t, null);
  const F = frame(at, yaw);
  const ph = F.p(0.02, 1.12 + raise * 0.16, 0.3 + 0.012 * wob(t * 0.4, 3));
  const face = F.p(0, 1.6, 0.06);
  const n = face.clone().sub(ph).normalize();
  const up = F.d(0, 1, 0).addScaledVector(n, -F.d(0, 1, 0).dot(n)).normalize();
  const xr = new THREE.Vector3().crossVectors(up, n).normalize();
  const pq = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xr, up, n));
  o.phone = o.phone ?? { p: new THREE.Vector3(), q: new THREE.Quaternion() };
  o.phone.p.copy(ph);
  o.phone.q.copy(pq);
  o.head = [0.3 - raise * 0.12, 0, 0];
  o.neck = [0.2 - raise * 0.08, 0, 0];
  o.look = ph.clone();
  o.lookK = 0.8;
  const tap = thumb > 0 ? Math.max(0, Math.sin(t * 12.0 + Math.sin(t * 2.7) * 2)) * 0.006 * thumb : 0;
  for (let i = 0; i < 2; i++) {
    const sg = i === 0 ? 1 : -1;
    const w = V(-sg * 0.046, -0.1 + (i === 1 ? tap : 0), -0.03).applyQuaternion(pq).add(ph);
    o.hands[i].p.copy(w);
    o.hands[i].pole.copy(F.d(sg * 0.35, -1.0, -0.25));
    const fingers = up.clone().addScaledVector(xr, sg * 0.12).addScaledVector(n, -0.25).normalize();
    const palm = n.clone().negate().addScaledVector(xr, sg * 0.55).normalize();
    o.hands[i].q = Figure.handQ(fingers, palm, o.hands[i].q ?? new THREE.Quaternion());
  }
  return o;
}

/**
 * WALKING along a path (world points on the floor) at `s` metres along it.
 * Each foot is planted where it lands and stays there while the body passes
 * over it, then swings to its next mark: no sliding. The hips bob and sway,
 * the arms swing against the legs.
 */
export function walk(o: Pose, path: THREE.Vector3[], s: number, t: number, floor = 0, look: THREE.Vector3 | null = null) {
  const L = 0.66;
  const total = pathLength(path);
  const ss = Math.max(0, Math.min(total, s));
  const at = pointAt(path, ss);
  const ahead = pointAt(path, Math.min(total, ss + 0.4));
  const behind = pointAt(path, Math.max(0, ss - 0.4));
  const dir = ahead.clone().sub(behind);
  dir.y = 0;
  if (dir.lengthSq() < 1e-6) dir.set(0, 0, 1);
  dir.normalize();
  const yaw = Math.atan2(dir.x, dir.z);
  const moving = Math.min(1, ss / 0.4, (total - ss) / 0.4);
  stand(o, V(at.x, floor, at.z), yaw, t, look);
  const side = V(dir.z, 0, -dir.x);
  const phase = ss / (2 * L);
  for (let i = 0; i < 2; i++) {
    const off = i === 0 ? 0 : 0.5;
    const c = phase - off;
    const n = Math.floor(c);
    const f = c - n;
    const stance = 0.6;
    const land = (m: number) => {
      const sp = Math.max(0, Math.min(total, (m + off) * 2 * L + L * 0.3));
      const p = pointAt(path, sp);
      return V(p.x, floor, p.z).addScaledVector(side, (i === 0 ? 1 : -1) * 0.1);
    };
    let p: THREE.Vector3;
    let lift = 0;
    if (f < stance) p = land(n);
    else {
      const u = (f - stance) / (1 - stance);
      const e = u * u * (3 - 2 * u);
      p = land(n).lerp(land(n + 1), e);
      lift = Math.sin(u * Math.PI) * 0.12;
    }
    // Standing still at either end: both feet beside each other.
    const restP = V(at.x, floor, at.z).addScaledVector(side, (i === 0 ? 1 : -1) * 0.105);
    p.lerp(restP, 1 - moving);
    p.y = floor + 0.075 + lift * moving;
    o.feet[i].p.copy(p);
    o.feet[i].pole.copy(dir);
    o.feet[i].q = Figure.footQ(dir, o.feet[i].q ?? new THREE.Quaternion());
    // Arms swing against the legs.
    const swing = Math.sin((phase - off) * Math.PI * 2) * 0.2 * moving;
    o.hands[1 - i].p.addScaledVector(dir, swing);
  }
  // The body: down at double support, up over each foot; a little sway.
  const bob = (Math.cos(phase * Math.PI * 4) * 0.5 + 0.5) * 0.035 * moving;
  o.hip.y = BODY.hip - 0.04 - bob + 0.02 * (1 - moving);
  o.hip.x += Math.sin(phase * Math.PI * 2) * 0.02 * moving;
  o.hipR[1] += Math.sin(phase * Math.PI * 2) * 0.1 * moving;
  o.chest[1] -= Math.sin(phase * Math.PI * 2) * 0.12 * moving;
  o.spine[0] += 0.04 * moving;
  return o;
}

export function pathLength(path: THREE.Vector3[]) {
  let L = 0;
  for (let i = 1; i < path.length; i++) L += Math.hypot(path[i].x - path[i - 1].x, path[i].z - path[i - 1].z);
  return L;
}
export function pointAt(path: THREE.Vector3[], s: number) {
  let acc = 0;
  for (let i = 1; i < path.length; i++) {
    const d = Math.hypot(path[i].x - path[i - 1].x, path[i].z - path[i - 1].z);
    if (s <= acc + d) return path[i - 1].clone().lerp(path[i], d > 0 ? (s - acc) / d : 0);
    acc += d;
  }
  return path[path.length - 1].clone();
}

/** The person's phone: a body and a screen (its material's map is the phone's UI). */
export function makePhone() {
  const g = phoneGeo();
  const group = new THREE.Group();
  const body = new THREE.Mesh(g.body, satinMat(0x202024, 0.3, 0.4));
  body.castShadow = true;
  const screen = new THREE.Mesh(g.screen, new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));
  group.add(body, screen);
  return { group, body, screen, W: g.W, H: g.H };
}

/** Put the phone where the pose holds it. */
export function placePhone(ph: { group: THREE.Group }, p: Pose) {
  ph.group.visible = !!p.phone && p.visible > 0.01;
  if (!p.phone) return;
  ph.group.position.copy(p.phone.p);
  ph.group.quaternion.copy(p.phone.q);
}

export { _q, _v };
