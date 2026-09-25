"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { PRIORITY } from "@/lib/sceneState";
import { runBridge } from "@/lib/project";
import { StudioEnv } from "./StudioEnv";
import { CursorLight } from "./CursorLight";
import { Director } from "./Director";
import { CameraRig } from "./CameraRig";
import { Stone } from "./Stone";
import { GroundFx } from "./GroundFx";
import { Mist } from "./Mist";
import { Sculptures } from "./Sculptures";

function Bridge() {
  const { camera, size } = useThree();
  useFrame(() => runBridge(camera as THREE.PerspectiveCamera, size.width, size.height), PRIORITY.bridge);
  return null;
}

/** Everything in the one canvas, in frame order (see PRIORITY). */
export function Scene() {
  return (
    <>
      <Director />
      <CameraRig />
      <StudioEnv />
      <CursorLight />
      <Stone />
      <GroundFx />
      <Mist />
      <Sculptures />
      <Bridge />
    </>
  );
}
