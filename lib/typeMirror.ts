import * as THREE from "three";

/**
 * THE FINALE'S REFLECTED WORD. "Let's talk." stands on the salt flat's
 * horizon (its baseline is keyed to --horizon), so the flat's mirror must
 * reflect it. The word is DOM (crisp, selectable, set behind the canvas); its
 * reflection is drawn INSIDE the canvas by the flat's shader, so the colossus's
 * own reflection passes in front of it exactly as it should.
 *
 * This keeps a mask of the word: drawn once (and on resize / font load) into a
 * canvas with its baseline at a fixed row, at the word's real left edge and
 * size. The shader mirrors it about the live horizon line.
 */
export const typeMirror = {
  texture: null as THREE.CanvasTexture | null,
  /** Mask size in CSS px, and the row its baseline sits on. */
  w: 1,
  h: 1,
  base: 1,
  ready: false,
  key: "",
};

let canvas: HTMLCanvasElement | null = null;

/** (Re)draw the mask if the word's size or place has changed. Cheap to call; no-op when current. */
export function syncTypeMirror(): void {
  if (typeof document === "undefined") return;
  const el = document.querySelector<HTMLElement>(".mark-display .rv");
  if (!el) return;
  const cs = getComputedStyle(el);
  const size = parseFloat(cs.fontSize) || 0;
  if (!size) return;
  const r = el.getBoundingClientRect();
  const W = Math.max(1, Math.round(window.innerWidth));
  const text = (el.textContent || "").trim();
  const key = `${W}|${size.toFixed(1)}|${r.left.toFixed(1)}|${cs.fontFamily}|${cs.letterSpacing}|${text}|${document.fonts?.status}`;
  if (key === typeMirror.key && typeMirror.texture) return;
  typeMirror.key = key;
  const H = Math.ceil(size * 1.1);
  const base = Math.ceil(size * 1.02);
  // A fresh canvas + texture on every redraw: reusing a CanvasTexture across a
  // size change throws (CLAUDE.md gotcha #5).
  canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, W, H);
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#fff";
  ctx.fillText(text, r.left, base);
  typeMirror.texture?.dispose();
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.NoColorSpace;
  t.minFilter = THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  typeMirror.texture = t;
  typeMirror.w = W;
  typeMirror.h = H;
  typeMirror.base = base;
  typeMirror.ready = true;
}
