"use client";

import gsap from "gsap";

/**
 * Render-free animation state shared between the 3D scene and the UI.
 * - `reveal` 0 → 1 : the assembly on load (driven by the canvas clock in HeroCanvas).
 * - `dive`   0 → 1 : the "Hear the story" opening beat (camera push + FX ramp).
 */
export const heroAnim = {
  reveal: 0,
  dive: 0,
};

/** Kick off the dive into the story (returns the tween for chaining/UI sync). */
export function startDive() {
  return gsap.to(heroAnim, {
    dive: 1,
    duration: 2.2,
    ease: "power3.inOut",
  });
}
