/**
 * A work cover's srcset: its 1200 px copy (made by tools/qa/coverprev.py,
 * beside the cover) and the full 2400. A card is at most ~800 px wide, so
 * most screens take the copy at about a third of the bytes.
 */
export const coverSrcSet = (cover: string) => `${cover.replace(/\.webp$/, "-1200.webp")} 1200w, ${cover} 2400w`;

/** The work cover's file name without its extension (the key of COVER_PREVIEW). */
export const coverName = (cover: string) => (cover.split("/").pop() ?? "").replace(/\.webp$/, "");
