"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { sceneState, PRIORITY } from "@/lib/sceneState";
import { pointer, ui } from "@/lib/stores";
import { range, easeInOutSine, lerp } from "@/lib/ease";
import { layout } from "@/lib/layout";

const smooth = (s: number, a: number, b: number) => easeInOutSine(range(s, a, b));

/** Solid product sculptures, framed in screen space so copy always has room.
 * All motion runs in the existing render loop; no React updates per frame.
 */
export function Sculptures() {
  const { camera } = useThree();
  const root = useRef<THREE.Group>(null);
  const stack = useRef<THREE.Group>(null);
  const orbit = useRef<THREE.Group>(null);
  const portal = useRef<THREE.Group>(null);
  const slabs = useRef<(THREE.Group | null)[]>([]);
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const motion = useRef({ x: 0, y: 0 });
  const vector = useMemo(() => new THREE.Vector3(), []);
  const forward = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!root.current || !stack.current || !orbit.current || !portal.current) return;
    const { S, dt } = sceneState;
    const reduced = document.documentElement.hasAttribute("data-reduced");
    const time = reduced ? 0 : sceneState.time;
    const mobile = layout.current.mode === "mobile";
    const enter = smooth(S, 2.05, 2.85);
    const intelligence = smooth(S, 4.65, 5.65);
    const work = smooth(S, 7.25, 8.15);
    const leave = smooth(S, 10.05, 10.5);
    root.current.visible = S > 2.05 && S < 10.5;
    if (!root.current.visible) return;

    const k = 1 - Math.exp(-dt * 3.5);
    motion.current.x = lerp(motion.current.x, reduced ? 0 : pointer.nx * 0.06, k);
    motion.current.y = lerp(motion.current.y, reduced ? 0 : pointer.ny * 0.04, k);
    const x = mobile ? 0.5 : lerp(lerp(0.72, 0.29, intelligence), 0.75, work);
    const y = mobile ? 0.29 : 0.51;
    vector.set(x * 2 - 1, 1 - y * 2, 0.5).unproject(camera).sub(camera.position).normalize();
    camera.getWorldDirection(forward);
    root.current.position.copy(camera.position).addScaledVector(vector, 8 / vector.dot(forward));
    root.current.quaternion.copy(camera.quaternion);
    const viewHeight = 16 * Math.tan(THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov / 2));
    // Width-aware scaling also keeps landscape tablets away from the text column.
    const fraction = mobile ? 0.28 : Math.min(0.52, layout.current.vw / layout.current.vh * 0.28);
    root.current.scale.setScalar(viewHeight * fraction / 3.7 * enter * (1 - leave));

    const a = Math.max(0.001, 1 - intelligence);
    stack.current.visible = intelligence < 0.999;
    stack.current.scale.setScalar(a);
    stack.current.rotation.set(0.28 + motion.current.y, -0.48 + (S - 3) * 0.16 + motion.current.x, -0.1);
    slabs.current.forEach((slab, i) => {
      if (!slab) return;
      const focus = ui.focusTier < 0 ? -1 : ui.focusTier;
      const target = (i - 1.5) * (0.62 + intelligence * 0.35);
      slab.position.y = target + Math.sin(time * 0.48 + i * 0.5) * 0.035;
      slab.position.x = lerp(slab.position.x, focus === i ? -0.16 : 0, k);
      slab.rotation.y = Math.sin(time * 0.2 + i * 0.22) * 0.025;
    });

    orbit.current.visible = intelligence > 0.001 && work < 0.999;
    orbit.current.scale.setScalar(Math.max(0.001, intelligence * (1 - work)));
    orbit.current.rotation.set(0.2 + motion.current.y, -0.3 + motion.current.x, -0.2);
    rings.current.forEach((ring, i) => {
      if (!ring) return;
      ring.rotation.set(0.5 + i * 0.85 + time * 0.07, i * 0.9 + time * 0.09, i * 0.6 + time * 0.035);
    });

    portal.current.visible = work > 0.001;
    portal.current.scale.setScalar(Math.max(0.001, work));
    portal.current.rotation.set(0.13 + motion.current.y, -0.48 + Math.sin(time * 0.16) * 0.12 + motion.current.x, -0.12);
    portal.current.position.y = Math.sin(time * 0.45) * 0.07;
  }, PRIORITY.scene);

  return (
    <group ref={root}>
      <group ref={stack}>
        {[0, 1, 2, 3].map((i) => (
          <group key={i} ref={(el) => { slabs.current[i] = el; }}>
            <RoundedBox args={[2.8, 0.24, 1.85]} radius={0.1} smoothness={4}>
              <meshPhysicalMaterial color={i === 3 ? "#c2b8ee" : "#191823"} metalness={0.72} roughness={0.23} clearcoat={1} clearcoatRoughness={0.15} />
            </RoundedBox>
            <RoundedBox args={[2.66, 0.026, 1.71]} radius={0.012} smoothness={2} position={[0, -0.126, 0]}>
              <meshStandardMaterial color="#8063ff" emissive="#7040ef" emissiveIntensity={0.65} metalness={0.5} roughness={0.24} />
            </RoundedBox>
          </group>
        ))}
      </group>
      <group ref={orbit}>
        <mesh>
          <sphereGeometry args={[0.61, 48, 32]} />
          <meshPhysicalMaterial color="#242031" metalness={0.9} roughness={0.14} clearcoat={1} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} ref={(el) => { rings.current[i] = el; }}>
            <torusGeometry args={[1.12 + i * 0.25, 0.09, 16, 96]} />
            <meshPhysicalMaterial color={i === 1 ? "#7652e8" : "#b9b5ca"} metalness={0.88} roughness={0.2} clearcoat={1} />
          </mesh>
        ))}
      </group>
      <group ref={portal}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[0, 0, -i * 0.34]} rotation={[0, 0, i * 0.075]}>
            <torusGeometry args={[1.22 - i * 0.1, 0.17, 16, 96]} />
            <meshPhysicalMaterial color={i === 4 ? "#7652e8" : "#393542"} metalness={0.85} roughness={0.2} clearcoat={1} />
          </mesh>
        ))}
        <mesh position={[0, 0, -1.8]}>
          <sphereGeometry args={[0.46, 32, 24]} />
          <meshPhysicalMaterial color="#9674ed" metalness={0.7} roughness={0.2} clearcoat={1} />
        </mesh>
      </group>
    </group>
  );
}
