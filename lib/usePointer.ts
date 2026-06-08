"use client";

import { useEffect } from "react";

/**
 * Shared, render-free pointer store. The DOM writes the target; the 3D loop
 * reads `x`/`y` (already smoothed toward the target in useFrame). Normalized to
 * roughly [-1, 1] with origin at viewport center.
 */
export const pointer = {
  tx: 0,
  ty: 0,
  x: 0,
  y: 0,
};

/** Attach a single global pointer listener. Call once near the root. */
export function usePointerTracking() {
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
}
