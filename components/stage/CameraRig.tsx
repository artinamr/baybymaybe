"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { PRIORITY, sceneState } from "@/lib/sceneState";
import { spring, springSnap, springTo, type Spring } from "@/lib/springs";

/** Low on purpose: a heavy, floating camera that glides into every framing. */
const OMEGA = 3.2;

/**
 * Applies sceneState.cam to the camera through critically damped springs
 * (inertia on fast scroll, never overshoot).
 *
 * The principal point is applied with setViewOffset, not by aiming off-centre:
 * the pivot stays on the optical axis (no keystone on the stone) and the whole
 * image slides so the pivot lands at (ppx, ppy). A positive x offset shows the
 * part of the full image to the RIGHT, i.e. moves content LEFT — so the pivot
 * lands at x = 0.5W − offX, giving offX = (0.5 − ppx)·W (same for y, both down).
 */
export function CameraRig() {
  const { camera, size } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const sp = useMemo(() => Array.from({ length: 9 }, () => spring(0)), []);
  const started = useRef(false);
  const target = useMemo(() => new THREE.Vector3(), []);
  const last = useRef({ fov: 0, ppx: -1, ppy: -1, w: 0, h: 0 });

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    const c = sceneState.cam;
    const goal = [c.pos.x, c.pos.y, c.pos.z, c.target.x, c.target.y, c.target.z, c.fov, c.ppx, c.ppy];
    // A hard cut (under the flood) jumps; otherwise the camera glides.
    const snap = !started.current || sceneState.frozen || c.cut;
    started.current = true;
    const out = sp.map((s: Spring, i) => (snap ? springSnap(s, goal[i]) : springTo(s, goal[i], OMEGA, dt)));

    cam.position.set(out[0], out[1], out[2]);
    target.set(out[3], out[4], out[5]);
    // The landing's jolt: a few frames of decaying shake, scaled to the framing.
    if (c.shake > 0.002) {
      const t = performance.now() / 1000;
      const amp = c.shake * 0.012 * cam.position.distanceTo(target);
      cam.position.x += amp * Math.sin(t * 71.3);
      cam.position.y += amp * Math.sin(t * 57.1 + 1.3);
      cam.position.z += amp * Math.sin(t * 63.7 + 2.1);
    }
    cam.up.set(0, 1, 0);
    cam.lookAt(target);

    const fov = out[6];
    const ppx = out[7];
    const ppy = out[8];
    // Near/far follow the framing: close inside the colossus, the flat's horizon far off.
    const near = THREE.MathUtils.clamp(cam.position.distanceTo(target) * 0.012, 0.05, 1.2);
    const L = last.current;
    if (Math.abs(near - cam.near) > 0.02 * near) {
      cam.near = near;
      cam.far = 2400;
      L.fov = -1;
    }
    if (Math.abs(fov - L.fov) > 1e-4 || Math.abs(ppx - L.ppx) > 1e-5 || Math.abs(ppy - L.ppy) > 1e-5 || L.w !== size.width || L.h !== size.height) {
      L.fov = fov;
      L.ppx = ppx;
      L.ppy = ppy;
      L.w = size.width;
      L.h = size.height;
      cam.fov = fov;
      cam.aspect = size.width / size.height;
      cam.setViewOffset(size.width, size.height, (0.5 - ppx) * size.width, (0.5 - ppy) * size.height, size.width, size.height);
      cam.updateProjectionMatrix();
    }
  }, PRIORITY.camera);

  return null;
}
