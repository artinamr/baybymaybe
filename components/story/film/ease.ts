/** Small curves the film is timed with. */

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
/** 0 at a, 1 at b, clamped. */
export const range = (x: number, a: number, b: number) => clamp01((x - a) / (b - a));
export const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
export const smoother = (x: number) => {
  const t = clamp01(x);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
/** Ease in and out with an exponent (1 = smoothstep-like). */
export const ease = (x: number, p = 2) => {
  const t = clamp01(x);
  return t < 0.5 ? Math.pow(2 * t, p) / 2 : 1 - Math.pow(2 - 2 * t, p) / 2;
};
export const expoOut = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp01(x)));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** A bump: 0 → 1 → 0 over [a, b], flat-topped between the fades. */
export const bump = (x: number, a: number, b: number, fade = 0.15) => range(x, a, a + fade) * (1 - range(x, b - fade, b));

/** Critically damped spring toward a target (value and velocity in an object). */
export function spring(s: { x: number; v: number }, target: number, w: number, dt: number) {
  const d = s.x - target;
  const c = s.v + w * d;
  const e = Math.exp(-w * dt);
  s.x = target + (d + c * dt) * e;
  s.v = (s.v - w * c * dt) * e;
}
