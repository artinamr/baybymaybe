"use client";

import { heroLayout, LINES } from "./heroLayout";

/**
 * Draws the headline into an offscreen canvas (white on transparent) to use as
 * a GPU mask. The shader then fills these exact letterforms with flowing liquid.
 * Layout mirrors the editorial DOM intent: MAXIMISE (left) / YOUR—DIGITAL
 * (justified) / POTENTIAL (right), anchored high in the left zone.
 *
 * Geometry comes from `heroLayout` so the type zone always ends where the
 * monument begins — see lib/heroLayout.ts.
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

  const { fontSize: fs, padX, right, baseline, lineHeight: lh } = heroLayout(w, h);

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

  LINES.forEach((line, i) => {
    ctx.textAlign = line.align;
    ctx.fillStyle = line.fill === "liquid" ? LIQUID : SOLID;
    ctx.fillText(line.word, line.align === "left" ? padX : right, baseline + i * lh);
  });
}
