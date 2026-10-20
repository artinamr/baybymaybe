import * as THREE from "three";
import { Post, makeGrade, type Grade } from "./post";
import { Sky } from "./sky";
import { buildTown, SHOP, type Town } from "./town";
import { buildHome, buildShop, inFrame, type Home, type Shop } from "./places";
import { Figure } from "./figure";
import { apply, blend, carryPhone, deskType, makePhone, newPose, placePhone, sofaPhone, stand, standPhone, walk, pathLength, copyPose, type Pose } from "./people";
import { Card, Screen, Strips, carry, uiScale } from "./cards";
import { MIST, WIND, hookMist } from "./mats";
import { Crowd } from "./crowd";
import { Envelope, type Flight } from "./mail";
import { CARD_DROP, Fields, NODES, System, TAG_DROP } from "./system";
import { ContactShade } from "./shade";
import { BACK_STEP, cameraSmooth, phoneAdjust, phoneBackBase, phoneBackTable, type BackBase, type CamOut, type Ctx as CamCtx } from "./camera";
import { B, bump, clockAt, inW, isNew, k, ke, lapseHours, weathered, type W } from "./script";
import { clamp01, lerp, range, settle, smooth, smoother } from "./ease";
import { FILM_LEN } from "../timeline";
import * as UI from "./ui";
import type { Quality } from "../store";

/**
 * THE WORLD: the town, its sky, the two places of the story, the people,
 * the messages and the screens, and the camera; all of it a function of
 * the film's clock P (script.ts), plus real time for breath and small life.
 */

export type Frame = { dt: number; time: number; P: number; pointer: { x: number; y: number; has: boolean } };
export type Leak = "website" | "inbox" | "admin" | "followup";
export type Counts = {
  lost: Record<Leak, number>;
  kept: number;
  yoursIn: number;
  yoursLost: number;
  yoursKept: number;
  drop: (stage: string) => boolean;
};
export type SoundEvent = { type: string; pos: THREE.Vector3; user?: boolean };

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const Q = (x: number, y: number, z: number) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, "YXZ"));
const H = (x: number, y: number, z: number) => V(-44 - x, y, 15.5 - z);
const S = (x: number, y: number, z: number) => V(44 + x, y, -17 + z);
const WALL_COL = new THREE.Color(1.0, 0.8, 0.55);
/** The inbox pile's foot: in front of the workshop's roller door, above the van. */
/** How many cars drive the main street. */
const TRAFFIC = 4;
const COLUMN_BASE = V(44 + 3.7, 2.9, -17 + 8.4);

/** Parse "7:40pm" into hours after the first evening's midnight (am is the next day). */
function mailHours(at: string) {
  const m = at.match(/(\d+):(\d+)(am|pm)/)!;
  let h = (+m[1] % 12) + +m[2] / 60;
  if (m[3] === "pm") h += 12;
  else h += 24;
  return h;
}
/** The P at which the clock first reaches `hours` inside [a, b]. */
function whenHours(hours: number, a: number, b: number) {
  let lo = a;
  let hi = b;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (clockAt(m) < hours) lo = m;
    else hi = m;
  }
  return hi;
}

type Drop = { t0: number; house: number; lost: boolean; stage: string; done: boolean };

export class World {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly post: Post;
  readonly grade: Grade = makeGrade();
  readonly sky: Sky;
  readonly town: Town;
  readonly home: Home;
  readonly shop: Shop;
  readonly phone: boolean;
  readonly quality: Quality;
  readonly reduced: boolean;
  readonly sam = new Figure();
  readonly owner = new Figure();
  readonly samPhone = makePhone();
  readonly sim: Counts;
  readonly hero = { visible: false, falling: false };
  info = { hours: 19.6, speed: 0 };
  events: SoundEvent[] = [];
  hover: string | null = null;
  camOverride: { eye: { x: number; y: number; z: number }; at: { x: number; y: number; z: number }; fov: number } | null = null;
  /** Parts the pointer can ask about (content/story.ts PARTS), with their boxes. */
  readonly parts: { id: string; box: THREE.Box3; on: boolean }[] = [];

  private gl: THREE.WebGLRenderer;
  private poseA = newPose();
  private poseB = newPose();
  private poseC = newPose();
  private poseD = newPose();
  private samPose = newPose();
  private ownerPose = newPose();
  private crowd: Crowd;
  private system: System;
  private fields: Fields;
  private mailA: Envelope;
  private mailB: Envelope;
  private mailC: Envelope;
  private strips: Strips;
  private stripP: number[];
  private coldP: number[];
  private phoneScreen: Screen;
  private phoneCard: Card;
  private laptopScreen: Screen;
  private sheetCard: Card;
  private quoteCard: Card;
  private invoiceCard: Card;
  private pend: Card[] = [];
  private calCard: Card;
  private handCard: Card;
  private nQuoteCard: Card;
  private todayCard: Card;
  private rival: THREE.Group;
  private ourVan: THREE.Group;
  private phoneLight: THREE.PointLight;
  private traffic: { body: THREE.InstancedMesh; dark: THREE.InstancedMesh };
  private mailLight: THREE.PointLight;
  private pulseLight: THREE.PointLight;
  /** The last impact (the paper hitting the floor, the landing after the rewind): its moment. */
  private impactT = -1e9;
  private impactK = 0;
  private shadeG = new ContactShade(24, 0);
  private cam: CamOut = { eye: new THREE.Vector3(), at: new THREE.Vector3(), fov: 40, ppx: 0.5, ppy: 0.5, roll: 0, dof: 0 };
  private camCtx: CamCtx;
  private w = 1;
  private h = 1;
  private prevP = -1;
  private drops: Drop[] = [];
  private lastTime = 0;

  constructor(gl: THREE.WebGLRenderer, opts: { phone: boolean; quality: Quality; reduced: boolean }) {
    this.gl = gl;
    this.phone = opts.phone;
    this.quality = opts.quality;
    this.reduced = opts.reduced;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFShadowMap;
    this.camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.05, 2400);
    // Layer 1: light that is not a surface (halos, trails); the depth pass leaves it out.
    this.camera.layers.enable(1);
    this.post = new Post(4, 6, opts.quality > 0);
    this.sky = new Sky(this.scene, opts.quality === 0 ? 1024 : 2048);
    this.town = buildTown(this.scene, opts.quality);
    this.home = buildHome(this.scene);
    this.shop = buildShop(this.scene);
    // The two places, the garden's tree, the deck and the pile's van in the camera's height field.
    const fld = this.town.field;
    fld.house(-44, 15.5, 11.2, 10.2, 0, 5.6);
    fld.disc(-40.8, 31.5, 4.2, 6.4);
    fld.box(-44, 40.4, 17, 0.4, 0, 1.9);
    fld.box(-38.5, 30.3, 0.4, 20, 0, 1.9);
    fld.disc(-47.4, 30, 1.5, 2.2);
    fld.house(44, -17, 15.2, 13.2, 0, 6.6);
    fld.box(47.6, -8, 2.2, 5.2, 0, 2.4);
    this.scene.add(this.sam.root, this.owner.root, this.samPhone.group, this.shadeG.mesh);
    this.phoneLight = new THREE.PointLight(0xcfe0ff, 0, 1.6, 1.5);
    this.scene.add(this.phoneLight);
    // The enquiry's own light: it lights the roofs it flies over, and the town under the route's pulse.
    this.mailLight = new THREE.PointLight(0xffc18a, 0, 22, 1.6);
    this.pulseLight = new THREE.PointLight(0xffd2a8, 0, 30, 1.5);
    this.scene.add(this.mailLight, this.pulseLight);

    // The other customers, and the new route over the town.
    this.crowd = new Crowd(this.scene, this.town.houses, V(-30, 0, 8));
    // Traffic: a few cars along the main street, on their own time (life, not story).
    this.traffic = {
      body: new THREE.InstancedMesh(this.town.car.body, this.town.mats[0], TRAFFIC),
      dark: new THREE.InstancedMesh(this.town.car.dark, this.town.mats[3], TRAFFIC),
    };
    this.traffic.body.castShadow = true;
    this.traffic.body.frustumCulled = this.traffic.dark.frustumCulled = false;
    this.scene.add(this.traffic.body, this.traffic.dark);
    this.system = new System(this.scene, H(-2, 0, -1), S(-4, 0, 4));
    this.fields = new Fields(this.scene);
    this.mailA = new Envelope(this.scene);
    this.mailB = new Envelope(this.scene);
    this.mailC = new Envelope(this.scene);

    // The inbox column (the old way's night).
    this.strips = new Strips();
    this.scene.add(this.strips.mesh);
    const night = UI.NIGHT_MAIL;
    this.stripP = night.map((m, i) => (i === 0 ? B.land : whenHours(mailHours(m.at), B.night[0] - 0.2, B.night[1] + 0.05)));
    this.coldP = night.map((m, i) => (m.lost ? Math.min(B.night[1] - 0.02, this.stripP[i] + 0.12 + ((i * 37) % 11) * 0.012) : 99));

    // Screens and cards.
    this.phoneScreen = new Screen(UI.PHONE.w, UI.PHONE.h, UI.PHONE.s, false);
    (this.samPhone.screen.material as THREE.MeshBasicMaterial).map = this.phoneScreen.tex;
    this.phoneCard = new Card(this.phoneScreen, 0.66, 1.38, 0.09, 0.03, { bezel: 0.022, body: 0x17181c, metal: 0.35 });
    this.laptopScreen = new Screen(UI.DESK.w, UI.DESK.h, UI.DESK.s, false);
    (this.shop.laptop.screen.material as THREE.MeshBasicMaterial).map = this.laptopScreen.tex;
    const deskCard = (w = 1.4, h = 0.875, mips = true) => new Card(new Screen(UI.DESK.w, UI.DESK.h, UI.DESK.s, mips), w, h, 0.05, 0.02);
    this.sheetCard = deskCard(1.4, 0.875, false);
    this.quoteCard = deskCard(1.4, 0.875, false);
    this.invoiceCard = deskCard(1.4, 0.875, false);
    for (let i = 0; i < 5; i++) this.pend.push(deskCard(1.0, 0.625));
    const holoCard = (w: number, h: number) => new Card(new Screen(UI.DESK.w, UI.DESK.h, UI.DESK.s), w, h, 0.05, 0.02, { bezel: 0, body: 0x0b0c16, metal: 0.4, holo: true });
    this.calCard = holoCard(4.8, 3.0);
    this.handCard = holoCard(4.8, 3.0);
    this.nQuoteCard = holoCard(4.8, 3.0);
    this.todayCard = holoCard(1.4, 0.875);
    for (const c of this.allCards()) this.scene.add(c.group);

