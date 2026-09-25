/**
 * CRITICALLY DAMPED SPRINGS — inertia on top of the scrubbed film (SPEC §4.7, §6).
 *
 * The choreography is a pure function of S; springs only add weight on fast
 * scroll and pointer moves. We integrate with the EXACT closed-form solution of
 * x'' = −2ωx' − ω²(x − target), so a long frame (tab refocus, GC pause) can
 * never overshoot or explode the way a semi-implicit Euler step can.
 *
 * Plain objects mutated in place — zero allocations per frame.
 */

export type Spring = { x: number; v: number };

export function spring(x = 0): Spring {
  return { x, v: 0 };
}

/** Advance `s` toward `target` by `dt` seconds at angular frequency `omega`. Returns s.x. */
export function springTo(s: Spring, target: number, omega: number, dt: number): number {
  if (dt <= 0) return s.x;
  const d = s.x - target;
  const c = s.v + omega * d;
  const e = Math.exp(-omega * dt);
  s.x = target + (d + c * dt) * e;
  s.v = (s.v - omega * c * dt) * e;
  // Settle exactly — keeps projection-matrix updates from firing forever on denormals.
  if (Math.abs(s.x - target) < 1e-7 && Math.abs(s.v) < 1e-6) {
    s.x = target;
    s.v = 0;
  }
  return s.x;
}

/** Jump to a value with no velocity (first frame, teleports, &freeze=1, reduced motion). */
export function springSnap(s: Spring, x: number): number {
  s.x = x;
  s.v = 0;
  return x;
}

/** Frame-rate independent exponential approach (λ = 1 / time-constant). */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return target + (current - target) * Math.exp(-lambda * dt);
}

/** ω (rad/s) for a critically damped spring that is ~98% settled after `sec`. */
export function omegaForSettle(sec: number): number {
  // (1 + ωt)e^(−ωt) = 0.02 at ωt ≈ 5.83
  return 5.83 / Math.max(1e-3, sec);
}
