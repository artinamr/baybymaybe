"use client";

import gsap from "gsap";

/**
 * Render-free animation state shared between the 3D scene and the DOM.
 * - `reveal`  0 → 1 : the assembly on load (driven by the canvas clock).
 * - `hover`   0 → 1 : pointer over the artifact (target in `hoverTarget`).
 * - `awaken`  0 → 1 : the story-mode crescendo (veins, shaft, camera push).
 * - `camPush` 0 → 1 : camera dolly toward the artifact during awaken.
 */
export const heroAnim = {
  reveal: 0,
  hover: 0,
  hoverTarget: 0,
  awaken: 0,
  camPush: 0,
};

let tween: gsap.core.Tween | null = null;

/** Awaken the artifact and push the camera in (returns the tween). */
export function startAwaken(onComplete?: () => void) {
  tween?.kill();
  tween = gsap.to(heroAnim, {
    awaken: 1,
    camPush: 1,
    duration: 1.9,
    ease: "power2.inOut",
    onComplete,
  });
  return tween;
}

/** Settle the artifact back to sleep (story mode closing). */
export function settleAwaken() {
  tween?.kill();
  tween = gsap.to(heroAnim, {
    awaken: 0,
    camPush: 0,
    duration: 1.4,
    ease: "power2.out",
  });
  return tween;
}