    // The vans: ours (taken from the workshop so it can drive), and the other business's.
    this.ourVan = this.shop.van.group;
    this.scene.attach(this.ourVan);
    this.rival = this.ourVan.clone(true);
    this.rival.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && m.geometry.getAttribute("color")) {
        m.geometry = m.geometry.clone();
        const col = m.geometry.getAttribute("color") as THREE.BufferAttribute;
        for (let i = 0; i < col.count; i++) {
          // Indigo stripes become orange; white body becomes grey.
          if (col.getZ(i) > 0.8 && col.getX(i) < 0.5) col.setXYZ(i, 0.95, 0.45, 0.12);
          else if (col.getX(i) > 0.7) col.setXYZ(i, col.getX(i) * 0.62, col.getY(i) * 0.63, col.getZ(i) * 0.66);
        }
      }
    });
    this.scene.add(this.rival);

    // The mist's uniforms, bound into every material the world drew (before any compiles).
    this.scene.traverse((o) => {
      const m = (o as THREE.Mesh).material;
      if (!m) return;
      for (const x of Array.isArray(m) ? m : [m]) hookMist(x);
    });
    this.camCtx = {
      flight: (P) => this.flightNear(P),
      van: (P) => this.vanAt(P).p,
    };

    this.sim = {
      lost: { website: 0, inbox: 0, admin: 0, followup: 0 },
      kept: 0,
      yoursIn: 0,
      yoursLost: 0,
      yoursKept: 0,
      drop: (stage: string) => {
        const house = Math.floor(Math.random() * this.town.houses.length);
        const nw = stage === "new";
        const lose = nw ? Math.random() < 0.06 : Math.random() < 0.62;
        this.drops.push({ t0: this.lastTime, house, lost: lose, stage, done: false });
        this.sim.yoursIn++;
        return true;
      },
    };

    // Parts the pointer can ask about.
    const box = (id: string, c: THREE.Vector3, s: THREE.Vector3) => this.parts.push({ id, box: new THREE.Box3().setFromCenterAndSize(c, s), on: false });
    box("phone", H(-3.1, 1.45, -2.4), V(0.9, 1.6, 0.4));
    box("inbox", COLUMN_BASE.clone().setY(9), V(3.8, 13, 0.6));
    box("owner", S(-3.9, 1.2, 3.2), V(1.4, 1.8, 1.4));
    box("admin", S(-3.9, 1.9, 5.15), V(4.6, 1.2, 0.8));
    box("deck", H(-1.3, 0.6, -7.0), V(7.4, 1.2, 5.2));
    box("van", H(0, 1.2, 12.5), V(2.4, 2.4, 5));
    NODES.forEach((n) => box(n.id === "website" ? "site" : n.id, n.pos.clone().setY(n.pos.y - TAG_DROP), V(5.2, 1.8, 1.2)));

    UI.initFonts().then(() => {
      for (const c of this.allCards()) c.screen.dirty();
      this.laptopScreen.dirty();
      this.strips.dirty();
      this.system.dirty();
    });
  }

  private allCards() {
    return [this.phoneCard, this.sheetCard, this.quoteCard, this.invoiceCard, ...this.pend, this.calCard, this.handCard, this.nQuoteCard, this.todayCard];
  }

  setSize(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    this.system.labelScale = w / h < 1 ? 0.72 : 1;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.post.setSize(w * dpr, h * dpr);
  }

  /** The phone's pull-back at P (camera.ts phoneBackTable): the free distances once, a table per screen shape. */
  private backBase: BackBase | null = null;
  private backTables = new Map<number, Float32Array>();
  phoneBack(P: number) {
    const a = this.w / this.h;
    if (a >= 1) return 0;
    const key = Math.round(a * 50) / 50;
    let t = this.backTables.get(key);
    if (!t) {
      this.backBase ??= phoneBackBase(
        this.camCtx,
        FILM_LEN,
        this.town.field,
        NODES.map((n) => ({ c: n.pos.clone().setY(n.pos.y - 1.6), r: 5, from: B.assemble[0] }))
      );
      this.backTables.set(key, (t = phoneBackTable(this.backBase, key)));
    }
    const f = Math.min(t.length - 1, Math.max(0, P / BACK_STEP));
    const i = Math.floor(f);
    const j = Math.min(t.length - 1, i + 1);
    return t[i] + (t[j] - t[i]) * (f - i);
  }

  prewarm(_n: number) {
    void _n;
  }

  lockTimes(): number[] {
    const out = NODES.map(() => B.assemble[1]);
    NODES.forEach((_, i) => {
      for (let P = B.assemble[0]; P <= B.assemble[1]; P += 0.002)
        if (this.system.rise(i, this.scanRadius(P)) >= 0.72) {
          out[i] = P;
          break;
        }
    });
    return out;
  }

  /** The scan's radius from the workshop at P (it sweeps out over the first third of the assembly). */
  private scanRadius(P: number) {
    const a = B.assemble;
    return 165 * smooth(range(P, a[0] + 0.02, a[0] + 0.38));
  }

  /* ---------------------------------------------------------------- */
  /* Flights                                                           */
  /* ---------------------------------------------------------------- */

  private flights = (() => {
    const amber = new THREE.Color(1.0, 0.62, 0.3);
    const indigo = new THREE.Color(0.55, 0.45, 1.0);
    const samCard = H(-3.1, 2.1, -2.4);
    const column = COLUMN_BASE.clone().setY(3.4);
    const reply = NODES[1].pos.clone();
    return {
      old: { from: samCard, to: column, lift: 26, color: amber } as Flight,
      newOut: { from: samCard, to: reply, lift: 4, color: amber } as Flight,
      newBack: { from: reply.clone(), to: samCard.clone(), lift: 3, color: indigo } as Flight,
      remind: { from: NODES[5].pos.clone(), to: H(-1.6, 2.2, -5.4), lift: 3, color: indigo } as Flight,
      quote: { from: NODES[3].pos.clone().setY(NODES[3].pos.y - CARD_DROP), to: samCard.clone(), lift: 6, color: indigo } as Flight,
    };
  })();

  /** The main envelope's flights: when each is in the air (it shows), and its progress. */
  private flightList = (): { show: [number, number]; run: [number, number]; f: Flight }[] => [
    { show: [B.fold[0], B.land + 0.02], run: B.fly, f: this.flights.old },
    { show: [B.nFly[0] - 0.02, B.nFly[1]], run: B.nFly, f: this.flights.newOut },
    { show: [B.nBack[0], B.nBack[1] + 0.02], run: B.nBack, f: this.flights.newBack },
    { show: [22.3, 22.48], run: [22.3, 22.46], f: this.flights.quote },
    { show: [B.nRemind[0] - 0.02, B.nRemind[0] + 0.14], run: [B.nRemind[0] - 0.02, B.nRemind[0] + 0.12], f: this.flights.remind },
  ];

  /** The main envelope's flight at P (or null when none is in the air). */
  private flightAt(P: number): { f: Flight; t: number } | null {
    for (const fl of this.flightList()) if (P >= fl.show[0] && P < fl.show[1]) return { f: fl.f, t: smoother(k(P, fl.run)) };
    return null;
  }

  /** For the camera: the nearest flight at P, its progress clamped (a key riding with it is always somewhere). */
  private flightNear(P: number): { f: Flight; t: number } {
    let best = this.flightList()[0];
    let bd = Infinity;
    for (const fl of this.flightList()) {
      const d = P < fl.show[0] ? fl.show[0] - P : P > fl.show[1] ? P - fl.show[1] : 0;
      if (d < bd) {
        bd = d;
        best = fl;
      }
    }
    return { f: best.f, t: smoother(k(P, best.run)) };
  }

  /** Where our van is. */
  private vanAt(P: number): { p: THREE.Vector3; yaw: number; lights: number } {
    const park = S(3.6, 0, 9.0);
    const samKerb = V(-44, 0, 3.4);
    if (isNew(P) && P >= B.nVan[0] && P < 26.0) {
      // To Sam's kerb; after the measure-up, on and away west.
      const t = smooth(k(P, B.nVan));
      const away = smooth(range(P, B.nVan[1] + 0.04, 25.78));
      return { p: V(lerp(-10, samKerb.x, t) - away * 22, 0, samKerb.z), yaw: -Math.PI / 2, lights: 1 - t * 0.6 + away * 0.6 };
    }
    if (P >= B.nDrive[0]) {
      const t = k(P, B.nDrive);
      const e = t * t * (3 - 2 * t);
      // Out of the yard onto the main street, then away east.
      const out = park.clone().lerp(V(park.x - 2, 0, -2.2), smooth(range(e, 0, 0.3)));
      const p = out.add(V(lerp(0, 46, smooth(range(e, 0.25, 1))), 0, 0));
      const yaw = lerp(0, Math.PI / 2, smooth(range(e, 0.1, 0.35)));
      return { p, yaw, lights: 1 };
    }
    return { p: park, yaw: 0, lights: 0 };
  }

  /* ---------------------------------------------------------------- */
  /* The frame                                                         */
  /* ---------------------------------------------------------------- */

  update(f: Frame) {
    const P = f.P;
    const t = f.time;
    this.lastTime = t;
    this.events.length = 0;
    // THE REWIND: between the black and the new route, the camera hangs high
    // over the town while the whole old half runs backward (world time Pw,
    // from the desk at 11:48pm back to the evening the enquiry was sent) and
    // the hours spin back through two days to the first evening.
    const rw = inW(P, B.rewind) ? smoother(k(P, B.rewind)) : -1;
    const Pw = rw >= 0 ? lerp(B.freeze[1] - 0.02, B.send - 0.1, rw) : P;
    // (Hours: the rewind spins them back through two days; a year window runs its lapse.)
    const hours = rw >= 0 ? 19 + 37 / 60 + (23 + 48 / 60 + 48 - (19 + 37 / 60)) * (1 - rw) : (lapseHours(Pw) ?? clockAt(Pw));
    this.info.hours = hours;
    const nw = isNew(P);

    // THE CAMERA (first: the shadows follow what it looks at).
    const cam = this.camera;
    cameraSmooth(P, this.camCtx, this.cam, FILM_LEN);
    phoneAdjust(this.cam, this.w / this.h, this.phoneBack(P));
    if (this.camOverride) {
      const e = this.camOverride.eye;
      const a = this.camOverride.at;
      this.cam.eye.set(e.x, e.y, e.z);
      this.cam.at.set(a.x, a.y, a.z);
      this.cam.fov = this.camOverride.fov;
      this.cam.ppx = 0.5;
      this.cam.ppy = 0.5;
      this.cam.roll = 0;
      this.cam.dof = 0;
    }
    const br = this.reduced ? 0 : 1;
    WIND.value = t * br;
    // Mist on the ground: the mornings (thickest about half past six), a breath at dusk and in the night; none in a room.
    {
      const hod = ((hours % 24) + 24) % 24;
      const dawn = bump(hod, 5.0, 8.8, 1.3);
      const dusk = bump(hod, 18.9, 21.4, 0.9);
      const night = hod > 21.4 || hod < 5.0 ? 1 : 0;
      const e = this.cam.eye;
      const inRoom = (e.x > -49.2 && e.x < -38.8 && e.z > 10.8 && e.z < 20.2 && e.y < 3.3) || (e.x > 36.8 && e.x < 51.2 && e.z > -23.2 && e.z < -10.8 && e.y < 4.6);
      MIST.value = (0.03 * dawn + 0.009 * dusk + 0.006 * night) * (inRoom ? 0 : 1);
    }
    // An impact shakes the camera: the paper hitting the floor; the landing after the rewind.
    if (this.prevP < B.fall[0] + 0.03 && P >= B.fall[0] + 0.03) {
      this.impactT = t;
      this.impactK = 1;
    } else if (this.prevP < B.rewind[1] && P >= B.rewind[1]) {
      this.impactT = t;
      this.impactK = 0.4;
    }
    cam.position.copy(this.cam.eye);
    const since = t - this.impactT;
    if (since >= 0 && since < 0.9 && br > 0) {
      const d = Math.exp(-since * 5.5) * this.impactK;
      cam.position.x += Math.sin(since * 150) * 0.022 * d;
      cam.position.y += Math.sin(since * 123 + 1.3) * 0.03 * d;
    }
    // A living camera: never quite still. A slow push toward the subject and
    // back (a hair over a percent of its distance, a dozen seconds a cycle),
    // a breath beside it.
    const push = (0.5 - 0.5 * Math.cos(t * 0.5)) * 0.013 * br;
    cam.position.lerp(this.cam.at, push);
    // ...and a slow drift round it (under a degree, a quarter of a minute a turn): the picture keeps its depth.
    {
      const a = Math.sin(t * 0.27) * 0.012 * br;
      const c = Math.cos(a);
      const sn = Math.sin(a);
      const dx = cam.position.x - this.cam.at.x;
      const dz = cam.position.z - this.cam.at.z;
      cam.position.x = this.cam.at.x + dx * c - dz * sn;
      cam.position.z = this.cam.at.z + dx * sn + dz * c;
    }
    cam.position.x += Math.sin(t * 0.37) * 0.01 * br;
    cam.position.y += Math.sin(t * 0.29 + 1) * 0.008 * br;
    cam.up.set(Math.sin(this.cam.roll), Math.cos(this.cam.roll), 0);
    cam.lookAt(this.cam.at);
    cam.fov = this.cam.fov;
    cam.updateProjectionMatrix();
    // Where the subject sits on screen: a lens shift, not a turn.
    const pm = cam.projectionMatrix;
    pm.elements[8] = -(this.cam.ppx - 0.5) * 2;
    pm.elements[9] = (this.cam.ppy - 0.5) * 2;
    cam.projectionMatrixInverse.copy(pm).invert();
    cam.updateMatrixWorld(true);

    // THE SKY. The shadow map covers what the camera looks at.
    const dist = cam.position.distanceTo(this.cam.at);
    // Depth of field: the subject in focus, the aperture the shot's.
    this.grade.focus = dist;
    this.grade.aperture = this.camOverride ? 0 : this.cam.dof;
    const radius = Math.min(150, Math.max(3, dist * Math.tan(THREE.MathUtils.degToRad(cam.fov) * 0.6) * 1.6));
    const sky = this.sky.update(hours, t, this.cam.at, radius, dist < 10 ? 1.4 : dist < 40 ? 1.0 : dist < 60 ? 0.8 : 0.45);
    this.town.setLamps(sky.lights > 0.3 ? smooth((sky.lights - 0.3) / 0.3) : 0);
    const glass = new THREE.Color(0.16, 0.19, 0.24).lerp(new THREE.Color(0.03, 0.035, 0.05), sky.night);
    this.town.setGlass(glass, 2.4);
    // Windows: lit by the hour; and every customer who gave up is a window gone dark.
    const dropK = nw ? k(Pw, [B.nOver[0] + 0.2, B.nOver[1] - 0.08]) : k(Pw, B.drop);
    for (const h of this.town.houses) {
      const r = ((h.id * 7919) % 101) / 101;
      this.town.setWindow(h.id, r < sky.lights * 0.82 && !this.crowd.gone(h.id, dropK, nw) ? 1 : 0);
    }

    this.look(P, sky.night);
    uiScale.k = 1 / this.grade.exposure;
    this.places(Pw, hours, sky.night, nw);
    this.people(Pw, t, nw);
    this.screens(Pw, t, hours, nw);
    this.cards(Pw, t, nw);
    this.mail(Pw, t);
    this.column(Pw);
    this.crowdAndCounts(Pw, t, nw);
    this.seasons(Pw);
    this.route(P, t);
    this.drive(t);
    this.keepClear(f.dt);
    this.pointer(f.pointer);
    this.prevP = P;
  }

  /**
   * Where the words are on screen (normalised device coordinates, y up) and
   * how much they are there (0..1): written by the page (dom.ts) each frame.
   */
  readonly words = { x0: 0, y0: 0, x1: 0, y1: 0, k: 0 };
  private readonly _c = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  private readonly _q = new THREE.Vector3();

  /**
   * THE WORDS COME FIRST: a card in the air that passes behind the words
   * fades while it is there (the compositions keep them apart; this is for
   * the moments in between, when the camera swings past a card).
   */
  private keepClear(dt: number) {
    // Eased in time (a card that only grazes the words as the camera whips past dips, it does not blink).
    const ease = dt > 0 ? 1 - Math.exp(-dt / 0.12) : 1;
    const wd = this.words;
    const cam = this.camera;
    cam.updateMatrixWorld();
    const sysOn = this.system.group.visible;
    for (const card of [...this.allCards(), ...this.system.cards]) {
      if (card.shown <= 0.002 || (!sysOn && this.system.cards.includes(card))) {
        if (card.clear !== 1) {
          card.clear = 1;
          card.apply();
        }
        continue;
      }
      if (wd.k <= 0) {
        // No words: back to whole, eased.
        if (card.clear !== 1) {
          card.clear = card.clear > 0.999 ? 1 : card.clear + (1 - card.clear) * ease;
          card.apply();
        }
        continue;
      }
      card.group.updateMatrixWorld(true);
      // The card's rectangle, in the camera's space, cut at the near plane, projected.
      let x0 = Infinity;
      let y0 = Infinity;
      let x1 = -Infinity;
      let y1 = -Infinity;
      const c = this._c;
      c[0].set(-card.w / 2, -card.h / 2, 0);
      c[1].set(card.w / 2, -card.h / 2, 0);
      c[2].set(card.w / 2, card.h / 2, 0);
      c[3].set(-card.w / 2, card.h / 2, 0);
      for (const v of c) v.applyMatrix4(card.group.matrixWorld).applyMatrix4(cam.matrixWorldInverse);
      const near = -0.06;
      const take = (v: THREE.Vector3) => {
        this._q.copy(v).applyMatrix4(cam.projectionMatrix);
        x0 = Math.min(x0, this._q.x);
        x1 = Math.max(x1, this._q.x);
        y0 = Math.min(y0, this._q.y);
        y1 = Math.max(y1, this._q.y);
      };
      for (let i = 0; i < 4; i++) {
        const a = c[i];
        const b = c[(i + 1) % 4];
        if (a.z <= near) take(a);
        if (a.z <= near !== b.z <= near) take(this._q.copy(a).lerp(b, (near - a.z) / (b.z - a.z)).clone());
      }
      let clear = 1;
      if (x1 > x0) {
        const ox = Math.min(x1, wd.x1, 1) - Math.max(x0, wd.x0, -1);
        const oy = Math.min(y1, wd.y1, 1) - Math.max(y0, wd.y0, -1);
        if (ox > 0 && oy > 0) {
          const onCard = (Math.min(x1, 1) - Math.max(x0, -1)) * (Math.min(y1, 1) - Math.max(y0, -1));
          const zone = (wd.x1 - wd.x0) * (wd.y1 - wd.y0);
          const frac = (ox * oy) / Math.max(1e-6, Math.min(onCard, zone));
          clear = 1 - wd.k * smoother(range(frac, 0.04, 0.2));
        }
      }
      if (Math.abs(clear - card.clear) > 1e-4) {
        card.clear += (clear - card.clear) * ease;
        card.apply();
      }
    }
  }

  /* ---------------------------------------------------------------- */
  /* The two places                                                    */
  /* ---------------------------------------------------------------- */

  private places(P: number, hours: number, night: number, nw: boolean) {
    const h = this.home;
    const s = this.shop;
    const hod = ((hours % 24) + 24) % 24;
    const evening = hod > 18.5 || hod < 6.5;
    // HOME: the lamp is on while Sam is up in the evening.
    const samUp = (!nw && P < B.samBed && evening) || (nw && P < B.n3am[0] && evening) || inW(P, [22.36, 22.74]);
    const lamp = samUp ? 1 : 0;
    h.lampLight.intensity = 3.0 * lamp;
    (h.lampGlow.material as THREE.MeshBasicMaterial).color.setRGB(2.6, 1.7, 0.9).multiplyScalar(lamp + 0.03);
    h.roomLight.intensity = samUp ? 0.6 : 0;
    (h.windows.material as THREE.MeshBasicMaterial).color.setRGB(2.2, 1.45, 0.8).multiplyScalar(lamp).add(new THREE.Color(0.03, 0.035, 0.05).multiplyScalar(1 - lamp));

    // THE DECK: the old one until the job; built board by board; weathering through a year.
    const kb = nw ? k(P, B.nBuild) : range(P, 10.32, 10.92);
    this.deck(kb, weathered(P));

    // SHOP: who is in, which lights are on.
    const ownerIn = (!nw && P >= B.ownerIn[0] && P < 10.42) || (!nw && P >= B.late[0] && P < B.black[1]) || (nw && P >= 25.8 && P < B.nWalk[1]);
    const lampOn = ownerIn && (hod > 18 || hod < 6.5) && !(nw && P > B.nLamp[0] + 0.03);
    s.lamp.spot.intensity = lampOn ? 7 * (1 - (nw ? 0 : range(P, B.black[0], B.black[0] + 0.12))) : 0;
    // Its shadow map is drawn only while it shines.
    s.lamp.spot.shadow.autoUpdate = lampOn;
    (s.lamp.bulb.material as THREE.MeshBasicMaterial).color.setRGB(3.4, 2.4, 1.4).multiplyScalar(lampOn ? 1 : 0.02);
    const lidOpen = this.lidAt(P);
    s.laptop.lid.rotation.set(lerp(-Math.PI / 2 + 0.03, 0.33, lidOpen), Math.PI, 0);
    s.screenLight.intensity = ownerIn ? 0.9 * smooth(range(lidOpen, 0.5, 1)) : 0;
    (s.laptop.screen.material as THREE.MeshBasicMaterial).color.setScalar(ownerIn ? 1.15 * smooth(range(lidOpen, 0.6, 1)) : 0.02);
    s.ceiling.intensity = ownerIn && !lampOn && night < 0.5 ? 2.2 : 0;
    s.wall.intensity = night > 0.4 ? 9 * night : 0;
    (s.wallGlow.material as THREE.MeshBasicMaterial).color.setRGB(3.2, 2.5, 1.7).multiplyScalar(night > 0.4 ? night : 0.03);
    this.town.pool(0, s.wallAt.x, s.wallAt.z + 2.2, 4.0, night > 0.4 ? 1.1 * night : 0, WALL_COL);
    s.clutter.visible = !nw && P < B.fall[1];
    // The clock on the office wall.
    const hh = ((hours % 12) + 12) % 12;
    s.clock.hands[0].quaternion.setFromAxisAngle(V(1, 0, 0), -(hh / 12) * Math.PI * 2);
    s.clock.hands[1].quaternion.setFromAxisAngle(V(1, 0, 0), -(hours % 1) * Math.PI * 2);
    // The roller door is up in working hours.
    s.roller.scale.y = hod > 7.5 && hod < 17.5 ? 0.08 : 1;
    // The office door opens as the owner leaves.
    s.door.pivot.rotation.y = -1.3 * bump(P, B.nWalk[0] + 0.1, B.nWalk[1] + 0.06, 0.06);

    // The vans.
    const v = this.vanAt(P);
    this.ourVan.position.copy(v.p);
    this.ourVan.rotation.set(0, v.yaw, 0);
    this.roll(this.ourVan);
    this.ourVan.visible = !(nw && P >= 25.78 && P < 26.0);
    // The driver's door: open for the owner, shut behind them.
    this.shop.van.door.rotation.y = nw ? 1.2 * smooth(range(P, B.nIn[0] - 0.08, B.nIn[0])) * (1 - smooth(range(P, B.nIn[1] - 0.03, B.nIn[1] + 0.05))) : 0;
    (this.shop.van.lights.material as THREE.MeshBasicMaterial).color.setScalar(0.03 + v.lights * 3);
    const rivalK = !nw && P >= B.van[0] && P < 12.8 ? smooth(k(P, B.van)) : 0;
    this.rival.visible = rivalK > 0;
    this.rival.position.set(lerp(-12, -44, rivalK), 0, 3.4);
    this.rival.rotation.set(0, -Math.PI / 2, 0);
    this.roll(this.rival);
  }

  /**
   * THE SEASONS: as a year goes by (both halves), the town's foliage turns:
   * amber, then thin and dull through the winter, then fresh green again.
   */
  private seasons(P: number) {
    const foliage = this.town.mats[1] as THREE.MeshStandardMaterial;
    let yr = -1;
    if (inW(P, B.year)) yr = k(P, B.year);
    else if (inW(P, B.nYear)) yr = k(P, B.nYear);
    const c = foliage.color;
    if (yr < 0) {
      c.setScalar(1);
      return;
    }
    // Late summer (green) → autumn (amber) → winter (thin, grey-green) → spring (fresh) → summer.
    const amber = smooth(range(yr, 0.08, 0.3)) * (1 - smooth(range(yr, 0.38, 0.56)));
    const winter = smooth(range(yr, 0.4, 0.58)) * (1 - smooth(range(yr, 0.7, 0.86)));
    const spring = smooth(range(yr, 0.78, 0.9)) * (1 - smooth(range(yr, 0.94, 1)));
    c.setScalar(1);
    c.lerp(new THREE.Color(1.55, 0.74, 0.3), amber);
    c.lerp(new THREE.Color(0.6, 0.58, 0.5), winter);
    c.lerp(new THREE.Color(0.92, 1.12, 0.78), spring);
  }

  /** The traffic: cars along the main street, each on its own lap, on real time. */
  private drive(t: number) {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const one = V(1, 1, 1);
    const tt = this.reduced ? 0 : t;
    for (let i = 0; i < TRAFFIC; i++) {
      const side = i % 2 ? 1 : -1;
      const speed = 9 + (i % 3) * 1.6;
      const lap = 300;
      const x = ((((tt * speed + i * 97) % lap) + lap) % lap) - lap / 2;
      // On the two cross streets (the main street is the story's), each lane on the left (New Zealand).
      const dir = side < 0 ? -1 : 1;
      const z = (i < 2 ? 46 : -46) + side * 1.2;
      m.compose(V(x * dir, 0, z), q.setFromAxisAngle(V(0, 1, 0), dir > 0 ? Math.PI / 2 : -Math.PI / 2), one);
      this.traffic.body.setMatrixAt(i, m);
      this.traffic.dark.setMatrixAt(i, m);
    }
    this.traffic.body.instanceMatrix.needsUpdate = true;
    this.traffic.dark.instanceMatrix.needsUpdate = true;
  }

  /** A van's wheels turn with the road it covers, and its body rides on its springs. */
  private roll(van: THREE.Group) {
    const ud = van.userData as { last?: THREE.Vector3; odo?: number };
    const last = (ud.last ??= van.position.clone());
    const fwd = V(Math.sin(van.rotation.y), 0, Math.cos(van.rotation.y));
    const d = van.position.clone().sub(last).dot(fwd);
    last.copy(van.position);
    if (Math.abs(d) > 3) return; // (a jump of the film, not a drive)
    ud.odo = (ud.odo ?? 0) + d;
    for (const c of van.children) {
      if (c.name === "wheel") c.rotateY(-d / 0.36);
      else if (c.name === "vanBody") c.position.y = Math.abs(d) > 0.0005 ? Math.sin((ud.odo ?? 0) * 5.3) * 0.012 : 0;
    }
  }

  /** The laptop's lid: 0 shut … 1 open. */
  private lidAt(P: number) {
    if (P < B.ownerIn[0]) return 0;
    if (P < 16.4) return smooth(range(P, 7.02, 7.1));
    if (P < 25.8) return 0;
    return 1 - smooth(k(P, B.nClose));
  }

  private deckWas = -1;
  private deck(kb: number, weather: number) {
    const h = this.home;
    const d = h.newDeck;
    const old = h.oldBits;
    // The old deck: there until the build begins; its boards lift off first.
    const strip = clamp01(kb / 0.18);
    h.oldDeck.visible = kb < 0.2;
    old.mesh.visible = kb < 0.2;
    if (old.mesh.visible) {
      const m = new THREE.Matrix4();
      const zero = new THREE.Matrix4().makeScale(0, 0, 0);
      old.rest.forEach((r, i) => {
        const go = clamp01(strip * 1.4 - (i / old.rest.length) * 0.4);
        if (go <= 0) {
          old.mesh.setMatrixAt(i, r);
          return;
        }
        const e = go * go;
        m.copy(r).premultiply(new THREE.Matrix4().makeTranslation(0, e * 3, -e * 6));
        m.multiply(new THREE.Matrix4().makeRotationX(e * 1.2));
        old.mesh.setMatrixAt(i, go >= 1 ? zero : m);
      });
      old.mesh.instanceMatrix.needsUpdate = true;
    }
    // The new deck, piece by piece: piles, bearers, joists, boards, then the step and planter.
    d.mesh.visible = kb > 0.12;
    if (!d.mesh.visible) return;
    const key = Math.round(kb * 400) + Math.round(weather * 100) * 1000;
    if (key === this.deckWas) return;
    this.deckWas = key;
    const n = d.rest.length;
    const slots: Record<number, [number, number]> = { 0: [0.14, 0.3], 1: [0.28, 0.4], 2: [0.36, 0.52], 3: [0.5, 0.92], 4: [0.9, 1.0] };
    const counts: Record<number, number> = {};
    const idx: Record<number, number> = {};
    d.kind.forEach((kk) => (counts[kk] = (counts[kk] ?? 0) + 1));
    const m = new THREE.Matrix4();
    const grey = new THREE.Color(0.7, 0.81, 0.98);
    const col = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const kind = d.kind[i];
      const j = (idx[kind] = (idx[kind] ?? -1) + 1);
      const [a, b] = slots[kind];
      const t0 = a + ((b - a) * j) / Math.max(1, counts[kind]);
      const u = clamp01((kb - t0) / 0.06);
      if (u <= 0) m.makeScale(0, 0, 0);
      else {
        // Drops in from above and settles with a little weight.
        const fall = (1 - settle(1 - (1 - u) * (1 - u), 0.3)) * 1.2;
        m.copy(d.rest[i]).premultiply(new THREE.Matrix4().makeTranslation(0, fall, 0));
      }
      d.mesh.setMatrixAt(i, m);
      col.setRGB(1, 1, 1).lerp(grey, weather);
      d.mesh.setColorAt(i, col);
    }
    d.mesh.instanceMatrix.needsUpdate = true;
    if (d.mesh.instanceColor) d.mesh.instanceColor.needsUpdate = true;
  }

  /* ---------------------------------------------------------------- */
  /* The people                                                        */
  /* ---------------------------------------------------------------- */

  private samAt(P: number, t: number, nw: boolean, o: Pose): Pose {
    const h = this.home;
    // On the deck Sam faces the garden (world +Z: yaw 0).
    const deckSpot = H(-1.6, 0.6, -6.3);
    if (!nw) {
      if (P < B.fold[1] + 0.04) {
        const typing = inW(P, B.type) ? 1 : 0;
        return sofaPhone(o, h.seat, h.seatYaw, h.floor, t, 0.62 + 0.15 * typing, P > B.lift[0] ? 1 : 0.4, 0.25);
      }
      if (P < B.samBed) {
        const check = bump(P, B.samCheck[0], B.samCheck[1], 0.06);
        return sofaPhone(o, h.seat, h.seatYaw, h.floor, t, 0.15 + 0.7 * check, check * 0.5, 0.7 - check * 0.4);
      }
      // A summer on the new deck: out through the sliders for a look at it, back in; a year;
      // out again with the phone; then a step across to see the van go by.
      const deck = this.samDeck(P, t, o, deckSpot, [10.66, 10.92], [11.0, 11.24], null, false);
      if (deck) return deck;
      const later = this.samDeck(P, t, o, deckSpot, [11.6, 11.86], [B.van[0], 12.8], [B.van[0], 12.3], true);
      if (later) return later;
      o.visible = 0;
      return o;
    }
    if (P < B.n3am[0]) {
      const typing = inW(P, B.nForm) ? 1 : 0;
      // The reply lands: a start, the phone lifted, the head up for a moment.
      const oh = bump(P, B.nBack[1], B.nBack[1] + 0.24, 0.05);
      sofaPhone(o, h.seat, h.seatYaw, h.floor, t, 0.62 + 0.15 * typing + 0.14 * oh, 1, 0.25 - 0.1 * oh);
      o.head[0] -= 0.3 * oh;
      o.neck[0] -= 0.12 * oh;
      return o;
    }
    if (inW(P, [22.36, 22.6])) return sofaPhone(o, h.seat, h.seatYaw, h.floor, t, 0.66, 1, 0.3);
    // Yes said, up from the sofa and off to bed (the lamp goes off at the door).
    if (inW(P, [22.6, 22.8])) {
      const bed = [H(-2.1, 0, -0.62), H(-0.7, 0, -0.62), H(0.25, 0, -0.3), H(0.25, 0, 0.66), H(0.25, 0, 2.2)];
      walk(this.poseC, bed, smooth(range(P, 22.62, 22.8)) * pathLength(bed), t, 0, null, this.homeFloor);
      carryPhone(this.poseC);
      const up = smooth(range(P, 22.6, 22.66));
      if (up < 1) {
        sofaPhone(this.poseD, h.seat, h.seatYaw, h.floor, t, 0.66, 0, 0.3);
        return blend(this.poseD, this.poseC, up, o);
      }
      return copyPose(this.poseC, o);
    }
    // Out onto the new deck as its last boards land; in for the year, out again.
    const a = this.samDeck(P, t, o, deckSpot, [22.96, 23.14], [B.nYear[0], B.nYear[0] + 0.18], null, true);
    if (a) return a;
    const b = this.samDeck(P, t, o, deckSpot, [B.nYear[1] - 0.18, B.nYear[1]], [B.nVan[0], 25.8], [B.nVan[0], B.nVan[0] + 0.16], true);
    if (b) return b;
    o.visible = 0;
    return o;
  }

  /** Where Sam walks: inside it is the room's floor, out past the sliders the deck's (a step up). */
  private homeFloor = (x: number, z: number) => {
    const lz = 15.5 - z;
    return 0.45 + 0.15 * smooth(clamp01((-4.35 - lz) / 0.4));
  };
  /** The hall, the doorway behind the sofa, round the room, the sliders, the deck. */
  private samWay(out: boolean) {
    const p = [H(0.25, 0, 2.2), H(0.25, 0, 0.66), H(0.25, 0, -0.3), H(-0.6, 0, -3.0), H(-1.3, 0, -4.6), H(-1.6, 0, -6.3)];
    return out ? p : p.reverse();
  }
  /**
   * A stretch of time on the deck: walk out over `outW`, stand (with the phone
   * up, or looking at the garden), then either walk back in from `inW_[0]` or,
   * with `aside`, step across the deck to look toward the street until
   * `inW_[1]`. Null outside it.
   */
  private samDeck(P: number, t: number, o: Pose, spot: THREE.Vector3, outW: W, inW_: W, aside: W | null, phone: boolean): Pose | null {
    if (P < outW[0] || P >= inW_[1]) return null;
    const hold = (into: Pose) => (phone ? standPhone(into, spot, 0, t, 0.7, 1) : stand(into, spot, 0, t, H(-1.0, 1.2, -14)));
    const go = (into: Pose, w: W, out: boolean) => {
      const way = this.samWay(out);
      walk(into, way, smooth(k(P, w)) * pathLength(way), t, 0, null, this.homeFloor);
      if (phone) carryPhone(into);
      return into;
    };
    // Out, easing into the stand as the last steps land.
    if (P < outW[1]) {
      go(this.poseC, outW, true);
      const settle = smooth(range(P, outW[1] - 0.05, outW[1]));
      if (settle <= 0) return copyPose(this.poseC, o);
      hold(this.poseD);
      return blend(this.poseC, this.poseD, settle, o);
    }
    if (aside) {
      // A few steps across, the phone lowered, then a look toward the street.
      const to = H(-2.6, 0.6, -5.2);
      if (P < aside[0]) return hold(o);
      const path = [spot.clone().setY(0), to.clone().setY(0)];
      walk(this.poseC, path, smooth(k(P, aside)) * pathLength(path), t, 0, null, this.homeFloor);
      if (phone) carryPhone(this.poseC);
      const lower = smooth(range(P, aside[0], aside[0] + 0.05));
      if (lower < 1) {
        hold(this.poseD);
        return blend(this.poseD, this.poseC, lower, o);
      }
      if (P < aside[1]) return copyPose(this.poseC, o);
      stand(this.poseD, to, Math.PI, t, V(-36, 1.5, 3.4));
      if (phone) carryPhone(this.poseD);
      const turn = smooth(range(P, aside[1], aside[1] + 0.06));
      return blend(this.poseC, this.poseD, turn, o);
    }
    if (P < inW_[0]) return hold(o);
    // Back in, turning off the stand.
    go(this.poseC, inW_, false);
    const leave = smooth(range(P, inW_[0], inW_[0] + 0.05));
    if (leave >= 1) return copyPose(this.poseC, o);
    hold(this.poseD);
    return blend(this.poseD, this.poseC, leave, o);
  }

  /** The office's floor inside the front wall, the yard's outside. */
  private shopFloor = (x: number, z: number) => 0.15 * smooth(clamp01((-10.8 - z) / 0.3));
  /** Up into the van's cab past its side. */
  private vanStep = (x: number) => 0.45 * smooth(clamp01((x - 46.45) / 0.35));

  private ownerAt(P: number, t: number, nw: boolean, o: Pose): Pose {
    const s = this.shop;
    const F = 0.15;
    if (!nw) {
      // Morning: along the footpath, into the yard, through the door, to the desk; sits.
      if (P >= 6.6 && P < 7.04) {
        const door = s.doorAt;
        const path = [V(60, 0, -1.6), V(44.4, 0, -2.4), V(43.2, 0, -8.0), V(door.x, 0, door.z), S(-1.62, 0, 5.6), S(-2.0, 0, 4.4), S(-3.0, 0, 2.7), V(s.seat.x, 0, s.seat.z + 0.05)];
        walk(this.poseA, path, smooth(range(P, 6.6, 6.98)) * pathLength(path), t, 0, null, this.shopFloor);
        const sit = smooth(range(P, 6.95, 7.04));
        if (sit <= 0) return copyPose(this.poseA, o);
        deskType(this.poseB, s.seat, s.seatYaw, F, s.keys, t, 0.15, 0.05);
        return blend(this.poseA, this.poseB, sit, o);
      }
      if (P >= 7.04 && P < 10.42) {
        const busy = inW(P, B.reply) || inW(P, B.sheet) || inW(P, B.quote) || inW(P, B.invoice) ? 1 : 0.15;
        const slump = inW(P, B.quote) || inW(P, B.invoice) ? 0.45 : 0.05;
        return deskType(o, s.seat, s.seatYaw, F, s.keys, t, busy, slump);
      }
      if (P >= B.late[0] && P < B.black[0] + 0.16) {
        deskType(o, s.seat, s.seatYaw, F, s.keys, t, P < B.handsOff[0] ? 1 : 0, 1);
        // Late: now and then a hand to the face.
        const rub = bump(P, 13.42, 13.66, 0.06);
        if (rub > 0) {
          const face = this.owner.toWorld(0.0, 1.38, 0.12);
          o.hands[1].p.lerp(face.add(V(0.02, -0.02, 0.06)), rub);
          o.head[0] += 0.12 * rub;
        }
        // Hands off the keyboard: up and back into the lap; a lean back.
        const off = ke(P, B.handsOff);
        if (off > 0) {
          for (let i = 0; i < 2; i++) o.hands[i].p.lerp(s.seat.clone().add(V((i === 0 ? 1 : -1) * 0.12, 0.12, 0.24)), off);
          o.spine[0] -= 0.12 * off;
          o.chest[0] -= 0.1 * off;
          o.head[0] -= 0.08 * off;
        }
        return o;
      }
      o.visible = 0;
      return o;
    }
    if (P >= 25.8 && P < B.nStand[0]) {
      deskType(o, s.seat, s.seatYaw, F, s.keys, t, P < B.nClose[0] ? 0.25 : 0, 0);
      // Close the lid (both hands to its top edge), then the lamp's switch.
      const close = bump(P, B.nClose[0] - 0.04, B.nClose[1] + 0.04, 0.05);
      if (close > 0) {
        const lidK = 1 - this.lidAt(P);
        const top = s.laptop.hinge.clone().add(V(0, 0.2 * Math.cos(lidK * 1.2), -0.2 * Math.sin(lidK * 1.4)));
        for (let i = 0; i < 2; i++) o.hands[i].p.lerp(top.clone().add(V((i === 0 ? 1 : -1) * 0.1, 0.01, -0.02)), close);
      }
      const sw = bump(P, B.nLamp[0] - 0.05, B.nLamp[1] + 0.05, 0.04);
      if (sw > 0) {
        o.hands[1].p.lerp(s.lamp.switch.clone().add(V(0, 0.035, -0.02)), sw);
        o.spine[0] += 0.12 * sw;
        o.chest[1] -= 0.22 * sw;
        o.chest[2] -= 0.08 * sw;
      }
      return o;
    }
    if (P >= B.nWalk[1] && P < B.nIn[1]) {
      // The driver's door open, a duck, in; the door shuts behind.
      const path = [S(1.9, 0, 9.6), S(2.15, 0, 10.15), S(3.1, 0, 10.3), S(3.3, 0, 10.1)];
      walk(this.poseA, path, smooth(range(P, B.nIn[0], B.nIn[1] - 0.02)) * pathLength(path), t, 0, null, this.vanStep);
      const duck = smooth(range(P, B.nIn[0], B.nIn[0] + 0.06));
      this.poseA.spine[0] += 0.62 * duck;
      this.poseA.chest[0] += 0.36 * duck;
      this.poseA.head[0] += 0.25 * duck;
      return copyPose(this.poseA, o);
    }
    if (P >= B.nStand[0] && P < B.nWalk[1]) {
      // Up from the chair, out of the office's door, round to the van's driver door.
      const door = s.doorAt;
      const path = [V(s.seat.x, 0, s.seat.z + 0.05), S(-3.0, 0, 2.7), S(-2.0, 0, 4.4), S(-1.62, 0, 5.6), V(door.x, 0, door.z), S(-1.2, 0, 8.0), S(1.9, 0, 9.6)];
      const len = pathLength(path);
      const up = ke(P, B.nStand);
      const sK = P < B.nWalk[0] ? 0 : smooth(k(P, B.nWalk)) * len;
      walk(this.poseA, path, sK, t, 0, null, this.shopFloor);
      if (up < 1) {
        deskType(this.poseB, s.seat, s.seatYaw, F, s.keys, t, 0, 0);
        return blend(this.poseB, this.poseA, up, o);
      }
      return copyPose(this.poseA, o);
    }
    o.visible = 0;
    return o;
  }

  private people(P: number, t: number, nw: boolean) {
    this.samAt(P, t, nw, this.samPose);
    apply(this.sam, this.samPose);
    placePhone(this.samPhone, this.samPose);
    this.ownerAt(P, t, nw, this.ownerPose);
    apply(this.owner, this.ownerPose);
    // The phone's glow on the face.
    const onPhone = this.samPhone.group.visible;
    this.phoneLight.intensity = onPhone ? 0.3 : 0;
    if (onPhone) this.phoneLight.position.copy(this.samPhone.group.position).add(new THREE.Vector3(0, 0, 0.08).applyQuaternion(this.samPhone.group.quaternion));
    // Pools under the feet.
    const sh = this.shadeG;
    sh.begin();
    for (const fig of [this.sam, this.owner])
      if (fig.root.visible)
        for (const foot of fig.feet) {
          const p = foot.getWorldPosition(new THREE.Vector3());
          sh.add(p.x, p.z + 0.04, 0.16, 0.32, fig.root.rotation.y, 0.55, p.y - 0.075);
        }
    sh.end();
  }

  /* ---------------------------------------------------------------- */
  /* The screens: Sam's phone, the owner's laptop                       */
  /* ---------------------------------------------------------------- */

  private screens(P: number, t: number, hours: number, nw: boolean) {
    const time = uiTime(hours);
    const ph = this.phoneScreen;
    if (!nw) {
      if (P < B.site[0]) {
        const tap = bump(P, B.tap - 0.08, B.tap + 0.08, 0.04);
        ph.draw(`search|${time}|${tap.toFixed(2)}`, (c) => UI.phoneSearch(c, { time, tap, q: "deck builders near me" }));
      } else if (P < B.form) {
        const secs = Math.floor(k(P, B.site) * 6.6 * 5) / 5;
        const popup = Math.round(bump(P, B.popup[0], B.popup[1] + 0.02, 0.02) * 8) / 8;
        const scroll = Math.round(ke(P, B.scroll) * 40) / 40;
        const spin = secs < 5.6 ? Math.floor(t * 8) % 12 : 0;
        ph.draw(`slow|${secs.toFixed(1)}|${popup}|${scroll}|${spin}`, (c) => UI.phoneSlowSite(c, { time, t: secs, scroll, popup, spin }));
      } else if (P < B.fold[0] + 0.06) {
        const n = Math.floor(k(P, B.type) * 92 / 3) * 3;
        const sent = range(P, B.send - 0.02, B.send + 0.06);
        ph.draw(`form|${Math.floor(n)}|${sent.toFixed(2)}`, (c) => UI.phoneOldForm(c, { time, typed: n, sent }));
      } else if (P < 10) {
        const replyAt = P >= B.replySent ? "9:13am" : undefined;
        const refresh = bump(P, B.samCheck[0], B.samCheck[1], 0.04);
        ph.draw(`wait|${time}|${replyAt}|${refresh > 0.5 ? Math.floor(t * 4) : 0}`, (c) => UI.phoneWaiting(c, { time, refresh, sentAt: "7:40pm", replyAt }));
      } else {
        const tap = bump(P, B.search[1] - 0.06, B.search[1] + 0.04, 0.03);
        ph.draw(`later|${time}|${tap.toFixed(2)}`, (c) => UI.phoneSearchLater(c, { time, tap }));
      }
    } else {
      if (P < B.nFly[0]) {
        const form = P >= B.nTap + 0.04 ? 1 : 0;
        const tap = bump(P, B.nTap - 0.06, B.nTap + 0.05, 0.03);
        const fill = ke(P, B.nForm);
        const sent = range(P, B.nSend - 0.02, B.nSend + 0.04);
        ph.draw(`fast|${form}|${tap.toFixed(2)}|${Math.floor(fill * 60)}|${sent.toFixed(2)}`, (c) => UI.phoneFastSite(c, { time, form, fill, sent, tap }));
      } else if (P < 22.0) {
        const picked = range(P, B.nPick - 0.02, B.nPick + 0.04);
        ph.draw(`reply|${picked.toFixed(2)}`, (c) => UI.phoneReply(c, { time, at: "7:41pm", picked, show: 1 }));
      } else if (P < 23.0) {
        const done = range(P, B.nAccept[1] - 0.04, B.nAccept[1]);
        ph.draw(`accept|${done.toFixed(2)}`, (c) => UI.phoneDoc(c, { time, kind: "quote", done }));
      } else if (P < 23.8) {
        const done = range(P, B.nPaid - 0.04, B.nPaid);
        ph.draw(`pay|${done.toFixed(2)}`, (c) => UI.phoneDoc(c, { time, kind: "invoice", done }));
      } else if (P < 24.9) {
        const stars = ke(P, [24.0, 24.28]) * 5;
        ph.draw(`review|${stars.toFixed(2)}`, (c) => UI.phoneReview(c, { time, stars }));
      } else {
        const tap = bump(P, 25.18, 25.28, 0.03);
        const booked = range(P, 25.24, 25.3);
        ph.draw(`follow|${tap.toFixed(2)}|${booked.toFixed(2)}`, (c) => UI.phoneFollow(c, { time, booked, tap }));
      }
    }

    // THE LAPTOP.
    const lp = this.laptopScreen;
    if (!nw) {
      if (P < B.sheet[0] - 0.02) {
        const open = range(P, B.find[0], B.find[1]);
        const typed = Math.floor(k(P, B.reply) * 104 / 3) * 3;
        const sent = P >= B.replySent ? 1 : 0;
        lp.draw(`inbox|${open.toFixed(2)}|${Math.floor(typed)}|${sent}`, (c) => UI.deskInbox(c, { unread: 22, open, typed, time, sent }));
      } else if (P < 12.5) {
        // (The cards draw themselves; the laptop shows whichever is in hand.)
      } else lp.draw("late", (c) => UI.deskInbox(c, { unread: 52, open: 0, typed: 0, time: "11:47", sent: 0 }));
      const mat = this.shop.laptop.screen.material as THREE.MeshBasicMaterial;
      const want = P >= B.sheet[0] - 0.02 && P < 12.5 ? (P < B.quote[0] || (P >= B.quote[1] + 0.06 && P < B.invoice[0]) ? this.sheetCard.screen.tex : P < B.quote[1] + 0.06 ? this.quoteCard.screen.tex : this.invoiceCard.screen.tex) : lp.tex;
      if (mat.map !== want) {
        mat.map = want;
        mat.needsUpdate = true;
      }
    } else {
      const n = ke(P, B.nToday) * 5;
      lp.draw(`today|${n.toFixed(1)}`, (c) => UI.today(c, { n }));
      const mat = this.shop.laptop.screen.material as THREE.MeshBasicMaterial;
      if (mat.map !== lp.tex) {
        mat.map = lp.tex;
        mat.needsUpdate = true;
      }
    }
  }

  private sheetDraw(sc: Screen, P: number) {
    const typed = Math.floor(k(P, B.sheet) * 64 / 2) * 2;
    const cold = k(P, B.cold);
    const status = P >= B.accept[1] ? "Accepted" : undefined;
    const paid = P >= B.paid ? 1 : 0;
    sc.draw(`sheet|${Math.floor(typed)}|${cold.toFixed(2)}|${status}|${paid}`, (c) => UI.sheet(c, { typed, paid, scroll: 0, lost: cold > 0 ? 1 : 0, extra: 0, highlight: 1, cold, status }));
  }
  private quoteDraw(sc: Screen, P: number) {
    const typed = Math.floor(k(P, B.quote) * 120 / 3) * 3;
    const sent = P >= B.quoteSent ? 1 : 0;
    sc.draw(`quote|${Math.floor(typed)}|${sent}`, (c) => UI.docCard(c, { kind: "quote", typed, stamp: 0, auto: false, sent }));
  }
  private invoiceDraw(sc: Screen, P: number) {
    const typed = Math.floor(k(P, B.invoice) * 90 / 3) * 3;
    const stamp = range(P, B.paid, B.paid + 0.08);
    const sent = P >= B.invoice[1] ? 1 : 0;
    sc.draw(`invoice|${Math.floor(typed)}|${stamp.toFixed(2)}|${sent}`, (c) => UI.docCard(c, { kind: "invoice", typed, stamp, auto: false, sent }));
  }

  /* ---------------------------------------------------------------- */
  /* Cards in the air                                                  */
  /* ---------------------------------------------------------------- */

  private cards(P: number, t: number, nw: boolean) {
    // SAM'S PHONE, LIFTED: off the phone into the air beside Sam, readable.
    const pc = this.phoneCard;
    const phoneG = this.samPhone.group;
    const dev = { p: phoneG.position.clone(), q: phoneG.quaternion.clone(), s: 0.105 };
    const onDeck = (P >= 10 && P < 12.8) || P >= 23.1;
    const air = onDeck ? { p: H(-0.2, 1.62, -6.0), q: Q(0, 0.22, 0), s: 1 } : { p: H(-3.25, 1.5, -2.5), q: Q(-0.03, 0.12, 0), s: 1 };
    const windows: [number, number][] = [
      [B.lift[0], B.fold[1]],
      [B.year[1] + 0.02, B.search[1] + 0.12],
      [B.nLift[0], B.nSend + 0.16],
      [B.nBack[1] - 0.02, B.nPick + 0.18],
      [22.38, 22.6],
      [23.14, 23.6],
      [23.88, 24.4],
      [25.0, 25.36],
    ];
    let lift = 0;
    let show = false;
    for (const [a, b] of windows)
      if (P >= a - 0.001 && P < b) {
        lift = smoother(range(P, a, a + 0.12)) * (1 - smoother(range(P, b - 0.1, b)));
        show = true;
      }
    // The old enquiry folds into the envelope as it leaves.
    const fold = !nw && P < B.fold[1] + 0.06 ? ke(P, B.fold) : 0;
    if (show && phoneG.visible) {
      carry(pc.group, dev, air, settle(lift, 0.35));
      // Turn toward the camera about the vertical as it lifts.
      const camYaw = Math.atan2(this.camera.position.x - pc.group.position.x, this.camera.position.z - pc.group.position.z);
      const cur = new THREE.Euler().setFromQuaternion(pc.group.quaternion, "YXZ");
      pc.group.rotation.set(cur.x * (1 - lift) + fold * 1.2, lerp(cur.y, camYaw, lift * 0.85), cur.z * (1 - lift), "YXZ");
      if (fold > 0) pc.group.scale.multiplyScalar(1 - fold * 0.7);
      pc.show(Math.min(1, lift * 4) * (1 - fold), 1.05);
    } else pc.show(0);

    // THE ADMIN CARDS: off the laptop to their places above the desk, one each time the details are typed again.
    const lid = { p: this.shop.laptop.hinge.clone().add(V(0, 0.12, -0.02)), q: Q(0, Math.PI, 0), s: 0.2 };
    const slot = (x: number, y: number, z: number, yaw: number) => ({ p: S(x, y, z), q: Q(0, Math.PI + yaw, 0), s: 1 });
    const placeAdmin = (card: Card, at: number, to: { p: THREE.Vector3; q: THREE.Quaternion; s: number }) => {
      if (this.falling(P, card)) return;
      if (nw || P < at || P >= B.fall[0]) {
        card.show(0);
        return;
      }
      const kk = smoother(range(P, at, at + 0.14));
      carry(card.group, lid, to, settle(kk, 0.45), 0.15);
      card.show(Math.min(1, kk * 3), 1.05);
    };
    this.sheetDraw(this.sheetCard.screen, P);
    this.quoteDraw(this.quoteCard.screen, P);
    this.invoiceDraw(this.invoiceCard.screen, P);
    placeAdmin(this.sheetCard, B.sheet[0], slot(-5.45, 1.88, 5.0, -0.32));
    placeAdmin(this.quoteCard, B.quote[0] - 0.02, slot(-3.9, 2.02, 5.25, 0));
    placeAdmin(this.invoiceCard, B.invoice[0], slot(-2.35, 1.88, 5.0, 0.32));

    // 11:47PM: the jobs still waiting crowd in round the desk.
    const jobs: [string, string, string, "amber" | "red" | "ink"][] = [
      ["To quote", "Lucy", "Pergola, measured last week", "amber"],
      ["Overdue", "Jono", "Invoice 0311, 34 days", "red"],
      ["Call back", "Kiri", "Never got the quote", "red"],
      ["To quote", "Ana", "Asked if you take new jobs", "amber"],
      ["Reply", "Hemi", "Deck repair, how soon?", "ink"],
    ];
    const spots: [number, number, number, number, number][] = [
      [-6.2, 1.3, 4.6, -0.6, 0.12],
      [-1.7, 1.25, 4.5, 0.55, -0.1],
      [-5.0, 2.45, 4.8, -0.25, -0.08],
      [-2.7, 2.5, 4.9, 0.3, 0.1],
      [-6.05, 2.1, 3.9, -0.95, 0.05],
    ];
    this.pend.forEach((card, i) => {
      const [tag, title, line, tone] = jobs[i];
      card.screen.draw(`pend|${i}`, (c) => UI.pending(c, { tag, title, line, tone }));
      if (this.falling(P, card)) return;
      if (nw || P < B.late[0] || P >= B.fall[0]) {
        card.show(0);
        return;
      }
      const [x, y, z, yaw, roll] = spots[i];
      const kk = smoother(range(P, B.late[0] + 0.05 + i * 0.05, B.late[0] + 0.2 + i * 0.05));
      const to = { p: S(x, y + Math.sin(t * 0.6 + i) * 0.01, z), q: Q(0, Math.PI + yaw, roll), s: 1 };
      carry(card.group, { p: to.p.clone().add(V(0, 0.4, 0.6)), q: to.q, s: 0.6 }, to, settle(kk, 0.45));
      card.show(kk, 1.0);
    });

    // THE NEW WAY'S CARDS, under their parts of the route.
    const under = (card: Card, node: number, on: number, draw: () => void) => {
      if (on <= 0.002) {
        card.show(0);
        return;
      }
      draw();
      const n = NODES[node].pos;
      const yaw = Math.atan2(this.camera.position.x - n.x, this.camera.position.z - n.z);
      // Hung under its station's tag, built top-down as it arrives.
      card.group.position.set(n.x, n.y - CARD_DROP - (1 - on) * 0.5, n.z);
      card.group.rotation.set(-0.04, yaw, 0);
      card.group.scale.setScalar(0.85 + 0.15 * on);
      card.build = smooth(on);
      card.show(Math.min(1, on * 2.5), 1.0);
    };
    const bookings: UI.Booking[] = [
      { day: 0, h: 9, len: 3, label: "Fence", who: "Aroha", at: 0 },
      { day: 1, h: 13, len: 4, label: "Bathroom", who: "Jono", at: 0 },
      { day: 3, h: 8, len: 2, label: "Repair", who: "Ravi", at: 0 },
      { day: 2, h: 14, len: 1, label: "Measure-up", who: "Sam", at: 1, auto: true },
      { day: 3, h: 11, len: 1, label: "Measure-up", who: "Aroha", at: 2, auto: true },
    ];
    const calNow = P < B.n3am[0] ? 1 + range(P, B.nBook[0], B.nBook[1]) * 0.2 : 2 + range(P, 21.2, 21.36) * 0.2;
    under(this.calCard, 2, nw ? clamp01(bump(P, B.nBook[0] - 0.02, B.n3am[0] + 0.02, 0.06) + bump(P, 21.12, 21.5, 0.06)) : 0, () =>
      this.calCard.screen.draw(`cal|${calNow.toFixed(2)}`, (c) => UI.holo(() => UI.calendar(c, { bookings, now: calNow, week: "This week" })))
    );
    under(this.handCard, 1, nw ? bump(P, B.nHand[0], B.nHand[1] + 0.02, 0.06) : 0, () => this.handCard.screen.draw("hand", (c) => UI.holo(() => UI.handover(c, { show: 1 }))));
    const qk = nw ? bump(P, B.nQuote[0], B.nQuoteSent + 0.12, 0.08) : 0;
    // Typed once: Sam's details fly from the website station into the quote as it builds.
    this.fields.update(this.system, this.system.nodeU[0], this.system.nodeU[3], nw ? range(P, B.nQuote[0] - 0.04, B.nQuote[0] + 0.2) : 0, this.nQuoteCard.group, qk > 0 ? 1 : 0, this.camera);
    under(this.nQuoteCard, 3, qk, () => {
      const sent = P >= B.nQuoteSent ? 1 : 0;
      this.nQuoteCard.screen.draw(`nquote|${sent}`, (c) => UI.holo(() => UI.docCard(c, { kind: "quote", typed: 999, stamp: 0, auto: true, sent })));
    });
    // Six o'clock: the day, on a card over the desk.
    const tk = nw ? bump(P, B.nToday[0], B.nClose[0] + 0.02, 0.06) : 0;
    if (tk > 0) {
      const n = ke(P, B.nToday) * 5;
      this.todayCard.screen.draw(`today|${n.toFixed(1)}`, (c) => UI.holo(() => UI.today(c, { n })));
      const arrive = smoother(range(P, B.nToday[0], B.nToday[0] + 0.12));
      carry(this.todayCard.group, lid, slot(-3.9, 1.98, 5.2, 0), settle(arrive, 0.4));
      this.todayCard.build = arrive;
      this.todayCard.show(tk, 1.0);
    } else this.todayCard.show(0);
  }

  /**
   * THE TURN'S FALL: a card that was in the air lets go and falls like paper,
   * slow, tipping and sliding side to side, fading as it goes into the dark.
   * Returns true while it is falling (and places it).
   */
  private falling(P: number, card: Card) {
    if (isNew(P) || P < B.fall[0] || P >= B.fall[1] + 0.1) {
      delete card.group.userData.rest;
      return false;
    }
    if (!card.group.visible && !card.group.userData.rest) return false;
    const st = (card.group.userData.rest ??= { p: card.group.position.clone(), q: card.group.quaternion.clone(), seed: Math.random() * 10 }) as { p: THREE.Vector3; q: THREE.Quaternion; seed: number };
    const u = k(P, B.fall);
    const sd = st.seed;
    const delay = (sd % 1) * 0.25;
    const tt = Math.max(0, u - delay) * 3.2;
    const drop = tt * tt * 0.5 + tt * 0.35;
    card.group.position.copy(st.p).add(V(Math.sin(tt * 2.2 + sd) * 0.3 * tt, -drop, Math.cos(tt * 1.7 + sd) * 0.22 * tt));
    card.group.quaternion.copy(st.q).multiply(Q(Math.sin(tt * 2.6 + sd) * 0.6 * Math.min(1, tt), tt * 0.4, Math.cos(tt * 2.1 + sd) * 0.5 * Math.min(1, tt)));
    card.show(1 - smooth(range(u, 0.45 + delay, 0.95)), 1.0);
    return true;
  }

  /* ---------------------------------------------------------------- */
  /* Messages in flight                                                */
  /* ---------------------------------------------------------------- */

  private mail(P: number, t: number) {
    const fl = this.flightAt(P);
    const cam = this.camera;
    if (fl) {
      const old = fl.f === this.flights.old;
      const vis = old ? range(P, B.fold[0] + 0.06, B.fold[1]) * (1 - range(P, B.land - 0.02, B.land + 0.02)) : range(fl.t, 0, 0.05) * (1 - range(fl.t, 0.95, 1));
      // It leaves at the size of the card it was folded from and grows as it climbs.
      const size = (old ? lerp(0.62, 1.6, smooth(range(fl.t, 0, 0.35))) : lerp(0.6, 1.2, smooth(range(fl.t, 0, 0.3)) * (1 - smooth(range(fl.t, 0.75, 1))) + 0.0));
      this.mailA.update(fl.f, fl.t, vis, cam, size, !old);
      this.mailLight.position.copy(this.mailA.pos);
      this.mailLight.intensity = 26 * vis;
    } else {
      this.mailA.update(null, 0, 0, cam);
      this.mailLight.intensity = 0;
    }
    // 3AM: another house's enquiry goes out and its answer comes back; at 7:12pm, another.
    const other = (w: [number, number], house: number, env: Envelope) => {
      if (P < w[0] || P >= w[1]) return false;
      const hh = this.town.houses[house];
      const from = hh.top.clone();
      const to = NODES[1].pos.clone();
      const u = k(P, w);
      const out = u < 0.5;
      const f: Flight = out ? { from, to, lift: 6, color: new THREE.Color(1.0, 0.62, 0.3) } : { from: to, to: from, lift: 5, color: new THREE.Color(0.55, 0.45, 1.0) };
      const tt = smoother(out ? u * 2 : u * 2 - 1);
      env.update(f, tt, range(tt, 0, 0.05) * (1 - range(tt, 0.95, 1)), cam, 1.0, true);
      return true;
    };
    if (!other([20.86, 21.06], 41, this.mailB) && !other(B.nLater, 77, this.mailB)) this.mailB.update(null, 0, 0, cam);
    // Yours (dropped in): out from a house; lost on the old route, answered on the new.
    let used = false;
    for (const d of this.drops) {
      const age = t - d.t0;
      if (age > 4.5) {
        if (!d.done) {
          d.done = true;
          if (d.lost) this.sim.yoursLost++;
          else this.sim.yoursKept++;
          this.events.push({ type: d.lost ? "lost" : "kept", pos: this.town.houses[d.house].top, user: true });
        }
        continue;
      }
      if (used) continue;
      used = true;
      const hh = this.town.houses[d.house];
      const target = d.stage === "new" ? NODES[1].pos.clone() : COLUMN_BASE.clone().setY(8);
      const f: Flight = { from: hh.top.clone(), to: target, lift: 10, color: d.lost ? new THREE.Color(1, 0.5, 0.3) : new THREE.Color(0.6, 0.5, 1) };
      const u = Math.min(1, age / 3.2);
      const vis = d.lost ? 1 - range(u, 0.4, 0.62) : 1 - range(u, 0.94, 1);
      this.mailC.update(f, d.lost ? u * 0.7 : u, vis, cam, 1.0, d.stage === "new");
    }
    if (!used) this.mailC.update(null, 0, 0, cam);
  }

  /* ---------------------------------------------------------------- */
  /* The inbox column                                                  */
  /* ---------------------------------------------------------------- */

  private column(P: number) {
    const st = this.strips;
    const on = !isNew(P) && P >= B.land - 0.01 && P < B.fall[1] + 0.1;
    st.mesh.visible = on;
    if (!on) return;
    const n = st.n;
    const states: number[] = [];
    // A pile that grows upward: the oldest (Sam's) at the bottom, each new one landing on top.
    const base = COLUMN_BASE;
    const SP = 0.56;
    const m = new THREE.Matrix4();
    const zero = new THREE.Matrix4().makeScale(0, 0, 0);
    const presence = (j: number) => smoother(range(P, this.stripP[j], this.stripP[j] + 0.05)) * (1 - smoother(range(P, this.coldP[j] + 0.06, this.coldP[j] + 0.2)));
    for (let i = 0; i < n; i++) {
      const pa = this.stripP[i];
      const cold = P >= this.coldP[i];
      states.push(cold ? 2 : i === 0 && P >= B.find[0] ? 1 : 0);
      if (P < pa) {
        st.place(i, zero, 0);
        continue;
      }
      let below = 0;
      for (let j = 0; j < i; j++) below += presence(j);
      const arr = smoother(range(P, pa, pa + 0.05));
      const y = base.y + below * SP + (1 - settle(arr, 0.3)) * 2.4;
      // Gone cold: it slides out to the side and falls away.
      const leave = range(P, this.coldP[i] + 0.06, this.coldP[i] + 0.2);
      const p = V(base.x + leave * 3.2, y - leave * leave * 5, base.z + leave * 0.6);
      const q = Q(0, 0, leave * 0.8);
      const fall = this.stripFall(P, i);
      if (fall) {
        m.compose(fall.p.add(p), fall.q.multiply(q), V(1, 1, 1));
        st.place(i, m, fall.k * (1 - leave));
      } else {
        m.compose(p, q, V(1, 1, 1));
        st.place(i, m, arr * (1 - leave));
      }
    }
    st.setStates(states);
    st.commit();
  }

  /** The turn: each strip falls like paper. */
  private stripFall(P: number, i: number) {
    if (P < B.fall[0]) return null;
    const u = k(P, B.fall);
    const sd = (i * 0.618) % 1;
    const tt = Math.max(0, u - sd * 0.3) * 3.0;
    const drop = tt * tt * 1.6 + tt * 0.8;
    return {
      p: V(Math.sin(tt * 2.0 + i) * 0.5 * tt, -drop, Math.cos(tt * 1.6 + i) * 0.4 * tt),
      q: Q(Math.sin(tt * 2.4 + i) * 0.7 * Math.min(1, tt), tt * 0.3, Math.cos(tt * 2.0 + i) * 0.6 * Math.min(1, tt)),
      k: 1 - smooth(range(u, 0.4 + sd * 0.3, 0.95)),
    };
  }

  /* ---------------------------------------------------------------- */
  /* The town's phones; the counters                                   */
  /* ---------------------------------------------------------------- */

  private crowdAndCounts(P: number, t: number, nw: boolean) {
    const show = nw ? bump(P, B.nOver[0], B.nOver[1], 0.1) : bump(P, B.over[0], B.over[1], 0.12);
    const secs = nw ? (P - B.nOver[0]) * 4 : k(P, B.site) * 6.6;
    const dropK = nw ? k(P, [B.nOver[0] + 0.2, B.nOver[1] - 0.08]) : k(P, B.drop);
    this.crowd.update(show, secs, dropK, nw, t, this.camera, 1.1 * uiScale.k);
    // The counters (the film's own customers).
    const L = this.sim.lost;
    const before = L.website + L.inbox + L.admin + L.followup;
    L.website = nw ? 53 : Math.round(53 * k(P, B.drop));
    L.inbox = nw ? 7 : P < B.land ? 0 : this.coldP.filter((c) => P >= c).length;
    L.admin = nw ? 3 : Math.min(3, Math.floor(k(P, B.cold) * 3.0001));
    L.followup = nw || P >= B.van[1] ? 6 : P >= B.year[0] ? Math.min(5, Math.floor(k(P, B.year) * 5.0001)) + (P >= B.van[0] + 0.2 ? 1 : 0) : 0;
    const after = L.website + L.inbox + L.admin + L.followup;
    const forward = P > this.prevP && P - this.prevP < 0.3;
    if (after > before && forward) for (let i = 0; i < Math.min(3, after - before); i++) this.events.push({ type: "lost", pos: this.cam.at.clone() });
    // Kept (the new way): those who stayed on the site; Sam, back a year on.
    const kept = nw ? Math.round(94 * clamp01(k(P, B.nOver) * 1.4)) + (P >= B.nRemind[1] ? 1 : 0) : 0;
    if (kept > this.sim.kept && forward && kept - this.sim.kept < 3) this.events.push({ type: "kept", pos: this.cam.at.clone() });
    this.sim.kept = kept;
  }

  /* ---------------------------------------------------------------- */
  /* The new route                                                     */
  /* ---------------------------------------------------------------- */

  private pulseV = [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()];
  private route(P: number, t: number) {
    const sys = this.system;
    const a = B.assemble;
    const show = P >= a[0] ? 1 : 0;
    // THE SCAN sweeps out from the workshop over the first third of the
    // assembly (the stations rise where it passes); then the line draws
    // itself round from the customer's house.
    const scanR = P >= a[0] && P < a[0] + 0.38 ? this.scanRadius(P) : -1;
    const gs = this.town.ground;
    (gs.uScan.value as THREE.Vector4).set(sys.shop.x, sys.shop.z, Math.max(0, scanR), 5 + 0.06 * Math.max(0, scanR));
    gs.uScanK.value = scanR >= 0 ? show * (1 - smooth(range(scanR, 120, 165))) * smooth(range(scanR, 0, 6)) : 0;
    const draw = smoother(range(P, a[0] + 0.3, a[1]));
    const U = sys.nodeU;
    // The customer's comet along the loop: where it is, which way it goes, its warmth (amber = the customer, indigo = the business).
    const pulse = this.pulseV[0].set(0, 0, 1, 1);
    const go = (from: number, to: number, kk: number, warm: number) => pulse.set(lerp(from, to, kk), 1, to >= from ? 1 : -1, warm);
    if (inW(P, B.nFly)) go(0, U[1], smoother(k(P, B.nFly)), 1);
    else if (inW(P, B.nBack)) go(U[1], 0, smoother(k(P, B.nBack)), 0);
    else if (inW(P, B.nBook)) go(U[1], U[2], smoother(k(P, B.nBook)), 1);
    else if (inW(P, [B.nQuote[0], B.nQuoteSent])) go(U[2], U[3], smoother(k(P, [B.nQuote[0], B.nQuote[0] + 0.2])), 0);
    else if (inW(P, B.nInvoice)) go(U[3], U[4], smoother(k(P, B.nInvoice)), 0);
    else if (inW(P, B.nReview)) go(U[4], U[5], smoother(k(P, B.nReview)), 0);
    else if (inW(P, [B.nRemind[0], B.nVan[1]])) go(U[5], 1.0, smoother(k(P, [B.nRemind[0], B.nVan[1]])), 0);
    // After six o'clock the loop carries other customers by itself, on its own time.
    const own = smooth(range(P, 25.9, 26.3)) * (1 - smooth(range(P, 28.6, 28.9)));
    const tt = this.reduced ? 0 : t;
    this.pulseV[1].set(((tt * 0.05 + 0.3) % 1 + 1) % 1, own > 0.01 ? 1 : 0, 1, 1);
    this.pulseV[2].set(((tt * 0.038 + 0.72) % 1 + 1) % 1, own > 0.01 ? 1 : 0, 1, 0);
    // Each station's working windows: lit while it works, a ping as it starts.
    const windows: [number, number][][] = [
      [[18.0, 19.8]],
      [[B.nFly[0], B.nBack[1] + 0.1], [20.86, 21.1], [B.nLater[0], B.nLater[1]]],
      [[B.nBook[0], B.nBook[1] + 0.2], [21.12, 21.5], [25.3, 25.6]],
      [[B.nQuote[0], B.nQuoteSent + 0.12]],
      [[B.nInvoice[0], B.nPaid + 0.1]],
      [[B.nReview[0], B.nReview[1]], [B.nRemind[0], B.nRemind[1]]],
    ];
    const lit = windows.map((ws) => Math.max(0, ...ws.map(([x, y]) => bump(P, x, y, 0.05))));
    const ping = windows.map((ws) => Math.max(0, ...ws.map(([x]) => (P >= x ? 1 - range(P, x, x + 0.1) : 0))));
    sys.update(show, scanR, draw, this.pulseV, lit, ping, t, this.camera, this.reduced);
    // The customer's comet lights the town it passes over.
    if (pulse.y > 0.5 && show > 0) {
      sys.at(pulse.x, this.pulseLight.position);
      this.pulseLight.intensity = 60 * show;
    } else this.pulseLight.intensity = 0;
    // Each station's lock is a click.
    if (P > this.prevP && P - this.prevP < 0.3)
      this.lockTimes().forEach((lt, i) => {
        if (this.prevP < lt && P >= lt) this.events.push({ type: "node", pos: NODES[i].pos });
      });
  }

  /* ---------------------------------------------------------------- */
  /* The picture: exposure, the turn's black, the end's paper           */
  /* ---------------------------------------------------------------- */

  private look(P: number, night: number) {
    const g = this.grade;
    // The room's sheen follows the sky's own light: soft by day, nearly nothing at dusk and night.
    const sky = this.sky.hemi;
    const lum = sky.color.r * 0.2126 + sky.color.g * 0.7152 + sky.color.b * 0.0722;
    this.scene.environmentIntensity = Math.min(0.45, 0.8 * sky.intensity * lum);
    g.exposure = lerp(1.0, 1.9, night);
    g.bloom = 0.6;
    g.threshold = 1.35;
    g.vignette = 0.32;
    // The rewind: the lens strains (more fringe, more grain) while time runs back.
    const rw = inW(P, B.rewind) ? Math.sin(Math.PI * k(P, B.rewind)) : 0;
    g.grain = 0.03 + 0.05 * rw;
    g.aberration = 0.35 + 1.6 * rw;
    g.split = 0;
    g.lift.set(0, 0, 0);
    g.gamma.set(1, 1, 1);
    // Daylight: the mid-tones a little apart (a white model in sun reads flat without it).
    g.contrast = 0.2 * (1 - night);
    // The old way leans cool and a touch flat; the new way warmer and clearer.
    if (!isNew(P)) {
      g.sat = 0.92;
      g.gain.set(0.98, 1.0, 1.04);
    } else {
      g.sat = 1.04;
      g.gain.set(1.03, 1.0, 0.97);
    }
    // The turn: the dark takes the room; then the town at dusk again.
    g.black = smooth(range(P, B.black[0], B.black[0] + 0.1)) * (1 - smooth(range(P, B.black[1] - 0.1, B.black[1])));
    // The end: light out of the brights, then paper.
    g.fill = smooth(range(P, B.end[0], B.end[1])) * 0.9;
    g.flashColor.set(0.965, 0.961, 0.949);
    g.exposure *= 1 + 1.5 * smooth(range(P, B.end[0], B.end[1] - 0.2));
    g.paper = smooth(range(P, B.end[1] - 0.1, B.end[1] + 0.45));
    g.flash = 0;
  }

  /* ---------------------------------------------------------------- */
  /* What the pointer is over                                          */
  /* ---------------------------------------------------------------- */

  private ray = new THREE.Raycaster();
  private pointer(p: { x: number; y: number; has: boolean }) {
    if (!p.has) {
      this.hover = null;
      return;
    }
    this.ray.setFromCamera(new THREE.Vector2(p.x, p.y), this.camera);
    let best: string | null = null;
    let bd = Infinity;
    const hit = new THREE.Vector3();
    for (const part of this.parts) {
      if (this.ray.ray.intersectBox(part.box, hit)) {
        const d = hit.distanceTo(this.camera.position);
        if (d < bd) {
          bd = d;
          best = part.id;
        }
      }
    }
    this.hover = best;
  }

  /**
   * The environment the materials reflect: a soft room (a sky-bright top, a
   * pale horizon, a dark ground, two long light panels), baked once into a
   * PMREM. Its strength follows the time of day (look), so the model has a
   * soft sheen by day and only a trace at night; edges catch the panels.
   */
  private envReady = false;
  private makeEnv() {
    const pm = new THREE.PMREMGenerator(this.gl);
    const room = new THREE.Scene();
    const g = new THREE.SphereGeometry(10, 48, 24);
    const pos = g.getAttribute("position");
    const col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 10;
      const top = new THREE.Color(0.92, 0.95, 1.0);
      const hor = new THREE.Color(0.78, 0.77, 0.75);
      const low = new THREE.Color(0.2, 0.19, 0.18);
      const c = y > 0 ? hor.clone().lerp(top, Math.pow(y, 0.6)) : hor.clone().lerp(low, Math.pow(-y, 0.5));
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    room.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
    for (const [x, z, yaw] of [
      [0, 7, 0],
      [-7, -3, 1.9],
    ] as const) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.6), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 3, 3), side: THREE.DoubleSide }));
      p.position.set(x, 6.5, z);
      p.rotation.set(-0.9, yaw, 0);
      room.add(p);
    }
    const rt = pm.fromScene(room, 0.02);
    this.scene.environment = rt.texture;
    pm.dispose();
    g.dispose();
  }

  render(time: number) {
    if (!this.envReady) {
      this.envReady = true;
      try {
        this.makeEnv();
      } catch {
        /* no environment: the lights carry the picture */
      }
    }
    this.post.render(this.gl, this.scene, this.camera, this.grade, time);
  }
}

/** The phone's status-bar time ("7:38"). */
function uiTime(hours: number) {
  const h24 = ((hours % 24) + 24) % 24;
  let h = Math.floor(h24);
  let m = Math.round((h24 - h) * 60);
  if (m === 60) {
    m = 0;
    h = (h + 1) % 24;
  }
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")}`;
}

export { inFrame, SHOP, stand };
