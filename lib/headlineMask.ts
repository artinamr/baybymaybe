"use client";

/**
 * Draws the headline into an offscreen canvas (white on transparent) to use as
 * a GPU mask. The shader then fills these exact letterforms with flowing liquid.
 * Layout mirrors the editorial DOM intent: MAXIMISE (left) / YOUR—DIGITAL
 * (justified) / POTENTIAL (right), vertically centred.
 */
export function drawHeadlineMask(canvas: HTMLCanvasElement, dpr: number) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  // Smaller now, anchored in the left ~60% so the 3D object owns the right zone.
  const sm = w < 640;
  const fs = (sm ? 0.13 : 0.08) * w;
  const padX = 0.05 * w;
  const lh = 0.84 * fs;
  const right = sm ? w - padX : 0.6 * w;

  // Channel-coded mask: RED = liquid-filled words, GREEN = solid-black words.
  // Alpha carries the anti-aliased coverage so edges stay crisp.
  const LIQUID = "rgb(255,0,0)";
  const SOLID = "rgb(0,255,0)";

  ctx.textBaseline = "alphabetic";
  ctx.font = `700 ${fs}px "Space Grotesk", system-ui, sans-serif`;
  // -0.02em tracking (supported in Chromium; harmlessly ignored elsewhere).
  try {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
      `${(-0.02 * fs).toFixed(2)}px`;
  } catch {}

  const cap = ctx.measureText("MAXIMISE").actualBoundingBoxAscent || fs * 0.7;
  const totalVisual = lh * 2 + cap;
  const y1 = Math.round((h - totalVisual) / 2 + cap);
  const y2 = y1 + lh;
  const y3 = y2 + lh;

  ctx.textAlign = "left";
  ctx.fillStyle = LIQUID;
  ctx.fillText("MAXIMISE", padX, y1);
  ctx.fillStyle = SOLID;
  ctx.fillText("YOUR", padX, y2);
  ctx.textAlign = "right";
  ctx.fillStyle = SOLID;
  ctx.fillText("DIGITAL", right, y2);
  ctx.fillStyle = LIQUID;
  ctx.fillText("POTENTIAL", right, y3);
}
