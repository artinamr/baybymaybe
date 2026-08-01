/**
 * The hero's one layout authority.
 *
 * The headline mask (2D canvas) and the crystal (3D scene) have to agree about
 * where the type zone ends and the monument begins — at every viewport. They
 * used to be independently hardcoded (`right = 0.6 * w` vs `position=[1.7,0,0]`),
 * which held at exactly one aspect ratio and collided at others. Everything is
 * derived here instead, from the camera and the viewport, so they cannot drift.
 *
 * Art direction: the shard is a MONUMENT, not a prop. It runs from just under
 * the nav straight off the bottom edge of the frame — the crop is what gives it
 * mass and grounding (this replaced the floating-shard-plus-ellipse-shadow
 * product shot). Its right edge lands on the 4vw page gutter, so it optically
 * aligns with the nav. The type owns everything to its left.
 */

/** Camera is fixed; HeroCanvas imports these so the two can't disagree. */
export const CAMERA = { position: [0, 0, 7] as const, fov: 30 };

/** Visible world height at z=0 — constant, independent of aspect ratio. */
export const WORLD_H =
  2 * CAMERA.position[2] * Math.tan(((CAMERA.fov / 2) * Math.PI) / 180);

/**
 * Projected extents of crystal.glb at scale 1, in world units from the group
 * origin, at the rig's resting rotation (y≈0.5, x≈0.04). Measured by projecting
 * the real mesh through the real camera (scripts/compose.mjs) — the model is
 * 0.868 x 2 x 0.888 but rotation and perspective make the screen box asymmetric.
 */
const EXT = { left: 0.3955, right: 0.4944, top: 1.0279, bottom: 0.9876 };

/** Small screens are one column, so the monument crop would sit straight on top
 *  of the copy. There the shard is shown WHOLE, in its own band between the
 *  headline and the copy block — these are the band's edges, as fractions of
 *  viewport height. */
const SM_BAND = { top: 0.33, bottom: 0.63 };

/** Nav occupies the top ~86px; the shard's tip must clear it. */
const NAV_H = 86;

export type HeroLayout = {
  /** Crystal group transform. */
  scale: number;
  posX: number;
  posY: number;
  /** Headline mask geometry, in CSS px. */
  fontSize: number;
  padX: number;
  /** Right edge that DIGITAL / POTENTIAL are aligned to. */
  right: number;
  /** Baseline of the first line. */
  baseline: number;
  lineHeight: number;
  /** Normalised x of the shard's centre, for the backdrop's contact shadow. */
  shadowX: number;
  isSmall: boolean;
};

/** Advance widths of the four headline words, per px of font-size (Space
 *  Grotesk 700 at -0.02em) — measured from the live page, not guessed. */
export const WORD = {
  MAXIMISE: 4.5699,
  YOUR: 2.4959,
  DIGITAL: 3.4159,
  POTENTIAL: 4.9119,
  cap: 0.71925,
};

/** Sum of the two words that share line 2 — the constraint that caps type size. */
const LINE2 = WORD.YOUR + WORD.DIGITAL;

export function heroLayout(w: number, h: number): HeroLayout {
  const pxPerWorld = h / WORLD_H;
  const halfW = ((w / h) * WORLD_H) / 2;
  const isSmall = w < 640;

  // --- the monument -------------------------------------------------------
  // Scale is expressed against viewport HEIGHT (which is aspect-independent in
  // world units), so the shard frames identically at every width.
  const scale = isSmall
    ? ((SM_BAND.bottom - SM_BAND.top) * WORLD_H) / (EXT.top + EXT.bottom)
    : 2.15;

  // Desktop: tip just below the nav, base running off the bottom of the frame —
  // the crop is what gives it mass. Small: the whole shard inside its band.
  const topPx = isSmall ? SM_BAND.top * h : Math.max(0.13 * h, NAV_H + 26);
  const posY = WORLD_H * (0.5 - topPx / h) - EXT.top * scale;

  // Desktop: right edge on the 4vw gutter → optically flush with the nav's
  // right edge. Small: the shard is centred in the single column.
  const gutter = 0.04 * WORLD_H * (w / h);
  const posX = isSmall
    ? -((EXT.right - EXT.left) / 2) * scale
    : halfW - gutter - EXT.right * scale;

  const leftPx = w / 2 + (posX - EXT.left * scale) * pxPerWorld;
  const centerPx = w / 2 + posX * pxPerWorld;

  // --- the type -----------------------------------------------------------
  const padX = 0.05 * w;
  const right = isSmall ? w - padX : leftPx - 0.045 * w;
  const zone = right - padX;

  // Cap by width so YOUR and DIGITAL always keep an airy gap on line 2, and by
  // viewport so the type never outgrows the frame on very wide screens.
  const fontSize = isSmall
    ? 0.13 * w
    : Math.min(0.088 * w, zone / (LINE2 + 0.64));

  const lineHeight = 0.84 * fontSize;
  const blockH = lineHeight * 2 + WORD.cap * fontSize;
  // Optical centre sits above the geometric one — the type reads as anchored
  // high against the copy block in the footer, not floating mid-frame.
  // On small screens the type has to clear the shard's band above it.
  const blockTop = (isSmall ? 0.21 : 0.4) * h - blockH / 2;
  const baseline = Math.round(blockTop + WORD.cap * fontSize);

  return {
    scale,
    posX,
    posY,
    fontSize,
    padX,
    right,
    baseline,
    lineHeight,
    shadowX: centerPx / w,
    isSmall,
  };
}
