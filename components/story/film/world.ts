import * as THREE from "three";
import { buildHall } from "./hall";
import { buildLayout, CRANK, DESK, DISH, EDGE, FLOOR_Y, GANTRY_Y, GANTRY_Z, GATE_X, GATE_Y, PIPE_Z, TRAYS, WHEEL, type Layout } from "./layout";
import { buildOld, HANDLE_R, pieceMatrix, type OldRig } from "./old";
import { buildNew, type NewRig } from "./next";
import { chromeMaterial, clothMaterial, coreMaterial, glassMaterial, ironMaterial, lightMaterial, shared } from "./materials";
import { Sim, type SimEvent, type Tune } from "./sim";
import { heroAt, heroInit, type HeroState } from "./hero";
import { Marbles } from "./marbles";
import { cameraAt, type CamOut } from "./camera";
import { lookAt, newLook, type Look } from "./look";
import { Post, makeGrade, type Grade } from "./post";
import { bump, clamp01, range, smooth } from "./ease";
import type { Kit, Piece } from "./kit";
import type { Quality } from "../store";
import { RESTS } from "../timeline";

/**
 * THE WORLD: everything the film draws, and what moves it each frame.
 *
 *   look      the chapter's colour (fog, lights, windows, grade)
 *   crowd     the simulation, in real time (frozen and slowed at the turn)
 *   hero      our customer, from the film's clock
 *   rig       every moving part: gates, gauge, the wheel of hours, the hatch,
 *             claws, stamp, tubes, gears, crank, the person at it, the lamp
 *   turn      the old machine coming apart; the new one assembling
 *   camera    the flight, its breath, its lean toward the pointer
 */

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** The film's clock face: P → hours after midnight (the wheel of hours keeps the film's time). */
export function clockAt(P: number): number {
  const seg: [number, number][] = [
    [0, 19.0],
    [4.6, 19 + 40 / 60],
    [5.3, 19 + 40 / 60],
    [6.72, 24 + 9 + 12 / 60],
    [7.3, 24 + 9.5],
    [11.6, 24 + 16.2],
    // The evening goes by while we rise to the owner: 11:47pm by the time we're there.
    [12.25, 24 + 23 + 47 / 60],
    [14, 24 + 23 + 47 / 60],
    [16.9, 24 + 26.5],
    [18.6, 48 + 2 + 58 / 60],
    [20.2, 48 + 3 + 4 / 60],
    [23.9, 48 + 17.6],
    [24.62, 48 + 18],
    [27.4, 48 + 18.2],
  ];
  for (let i = 0; i < seg.length - 1; i++) {
    const [a, ha] = seg[i];
    const [b, hb] = seg[i + 1];
    if (P <= b) return ha + (hb - ha) * smooth(range(P, a, b));
  }
  return seg[seg.length - 1][1];
}

export type Frame = { dt: number; time: number; P: number; pointer: { x: number; y: number; has: boolean } };

export class World {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly post: Post;
  readonly L: Layout;
  readonly sim: Sim;
  readonly hero: HeroState = heroInit();
  readonly look: Look = newLook();
  readonly grade: Grade = makeGrade();
  readonly marbles: Marbles;
  private fog: THREE.FogExp2;
  private old: { kit: Kit; rig: OldRig; mats: THREE.Material[] };
  private nw: { kit: Kit; rig: NewRig; mats: THREE.Material[] };
  private lights: { hemi: THREE.HemisphereLight; key: THREE.DirectionalLight; fill: THREE.DirectionalLight; hero: THREE.PointLight; zone: THREE.PointLight };
  private hall: ReturnType<typeof buildHall>;
  private cables: THREE.InstancedMesh;
  private flakes: THREE.InstancedMesh;
  private flakeData: Float32Array;
  private sparks: THREE.InstancedMesh;
  private sparkData: Float32Array;
  private tear: Float32Array;
  private keep: Uint8Array;
  private cam: CamOut = { eye: new THREE.Vector3(), at: new THREE.Vector3(), fov: 35, ppx: 0.5, ppy: 0.5, roll: 0 };
  private lean = { x: 0, y: 0 };
  private crankA = 0;
  private machine: "old" | "none" | "new" = "old";
  private ringPow: Float32Array;
  private nodePow = new Float32Array(3);
  private prevP = 0;
  private lampOff = false;
  readonly phone: boolean;
  private quality: Quality;
  /** Reduced motion: the camera holds each composed frame, and fades between them. */
  private reduced: boolean;
  private restP = -1;
  private fadeT = -10;
  /** What the pointer is over (a part of the machine), for the label. */
  hover: string | null = null;
  private ray = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  /** This frame's events (the sound and the counter read them). */
  events: SimEvent[] = [];
  /** A short summary of the frame the page's words need. */
  info = { hours: 19, machine: "old" as "old" | "none" | "new", at: "door", speed: 0, heroY: 0, turn: 0 };

  constructor(
    private renderer: THREE.WebGLRenderer,
    opts: { phone: boolean; quality: Quality; reduced?: boolean }
  ) {
    this.phone = opts.phone;
    this.quality = opts.quality;
    this.reduced = !!opts.reduced;
    const wide = !opts.phone;
    this.L = buildLayout(wide);
    this.camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.05, 1200);
    this.fog = new THREE.FogExp2(0x000000, 0.01);
    this.scene.fog = this.fog;
    this.scene.background = new THREE.Color(0, 0, 0);

