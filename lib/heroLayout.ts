/**
 * The hero's one layout authority.
 *
 * The DOM (headline, seal, copy) and the 3D rock have to agree about where each
 * lives at every viewport, so everything is derived here from the camera and the
 * viewport rather than hardcoded in two places.
 *
 * Art direction (2026-08-02): the rock is a MONUMENT — very large, cropped by
 * the bottom of the frame, and the headline runs BEHIND it (the canvas is
 * transparent and the type sits under it in z, so the rock genuinely occludes
 * the letters). That layering is what stops the page reading as a headline in
 * one box and a prop in another.
 */

/** Camera is fixed; HeroCanvas imports these so the two can't disagree. */
export const CAMERA = { position: [0, 0, 7] as const, fov: 30 };

/** Visible world height at z=0 — constant, independent of aspect ratio. */
export const WORLD_H =
  2 * CAMERA.position[2] * Math.tan(((CAMERA.fov / 2) * Math.PI) / 180);

/**
 * Projected extents of heart.glb's shell at scale 1, in world units from the
 * group origin, at the rig's resting rotation (y≈0.5, x≈0.04). Measured by
 * projecting the real mesh through the real camera — re-measure if the model
 * changes.
 */
const EXT = { left: 0.5215, right: 0.4813, top: 1.0011, bottom: 0.9874 };

/**
 * The rock fills the frame vertically and runs off the bottom edge. The crop is
 * deliberate: a fully-contained object reads as a product shot, a cropped one
 * reads as mass the frame cannot hold.
 */
const OBJ = { heightFrac: 1.02, topFrac: 0.12, rightFrac: 0.935 };

/** Page gutter. */
const PAD_FRAC = 0.055;

export type HeroLayout = {
  scale: number;
  posX: number;
  posY: number;
  /** Page gutter in CSS px. */
  padX: number;
  /** Left edge of the rock in CSS px — the headline runs under it from here. */
  rockLeft: number;
  /** Normalised centre of the rock, for the CSS field glow and its shadow. */
  rockX: number;
  rockBaseY: number;
};

export function heroLayout(w: number, h: number): HeroLayout {
  const pxPerWorld = h / WORLD_H;

  const scale = (OBJ.heightFrac * WORLD_H) / (EXT.top + EXT.bottom);
  const posY = WORLD_H * (0.5 - OBJ.topFrac) - EXT.top * scale;

  const rightEdgeWorld = (OBJ.rightFrac - 0.5) * (w / pxPerWorld);
  const posX = rightEdgeWorld - EXT.right * scale;

  const rockLeft = w / 2 + (posX - EXT.left * scale) * pxPerWorld;
  const centerPx = w / 2 + posX * pxPerWorld;
  const basePx = h / 2 - (posY - EXT.bottom * scale) * pxPerWorld;

  return {
    scale,
    posX,
    posY,
    padX: PAD_FRAC * w,
    rockLeft,
    rockX: centerPx / w,
    rockBaseY: basePx / h,
  };
}
