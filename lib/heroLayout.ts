/**
 * The hero's one layout authority.
 *
 * The headline (DOM) and the crystal (3D scene) have to agree about where the
 * type zone ends and the object begins — at every viewport. They used to be
 * independently hardcoded, which held at exactly one aspect ratio and collided
 * at others. Everything is derived here instead, from the camera and the
 * viewport, so they cannot drift.
 *
 * Art direction (2026-08-02): CLEAN. Generous air, very little chrome, the
 * object sitting back in its own space rather than looming. Premium comes from
 * placement and type, not from added elements.
 */

/** Camera is fixed; HeroCanvas imports these so the two can't disagree. */
export const CAMERA = { position: [0, 0, 7] as const, fov: 30 };

/** Visible world height at z=0 — constant, independent of aspect ratio. */
export const WORLD_H =
  2 * CAMERA.position[2] * Math.tan(((CAMERA.fov / 2) * Math.PI) / 180);

/**
 * Projected extents of heart.glb at scale 1, in world units from the group
 * origin, at the rig's resting rotation (y≈0.5, x≈0.04). Measured by projecting
 * the real mesh through the real camera — re-measure if the model changes.
 */
const EXT = { left: 0.5215, right: 0.4813, top: 1.0011, bottom: 0.9874 };

/** The object is shown WHOLE and LARGE — it occupies this fraction of the
 *  viewport height, tip below the nav, right edge on the page gutter so it
 *  lines up with the nav's last link. */
const OBJ = { heightFrac: 0.84, topFrac: 0.13, rightFrac: 0.96 };

/** Page gutter, and the channel between the type and the object. */
const PAD_FRAC = 0.055;
const GUTTER_FRAC = 0.05;

/** Where the headline block starts and the latest it may end. */
const TYPE_TOP_FRAC = 0.265;
const TYPE_BOTTOM_FRAC = 0.66;

/**
 * The headline, three left-aligned lines. `hollow` words are drawn as an
 * outline only; `solid` words are near-black ink. Rendered as real DOM text —
 * it used to be a canvas mask fed to a liquid shader, which was softer than
 * live type and far more machinery than an outline needs.
 */
export const LINES = [
  { text: "Maximise", style: "solid" },
  { text: "Your Digital", style: "hollow" },
  { text: "Potential", style: "solid" },
] as const;

/** Advance widths per px of font-size, Space Grotesk 700 uppercase at -0.02em —
 *  measured from the live page, not guessed. */
export const WORD = {
  MAXIMISE: 4.5699,
  YOUR: 2.4959,
  DIGITAL: 3.4159,
  POTENTIAL: 4.9119,
  SPACE: 0.26,
  cap: 0.71925,
};

/** "YOUR DIGITAL" is the widest line, so it alone caps the type size. */
const WIDEST = WORD.YOUR + WORD.SPACE + WORD.DIGITAL;

/** Leading, as a multiple of font-size. */
export const LEADING = 0.86;

export type HeroLayout = {
  /** Crystal group transform. */
  scale: number;
  posX: number;
  posY: number;
  /** Headline geometry, in CSS px. */
  fontSize: number;
  padX: number;
  typeTop: number;
  /** Right edge of the type zone — where the object's channel begins. */
  right: number;
  /** Normalised position of the shard's soft contact shadow. */
  shadowX: number;
  shadowY: number;
  isSmall: boolean;
};

export function heroLayout(w: number, h: number): HeroLayout {
  const pxPerWorld = h / WORLD_H;
  const isSmall = w < 900;

  // --- the object ---------------------------------------------------------
  // Sized against viewport HEIGHT (aspect-independent in world units), so it
  // frames identically at every width.
  const scale = (OBJ.heightFrac * WORLD_H) / (EXT.top + EXT.bottom);
  const posY = WORLD_H * (0.5 - OBJ.topFrac) - EXT.top * scale;

  // Right edge set well inside the frame — the air around it is what makes it
  // read as placed rather than pushed against the edge.
  const rightEdgeWorld = (OBJ.rightFrac - 0.5) * (w / pxPerWorld);
  const posX = rightEdgeWorld - EXT.right * scale;

  const leftPx = w / 2 + (posX - EXT.left * scale) * pxPerWorld;
  const centerPx = w / 2 + posX * pxPerWorld;
  const basePx = h / 2 - (posY - EXT.bottom * scale) * pxPerWorld;

  // --- the type -----------------------------------------------------------
  const padX = PAD_FRAC * w;
  const right = leftPx - GUTTER_FRAC * w;
  const zone = right - padX;
  const typeTop = TYPE_TOP_FRAC * h;

  // Bound by the zone's width, and by the height the block may occupy.
  const blockH = TYPE_BOTTOM_FRAC * h - typeTop;
  const fontSize = Math.min(
    zone / (WIDEST * 1.03),
    blockH / (2 * LEADING + WORD.cap)
  );

  return {
    scale,
    posX,
    posY,
    fontSize,
    padX,
    typeTop,
    right,
    shadowX: centerPx / w,
    shadowY: basePx / h,
    isSmall,
  };
}