    // A room for the metal to reflect: dark, a few soft strips.
    this.scene.environment = this.makeEnv();

    const hemi = new THREE.HemisphereLight(0x332211, 0x050403, 0.3);
    const key = new THREE.DirectionalLight(0xffaa66, 2);
    key.position.set(-20, 40, -30);
    const fill = new THREE.DirectionalLight(0x8899cc, 0.3);
    fill.position.set(10, 10, 40);
    const hero = new THREE.PointLight(0xffaa55, 0, 6, 2);
    const zone = new THREE.PointLight(0xffffff, 0, 16, 2);
    this.scene.add(hemi, key, key.target, fill, fill.target, hero, zone);
    this.lights = { hemi, key, fill, hero, zone };

    this.hall = buildHall(opts.phone);
    this.scene.add(this.hall.group);

    // THE OLD MACHINE.
    const o = buildOld(this.L);
    const otex = o.kit.texture();
    const iron = ironMaterial(otex);
    const olight = lightMaterial(otex);
    const cloth = clothMaterial(otex);
    for (const [bucket, mat] of [
      ["iron", iron],
      ["light", olight],
      ["cloth", cloth],
    ] as const) {
      const g = o.kit.geometry(bucket);
      if (!g) continue;
      const mesh = new THREE.Mesh(g, mat);
      mesh.frustumCulled = false;
      this.scene.add(mesh);
    }
    for (const l of o.rig.labels) this.scene.add(l.mesh);
    this.old = { kit: o.kit, rig: o.rig, mats: [iron, olight, cloth] };
    // Which pieces stay (the owner's desk, chair and lamp), and each one's fall.
    this.keep = new Uint8Array(o.kit.pieces.length);
    this.tear = new Float32Array(o.kit.pieces.length * 8);
    let s = 99;
    const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
    for (const p of o.kit.pieces) {
      const k = p.id * 8;
      if (["desk", "shade", "bulb", "chair", "laptop", "lid"].includes(p.tag)) this.keep[p.id] = 1;
      const out = V(p.pivot.x, 0, p.pivot.z + 1);
      if (out.lengthSq() < 0.01) out.set(r() - 0.5, 0, r() - 0.5);
      out.normalize().multiplyScalar(0.8 + r() * 2.4);
      this.tear[k] = 14.98 + ((54 - p.pivot.y) / 64) * 0.42 + r() * 0.16;
      this.tear[k + 1] = out.x + (r() - 0.5) * 1.2;
      this.tear[k + 2] = r() * 1.6 - 0.2;
      this.tear[k + 3] = out.z + (r() - 0.5) * 1.2;
      this.tear[k + 4] = r() - 0.5;
      this.tear[k + 5] = r() - 0.5;
      this.tear[k + 6] = r() - 0.5;
      this.tear[k + 7] = 0.4 + r() * 1.8;
    }
    // A few gears are thrown past the lens (not with reduced motion).
    const gears = o.rig.gears.map((g) => g.p);
    for (const [gi, side] of this.reduced ? [] : [
      [0, 1],
      [2, -1],
      [4, 1],
    ] as const) {
      const p = gears[gi];
      if (!p) continue;
      const k = p.id * 8;
      const target = V(0.6 + side * 1.7, 37.2 + side * 0.6, 12.5);
      const T = 2.0;
      this.tear[k] = 15.18 + gi * 0.06;
      this.tear[k + 1] = (target.x - p.pivot.x) / T;
      this.tear[k + 2] = (target.y - p.pivot.y) / T + 0.5 * 2.6 * T;
      this.tear[k + 3] = (target.z - p.pivot.z) / T;
    }

    // THE NEW MACHINE.
    const n = buildNew(this.L);
    const ntex = n.kit.texture();
    const glass = glassMaterial(ntex);
    const core = coreMaterial(ntex);
    const chrome = chromeMaterial(ntex);
    const nlight = lightMaterial(ntex);
    for (const [bucket, mat, order] of [
      ["chrome", chrome, 0],
      ["core", core, 0],
      ["light", nlight, 0],
      ["glass", glass, 5],
    ] as const) {
      const g = n.kit.geometry(bucket);
      if (!g) continue;
      const mesh = new THREE.Mesh(g, mat);
      mesh.frustumCulled = false;
      mesh.renderOrder = order;
      this.scene.add(mesh);
    }
    this.nw = { kit: n.kit, rig: n.rig, mats: [glass, core, chrome, nlight] };
    this.ringPow = new Float32Array(this.L.lanes.length);

