"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { PRIORITY, sceneState } from "@/lib/sceneState";
import { pointer } from "@/lib/stores";
import { damp } from "@/lib/springs";

let libReady = false;

/**
 * THE CURSOR IS THE LIGHT (SPEC §4.5, §9.4). One tall, thin area light stands in
 * front of the stone and slides with the pointer, so a single bright line
 * travels across every facet as you move — the page answers the hand without a
 * custom cursor. With no pointer (touch, idle) it sweeps on its own.
 */
export function CursorLight() {
  const light = useMemo(() => {
    if (!libReady) {
      RectAreaLightUniformsLib.init();
      libReady = true;
    }
    return new THREE.RectAreaLight("#ffffff", 8, 0.14, 7);
  }, []);
  const x = useMemo(() => ({ v: 0 }), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const fwd = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    const t = sceneState.time;
    const goal = pointer.has ? pointer.nx * 4.5 : 3.5 * Math.sin((2 * Math.PI * t) / 18);
    x.v = damp(x.v, goal, 3.5, Math.min(dt, 0.05));

    // The camera's azimuth frame, so "in front" follows the orbit.
    const az = sceneState.cam.az;
    right.set(Math.cos(az), 0, -Math.sin(az));
    fwd.set(Math.sin(az), 0, Math.cos(az));
    const home = sceneState.stone.home;
    light.position.copy(home).addScaledVector(right, x.v).addScaledVector(fwd, 6.5);
    light.position.y = home.y + 0.8;
    target.set(home.x, home.y - 0.46, home.z);
    light.lookAt(target);
    light.intensity = sceneState.u.cursorLight;
    light.visible = sceneState.u.cursorLight > 0.01;
  }, PRIORITY.scene);

  return <primitive object={light} />;
}