    // The claws' cables (they stretch, so they are drawn on their own).
    this.cables = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x24211c, metalness: 0.6, roughness: 0.6 }), 4);
    this.cables.frustumCulled = false;
    this.scene.add(this.cables);

    // Rust that flakes off as it comes apart.
    const nf = opts.phone ? 380 : 1100;
    this.flakes = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(0.09, 0.055),
      new THREE.MeshStandardMaterial({ color: 0x5a2410, roughness: 0.95, metalness: 0.2, side: THREE.DoubleSide }),
      nf
    );
    this.flakes.frustumCulled = false;
    this.flakes.count = 0;
    this.scene.add(this.flakes);
    this.flakeData = new Float32Array(nf * 8);
    const ib = o.kit.buckets.get("iron")!;
    for (let i = 0; i < nf; i++) {
      const v = Math.floor(r() * (ib.pos.length / 3));
      const pid = ib.piece[v];
      const k = i * 8;
      this.flakeData[k] = ib.pos[v * 3];
      this.flakeData[k + 1] = ib.pos[v * 3 + 1];
      this.flakeData[k + 2] = ib.pos[v * 3 + 2];
      this.flakeData[k + 3] = this.tear[pid * 8] - 0.06 + r() * 0.1;
      this.flakeData[k + 4] = (r() - 0.5) * 2.2;
      this.flakeData[k + 5] = r() * 1.4;
      this.flakeData[k + 6] = (r() - 0.5) * 2.2;
      this.flakeData[k + 7] = r() * 6.28;
    }

    // Sparks where it breaks.
    const ns = opts.phone ? 160 : 420;
    this.sparks = new THREE.InstancedMesh(new THREE.SphereGeometry(0.022, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, fog: false }), ns);
    this.sparks.frustumCulled = false;
    this.sparks.count = 0;
    this.scene.add(this.sparks);
    this.sparkData = new Float32Array(ns * 8);
    const sc = new THREE.Color();
    for (let i = 0; i < ns; i++) {
      const p = o.kit.pieces[Math.floor(r() * o.kit.pieces.length)];
      const k = i * 8;
      this.sparkData[k] = p.pivot.x + (r() - 0.5) * p.size * 0.6;
      this.sparkData[k + 1] = p.pivot.y + (r() - 0.5) * 0.6;
      this.sparkData[k + 2] = p.pivot.z + (r() - 0.5) * 0.6;
      this.sparkData[k + 3] = this.tear[p.id * 8] + r() * 0.05;
      this.sparkData[k + 4] = (r() - 0.5) * 9;
      this.sparkData[k + 5] = r() * 6;
      this.sparkData[k + 6] = (r() - 0.5) * 9;
      this.sparkData[k + 7] = 0.25 + r() * 0.6;
      sc.setRGB(5 + r() * 3, 2.2 + r() * 1.5, 0.6 + r() * 0.5);
      this.sparks.setColorAt(i, sc);
    }

    // THE CUSTOMERS.
    // Enough customers that the lost ones fall as rivers of light.
    const tune: Tune = opts.phone
      ? { spawn: 0.9, gatePeriod: 1.7, gateOpen: 0.5, valve: 2.2, clawCycle: 3.6, slip: 0.22, nSpawn: 1.3 }
      : { spawn: 0.62, gatePeriod: 1.6, gateOpen: 0.5, valve: 2.0, clawCycle: 3.4, slip: 0.22, nSpawn: 1.0 };
    this.sim = new Sim(this.L, opts.phone ? 420 : 900, tune);
    this.marbles = new Marbles(this.sim.n, this.sim.lakeMax, opts.phone ? 1 : 2);
    for (const obj of this.marbles.objects()) this.scene.add(obj);

    const samples = opts.quality === 0 ? 0 : 4;
    this.post = new Post(samples, opts.phone ? 5 : 6);
  }

  /** A small, dark room for reflections, with a few soft strips of light. */
  private makeEnv() {
    const pm = new THREE.PMREMGenerator(this.renderer);
    const room = new THREE.Scene();
    const box = new THREE.Mesh(new THREE.BoxGeometry(20, 12, 20), new THREE.MeshBasicMaterial({ color: 0x0c0b0a, side: THREE.BackSide }));
    room.add(box);
    const strip = (x: number, y: number, z: number, w: number, h: number, c: THREE.ColorRepresentation, k: number, ry = 0) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
      (m.material as THREE.MeshBasicMaterial).color.multiplyScalar(k);
      m.position.set(x, y, z);
      m.rotation.y = ry;
      m.lookAt(0, 0, 0);
      room.add(m);
    };
    strip(-6, 4.5, -8, 6, 1.0, 0xffd6a8, 2.2);
    strip(7, 3, -6, 1.2, 5, 0xa8c4ff, 1.4);
    strip(0, 5.8, 4, 10, 0.6, 0xffffff, 1.2);
    strip(-8, 1, 6, 1.5, 4, 0xffb27a, 0.8);
    const rt = pm.fromScene(room, 0.03);
    pm.dispose();
    return rt.texture;
  }

  /** When each new piece locks into place (the sound ticks on each). */
  lockTimes() {
    return this.nw.rig.from.map((f) => f.at + 0.34).sort((a, b) => a - b);
  }

  /** Everything that draws, for compiling before the film shows. */
  allMaterials() {
    return [...this.old.mats, ...this.nw.mats, ...this.post.materials()];
  }

  /**
   * Run the crowd ahead, so the machine is already busy when the door opens.
   * What it loses meanwhile is not counted: the counter is what you watched.
   */
  prewarm(seconds: number) {
    const s = this.sim;
    const lost = { ...s.lost };
    const kept = s.kept;
    s.machine = "old";
    s.step(seconds);
    s.events.length = 0;
    s.lost = lost;
    s.kept = kept;
  }

  setSize(w: number, h: number, dpr: number) {
    this.post.setSize(w * dpr, h * dpr);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /* ---- the frame -------------------------------------------------------------- */

  update(f: Frame) {
    const { dt, time, P } = f;
    shared.uTime.value = time;
    const look = lookAt(P, this.look);
    this.applyLook(look, P, time);

    // Which machine runs, and how fast time is: it all stops at the turn.
    const want: "old" | "none" | "new" = P < 14.02 ? "old" : P < 16.55 ? "none" : "new";
    if (want !== this.machine) {
      if (want === "new") {
        this.sim.clear();
        this.sim.machine = "new";
        this.sim.step(4);
      } else if (want === "old") {
        this.sim.clear();
        this.sim.machine = "old";
        this.prewarm(60);
      } else this.sim.machine = "none";
      this.machine = want;
    }
    let ts = this.reduced ? 0.6 : 1;
    if (P >= 13.98 && P < 16.6) ts = (1 - range(P, 13.98, 14.18)) + 0.16 * range(P, 14.95, 15.25) * (1 - range(P, 16.2, 16.5));
    this.sim.step(dt * ts);
    this.sim.ageLake(dt * ts);
    this.events = this.sim.events;
    this.sim.events = [];

    heroAt(P, this.L, this.hero, time);
    this.info.hours = clockAt(P);
    this.info.machine = this.machine;
    this.info.at = this.hero.at;
    this.info.speed = this.hero.speed;
    this.info.heroY = this.hero.pos.y;
    this.info.turn = range(P, 14, 14.2) * (1 - range(P, 16.5, 16.9));

    this.animateOld(P, dt * (ts > 0.5 ? 1 : ts), time);
    this.animateNew(P, dt, time);
    this.old.kit.upload();
    this.nw.kit.upload();
    const lm = new THREE.Matrix4();
    for (const l of this.old.rig.labels) {
      l.mesh.matrix.copy(pieceMatrix(l.piece, l.rest, lm));
      l.mesh.visible = l.piece.s > 0.01;
    }

    // Customers.
    const heroK = this.hero.visible ? 1 : 0;
    this.marbles.update(this.sim, this.hero, heroK);
    const hl = this.lights.hero;
    if (this.hero.visible) {
      hl.position.copy(this.hero.pos);
      const c = this.hero.col;
      const m = Math.max(c.r, c.g, c.b, 0.001);
      hl.color.setRGB(c.r / m, c.g / m, c.b / m);
      hl.intensity = 2.2 * m * (this.phone ? 0.8 : 1);
    } else hl.intensity = 0;

    this.flakesAt(P);
    this.cameraAt(P, f);
    this.hoverAt(f);
  }

  render(time: number) {
    // (Reduced motion: the grain holds still.)
    this.post.render(this.renderer, this.scene, this.camera, this.grade, this.reduced ? 1 : time);
  }

  private applyLook(look: Look, P: number, time: number) {
    this.fog.color.copy(look.fog);
    this.fog.density = look.fogD * (this.phone ? 0.85 : 1);
    (this.scene.background as THREE.Color).copy(look.fog);
    const L = this.lights;
    L.key.color.copy(look.key);
    L.key.intensity = look.keyK;
    L.key.position.copy(look.keyDir).multiplyScalar(60).add(V(0, 30, 0));
    L.key.target.position.set(0, 30, 0);
    L.fill.color.copy(look.fill);
    L.fill.intensity = look.fillK;
    L.hemi.color.copy(look.sky);
    L.hemi.groundColor.copy(look.ground);
    L.hemi.intensity = look.hemiK * 0.55;
    this.scene.environmentIntensity = look.env;
    shared.uKey.value.copy(look.key);
    shared.uShaft.value = look.shaft;
    shared.uDust.value = look.dust;
    shared.uWin.value.copy(look.win);
    shared.uWinK.value = look.winK * 0.42;
    (this.hall.pitGlow.material as THREE.ShaderMaterial).uniforms.uK.value = look.pit;
    // The well of red light: as long as the old machine is losing people.
    (this.hall.haze.material as THREE.ShaderMaterial).uniforms.uK.value = (1 - range(P, 14.9, 16.2)) * (0.6 + look.pit);

    // The zone light: whatever lights the part of the machine we are in.
    const z = L.zone;
    const zm = (a: number, b: number) => bump(P, a, b, 0.3);
    // The tubes' light hums, slowly and only a little (nothing that flashes).
    const flick = this.reduced ? 1 : 0.95 + 0.05 * Math.sin(time * 2.1);
    const zones: [number, THREE.Vector3, THREE.Color, number, number][] = [
      [zm(0, 4.7), V(GATE_X - 0.6, GATE_Y + 2.4, 0), new THREE.Color(1, 0.62, 0.3), 14, 14],
      [zm(4.6, 7.3), V(DISH.x + 0.5, DISH.y + 5, DISH.z + 4), new THREE.Color(0.55, 0.7, 1), 22, 16],
      [zm(7.2, 9.7), V(0.4, 32.6, 1.4), new THREE.Color(0.7, 1, 0.6), 55 * flick, 16],
      [zm(9.6, 11.8), V(EDGE.x - 0.2, EDGE.y + 0.55, EDGE.z - 0.2), new THREE.Color(1, 0.45, 0.2), 9, 9],
      [zm(12.2, 14), V(DESK.x - 0.2, FLOOR_Y + 1.5, DESK.z + 0.05), new THREE.Color(1, 0.68, 0.36), 12, 11],
      [zm(16.3, 18.7), V(GATE_X, GATE_Y + 1, 2), new THREE.Color(0.6, 0.5, 1), 22, 16],
      [zm(18.6, 20.4), V(this.L.TURB.x, this.L.TURB.y, this.L.TURB.z + 3), new THREE.Color(0.4, 0.9, 1), 26, 16],
      [zm(20.2, 22), V(0.5, 31, 2), new THREE.Color(0.4, 0.95, 1), 24, 16],
      [zm(21.9, 24.2), V(EDGE.x, 30, 6), new THREE.Color(1, 0.75, 0.35), 30, 24],
      [zm(24.0, 25.6), V(DESK.x - 0.2, FLOOR_Y + 1.5, DESK.z + 0.05), new THREE.Color(1, 0.68, 0.36), this.lampOff ? 0 : 12, 11],
    ];
    let wsum = 0;
    const pos = V(0, 0, 0);
    const col = new THREE.Color(0, 0, 0);
    let k = 0;
    let dist = 0;
    for (const [w, p, c, inten, d] of zones) {
      if (w <= 0) continue;
      wsum += w;
      pos.addScaledVector(p, w);
      col.r += c.r * w;
      col.g += c.g * w;
      col.b += c.b * w;
      k += inten * w;
      dist += d * w;
    }
    if (wsum > 0) {
      z.position.copy(pos.multiplyScalar(1 / wsum));
      z.color.setRGB(col.r / wsum, col.g / wsum, col.b / wsum);
      z.intensity = k;
      z.distance = dist / wsum;
    } else z.intensity = 0;

    // The grade, and the beats that override it.
    const g = this.grade;
    g.exposure = look.exposure;
    g.bloom = look.bloom;
    g.threshold = look.threshold;
    g.lift.copy(look.lift);
    g.gamma.copy(look.gamma);
    g.gain.copy(look.gain);
    g.sat = look.sat;
    g.shadow.copy(look.shadow);
    g.high.copy(look.high);
    g.split = look.split;
    g.vignette = look.vignette;
    g.grain = look.grain * (this.quality === 0 ? 0.8 : 1);
    g.aberration = look.aberration;
    // Admin: the tubes' flicker reaches the whole frame, a little.
    g.exposure *= 1 - 0.06 * bump(P, 7.3, 9.5, 0.2) * (1 - flick);
    // The turn: down to almost nothing; the white flash; up into the new.
    g.black = 0.86 * range(P, 14.04, 14.3) * (1 - range(P, 14.92, 15.3));
    g.flash = Math.max(0, Math.exp(-Math.pow((P - 16.12) / 0.07, 2)) * 1.0 - 0.0);
    g.flashColor.set(1, 0.99, 0.97);
    g.exposure *= 1 + 0.35 * bump(P, 16.1, 16.6, 0.2);
    // Reduced motion: a quick dip to black between held frames.
    if (this.reduced) {
      const k = (time - this.fadeT) / 0.45;
      if (k >= 0 && k < 1) g.black = Math.max(g.black, 1 - k);
    }
    // The end: the light fills the frame, and settles to paper.
    const end = range(P, 25.85, 26.45);
    g.flash = Math.max(g.flash, smooth(end) * 0.9 * (1 - range(P, 26.45, 26.7)));
    g.paper = smooth(range(P, 26.15, 26.65));
    g.grain *= 1 - g.paper;
  }

  /* ---- the old machine's moving parts, and its end ------------------------------ */

  private animateOld(P: number, dt: number, time: number) {
    // Every piece starts the frame at rest; the moving parts and the fall go on top.
    this.old.kit.rest();
    const R = this.old.rig;
    const sim = this.sim;
    const h = this.hero;
    const q = new THREE.Quaternion();
    const ax = new THREE.Vector3();
    // Gates: lane 0 is ours.
    R.gates.forEach((g, l) => {
      const open = l === 0 ? h.gate : sim.gateH[l] ?? 0;
      g.t.set(0, 0.46 * open, 0);
    });
    // The gauge: our wait, creeping past three seconds; elsewhere, the crowd's.
    const wait = P < 3.98 ? 4.6 * smooth(range(P, 2.72, 3.86)) : 4.6 * (1 - range(P, 3.98, 4.15));
    const idle = 2.6 + 1.6 * Math.sin(time * 0.6) * Math.sin(time * 0.23);
    const sec = P > 2.6 && P < 4.4 ? wait : idle;
    R.needle.q.setFromAxisAngle(ax.set(1, 0, 0), (Math.PI * Math.min(5, sec)) / 5 - Math.PI / 2);
    // The wheel of hours: noon has the sun at the top.
    const hours = clockAt(P);
    const wa = ((hours - 12) / 24) * Math.PI * 2;
    q.setFromAxisAngle(ax.set(0, 0, 1), wa);
    for (const w of R.wheel) w.q.copy(q);
    R.sun.q.copy(q);
    R.moon.q.copy(q);
    // The hatch.
    const ha = Math.max(sim.hatch, h.hatch);
    R.hatch.q.setFromAxisAngle(ax.set(0, 0, 1), -1.25 * ha);
    // Claws: ours on the front rail, the crowd's on the back.
    R.claws.forEach((c, i) => {
      const s = c.rail === "front" ? h.claw[c.from] : sim.claw[c.from];
      const x = s.x;
      c.trolley.t.set(x - c.restX, 0, 0);
      const drop = s.drop;
      c.head.t.set(x - c.restX, -(drop - 1), 0);
      for (let k = 0; k < c.fingers.length; k++) {
        const f = c.fingers[k];
        const a = (k / 3) * Math.PI * 2;
        f.t.copy(c.head.t);
        // Open: each finger swings out about its hinge.
        f.q.setFromAxisAngle(ax.set(-Math.sin(a), 0, Math.cos(a)), -0.55 * s.open);
      }
      // The cable from the trolley down to the head.
      const z = GANTRY_Z[c.rail];
      const top = GANTRY_Y;
      const bottom = GANTRY_Y - drop + 0.05;
      const m = new THREE.Matrix4().compose(V(x, (top + bottom) / 2, z), new THREE.Quaternion(), V(0.016, Math.max(0.01, top - bottom), 0.016));
      const vis = c.trolley.s > 0.01 ? 1 : 0;
      if (!vis) m.makeScale(0, 0, 0);
      this.cables.setMatrixAt(i, m);
    });
    this.cables.instanceMatrix.needsUpdate = true;
    // The stamp.
    for (const s of R.stamp) s.t.set(0, -0.32 * h.stamp, 0);
    // The tubes flicker; one of them badly.
    // The tubes hum; one is failing (slowly: a small light, never a strobe).
    R.tubes.forEach((t, i) => {
      let p = this.reduced ? 1 : 0.92 + 0.08 * Math.sin(time * (1.3 + i * 0.4) + i);
      if (!this.reduced && i === 3 && Math.sin(time * 0.9) > 0.55 && Math.sin(time * 12.5) > 0.2) p = 0.25;
      t.power = p;
    });
    // The crank turns, in fits; the gears with it; the person at it.
    const want = 0.55 + 0.35 * Math.sin(time * 0.31) - (Math.sin(time * 0.17) > 0.8 ? 0.5 : 0);
    if (P < 14.1) this.crankA += dt * Math.max(0.08, want);
    R.crank.q.setFromAxisAngle(ax.set(0, 0, 1), this.crankA * 1.6);
    for (const g of R.gears) g.p.q.setFromAxisAngle(ax.set(0, 0, 1), this.crankA * 0.22 * g.ratio);
    this.figureAt(this.crankA * 1.6);
    // Six o'clock in the new world: the laptop's lid comes down.
    const shut = smooth(range(P, 24.6, 24.95));
    if (shut > 0) R.lid.q.setFromAxisAngle(ax.set(Math.cos(0.35), 0, -Math.sin(0.35)), 1.78 * shut);
    // The lamp: on until six o'clock in the new world.
    this.lampOff = P > 24.62;
    R.bulb.power = this.lampOff ? 0.0 : 1 - 0.04 * Math.sin(time * 9);
    R.door.power = 1;

    // THE TURN: everything shakes, then comes apart in slow motion and falls away.
    const T = this.tear;
    for (const p of this.old.kit.pieces) {
      if (this.keep[p.id]) continue;
      const k = p.id * 8;
      const t0 = T[k];
      // The figure at the crank is simply gone after the flash.
      if (p.tag === "legs" || p.tag === "torso" || p.tag === "upper" || p.tag === "fore") {
        p.s = P > 16.08 ? 0 : 1;
        continue;
      }
      const shake = range(P, 14.82, 14.98) * (P < t0 ? 1 : 0);
      if (P < t0) {
        if (shake > 0) {
          const j = 0.025 * shake;
          p.t.x += Math.sin(time * 41 + p.id) * j;
          p.t.y += Math.sin(time * 37 + p.id * 1.7) * j;
        }
        p.glow = 0;
        continue;
      }
      // Slow motion: a P of film is about three seconds of falling.
      const tau = (P - t0) * 3.1;
      const vx = T[k + 1];
      const vy = T[k + 2];
      const vz = T[k + 3];
      const g = 2.6;
      p.t.set(p.t.x + vx * tau, p.t.y + vy * tau - 0.5 * g * tau * tau, p.t.z + vz * tau);
      ax.set(T[k + 4], T[k + 5], T[k + 6]);
      if (ax.lengthSq() < 1e-6) ax.set(0, 1, 0);
      ax.normalize();
      const spin = new THREE.Quaternion().setFromAxisAngle(ax, T[k + 7] * tau);
      p.q.premultiply(spin);
      p.s = Math.max(0, p.s * (1 - range(tau, 2.6, 3.4)));
      p.glow = 0.0;
    }
    // Moving parts were set above from rest; pieces that broke this frame have added their fall.
  }

  /**
   * The person at the crank: the torso leans into each turn, and the right
   * hand stays on the grip as it goes round (two-bone IK: shoulder, elbow, hand).
   */
  private figureAt(ca: number) {
    const F = this.old.rig.figure;
    const handle = V(CRANK.x + HANDLE_R * Math.cos(ca), CRANK.y + HANDLE_R * Math.sin(ca), CRANK.z + 0.66);
    // Lean in, and sway with the effort.
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.24 - 0.05 * Math.sin(ca), 0.08 * Math.cos(ca), 0.05 * Math.cos(ca), "XYZ"));
    F.torso.q.copy(q);
    F.torso.t.set(0.04 * Math.cos(ca), -0.015 + 0.02 * Math.sin(ca), 0.03 * Math.sin(ca));
    const SH = F.SH0.clone().sub(F.hips).applyQuaternion(q).add(F.hips).add(F.torso.t);
    const a = F.SH0.distanceTo(F.EL0);
    const b = F.EL0.distanceTo(F.HA0);
    const d = handle.clone().sub(SH);
    const L = Math.min(Math.max(d.length(), 0.05), a + b - 0.002);
    const dir = d.normalize();
    const x = (a * a - b * b + L * L) / (2 * L);
    const hgt = Math.sqrt(Math.max(0, a * a - x * x));
    // The elbow points out and down.
    const pole = V(0.7, -0.7, 0.15);
    pole.addScaledVector(dir, -pole.dot(dir)).normalize();
    const elbow = SH.clone().addScaledVector(dir, x).addScaledVector(pole, hgt);
    const hand = SH.clone().addScaledVector(dir, L);
    F.upper.q.setFromUnitVectors(F.EL0.clone().sub(F.SH0).normalize(), elbow.clone().sub(SH).normalize());
    F.upper.t.copy(SH).sub(F.SH0);
    F.fore.q.setFromUnitVectors(F.HA0.clone().sub(F.EL0).normalize(), hand.clone().sub(elbow).normalize());
    F.fore.t.copy(elbow).sub(F.EL0);
  }

  /* ---- the new machine ------------------------------------------------------------ */

  private animateNew(P: number, dt: number, time: number) {
    const N = this.nw.rig;
    const kit = this.nw.kit;
    // Pulses from the crowd going through.
    for (const e of this.events) {
      if (e.type === "ring") this.ringPow[e.lane] = 1;
      if (e.type === "node") this.nodePow[e.k] = 1;
    }
    // Ours, too.
    const h = this.hero;
    if (h.machine === "new") {
      if (this.prevP < 17.72 && P >= 17.72) this.ringPow[0] = 1.6;
      this.L.sNodes.forEach((s, k) => {
        const Pk = 19.32 + (s / this.L.channel.length) * 2.5;
        if (this.prevP < Pk && P >= Pk) this.nodePow[k] = 1.8;
      });
    }
    this.prevP = P;
    for (let i = 0; i < this.ringPow.length; i++) this.ringPow[i] *= Math.exp(-dt * 3.2);
    for (let i = 0; i < 3; i++) this.nodePow[i] *= Math.exp(-dt * 2.6);

    const ax = new THREE.Vector3();
    // Assembly: each piece flies in from the dark and locks; a flash as it does.
    const F = N.from;
    for (const p of kit.pieces) {
      const f = F[p.id];
      const k = range(P, f.at, f.at + 0.34);
      if (k <= 0) {
        p.s = 0;
        p.t.set(0, 0, 0);
        p.q.identity();
        p.glow = 0;
        continue;
      }
      // Arrive, overshoot a hair, settle (easeOutBack).
      const c1 = 1.25;
      const e = 1 + (c1 + 1) * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
      p.s = 1;
      p.t.copy(f.t).multiplyScalar(1 - e);
      p.q.copy(f.q).slerp(new THREE.Quaternion(), clamp01(e));
      const lock = Math.exp(-Math.pow((P - (f.at + 0.34)) / 0.05, 2));
      p.glow = lock * 1.2;
      p.power = 1;
    }
    // Then its life: the turbine spins, rings and nodes pulse, the flywheel turns.
    const run = range(P, 16.4, 17.0);
    const spin = new THREE.Quaternion().setFromAxisAngle(ax.set(0, 0, 1), -time * 3.2 * run);
    N.rotor.q.multiply(spin);
    N.rings.forEach((r, i) => (r.power = 1 + 2.6 * (this.ringPow[i] ?? 0)));
    N.portal.power = 1 + 0.6 * Math.max(...Array.from(this.ringPow));
    N.nodes.forEach((n, i) => (n.power = 1 + 2.2 * this.nodePow[i]));
    N.flywheel.q.multiply(new THREE.Quaternion().setFromAxisAngle(ax.set(0, 0, 1), time * 1.4 * run));
    const hours = clockAt(P);
    const wa = ((hours - 12) / 24) * Math.PI * 2;
    const wq = new THREE.Quaternion().setFromAxisAngle(ax.set(0, 0, 1), wa);
    for (const w of N.wheel) w.q.multiply(wq);
    N.moon.q.multiply(wq);
    N.sun.q.multiply(wq);
    N.door.power = 1 + 0.15 * Math.sin(time * 1.3);
  }

  private flakesAt(P: number) {
    const fd = this.flakeData;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    let n = 0;
    if (P > 14.9 && P < 16.5) {
      const count = fd.length / 8;
      for (let i = 0; i < count; i++) {
        const k = i * 8;
        const tau = (P - fd[k + 3]) * 3.1;
        if (tau <= 0 || tau > 3.2) continue;
        const x = fd[k] + fd[k + 4] * tau;
        const y = fd[k + 1] + fd[k + 5] * tau - 0.5 * 1.6 * tau * tau;
        const z = fd[k + 2] + fd[k + 6] * tau;
        e.set(fd[k + 7] + tau * 3, fd[k + 7] * 2 + tau * 2, tau);
        q.setFromEuler(e);
        const s = 1 - range(tau, 2.4, 3.2);
        m.compose(V(x, y, z), q, V(s, s, s));
        this.flakes.setMatrixAt(n++, m);
      }
    }
    this.flakes.count = n;
    if (n) this.flakes.instanceMatrix.needsUpdate = true;
    // Sparks: a short bright life each, flung out as the piece breaks.
    const sd = this.sparkData;
    let ns = 0;
    if (P > 14.95 && P < 16.2) {
      const count = sd.length / 8;
      for (let i = 0; i < count; i++) {
        const k = i * 8;
        const tau = (P - sd[k + 3]) * 3.1;
        if (tau <= 0 || tau > sd[k + 7]) continue;
        const life = tau / sd[k + 7];
        const s = (1 - life) * (1 - life) * 1.4;
        m.compose(V(sd[k] + sd[k + 4] * tau, sd[k + 1] + sd[k + 5] * tau - 4.5 * tau * tau, sd[k + 2] + sd[k + 6] * tau), q.identity(), V(s, s, s));
        this.sparks.setMatrixAt(ns++, m);
      }
    }
    this.sparks.count = ns;
    if (ns) this.sparks.instanceMatrix.needsUpdate = true;
  }

  /* ---- the camera ------------------------------------------------------------------- */

  private cameraAt(P: number, f: Frame) {
    const c = this.cam;
    let Pc = P;
    if (this.reduced) {
      // Hold the composed frame we are at; a change of frame is a cut through black.
      let r = RESTS[0];
      for (const x of RESTS) if (x <= P + 0.2) r = x;
      if (r !== this.restP) {
        if (this.restP >= 0) this.fadeT = f.time;
        this.restP = r;
      }
      Pc = r;
    }
    cameraAt(Pc, { h: this.hero, L: this.L }, c);
    const cam = this.camera;
    // The phone: a narrower frame, so pull back a little and keep the subject high.
    let fov = c.fov;
    let ppx = c.ppx;
    let ppy = c.ppy;
    const aspect = cam.aspect;
    if (aspect < 1) {
      fov = Math.min(80, c.fov * (1 + (1 - aspect) * 0.75));
      ppx = 0.5;
      ppy = 0.36;
    }
    // Lean toward the pointer, and breathe.
    const lx = f.pointer.has && !this.reduced ? f.pointer.x : 0;
    const ly = f.pointer.has && !this.reduced ? f.pointer.y : 0;
    this.lean.x += (lx - this.lean.x) * (1 - Math.exp(-f.dt * 2.2));
    this.lean.y += (ly - this.lean.y) * (1 - Math.exp(-f.dt * 2.2));
    const t = f.time;
    const still = this.reduced ? 0 : this.quality === 0 ? 0.6 : 1;
    const dist = c.eye.distanceTo(c.at);
    const breath = V(Math.sin(t * 0.37) * 0.6 + Math.sin(t * 0.23) * 0.4, Math.sin(t * 0.29) * 0.5, Math.sin(t * 0.19) * 0.4).multiplyScalar(0.006 * dist * still);
    cam.position.copy(c.eye).add(breath);
    // A lean of about a degree and a half.
    const fwd = c.at.clone().sub(c.eye).normalize();
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    const up = new THREE.Vector3().crossVectors(right, fwd);
    const at = c.at.clone().addScaledVector(right, this.lean.x * 0.026 * dist).addScaledVector(up, this.lean.y * 0.018 * dist);
    cam.position.addScaledVector(right, -this.lean.x * 0.012 * dist);
    // Shake: the sub hit at the turn, and the falls.
    const shake = this.reduced ? 0 : 0.012 * bump(P, 14.95, 15.5, 0.08) + 0.004 * bump(P, 16.05, 16.4, 0.05);
    if (shake > 0) at.add(V(Math.sin(t * 47) * shake * dist, Math.sin(t * 53) * shake * dist, 0));
    cam.up.set(0, 1, 0);
    cam.lookAt(at);
    if (c.roll) cam.rotateZ(c.roll);
    cam.fov = fov;
    const W = 1000;
    const H = W / aspect;
    // The point looked at sits at (ppx, ppy) of the frame, not its middle.
    cam.setViewOffset(W, H, (0.5 - ppx) * W, (0.5 - ppy) * H, W, H);
    cam.updateProjectionMatrix();
  }

  private hoverAt(f: Frame) {
    if (!f.pointer.has) {
      this.hover = null;
      return;
    }
    this.ndc.set(f.pointer.x, f.pointer.y);
    this.ray.setFromCamera(this.ndc, this.camera);
    const parts = this.machine === "new" ? this.nw.rig.parts : this.machine === "old" ? this.old.rig.parts : [];
    let best: string | null = null;
    let bd = Infinity;
    const hit = new THREE.Vector3();
    for (const p of parts) {
      if (this.ray.ray.intersectBox(p.box, hit)) {
        const d = hit.distanceTo(this.camera.position);
        // Only near enough to be the thing on screen.
        if (d < bd && d < 60) {
          bd = d;
          best = p.id;
        }
      }
    }
    this.hover = best;
  }
}

export { CRANK, PIPE_Z, TRAYS, WHEEL };
export type { Piece };
