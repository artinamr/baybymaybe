import type { Photo as PhotoData } from "@/content/images";

/**
 * A photograph from content/images.ts: both sizes offered (the browser takes
 * the one the screen needs), its own width and height (no layout shift) and
 * its alt text. `sizes` says how wide it is drawn. `eager` for a picture that
 * may show in the first screen (a banner under the title): it loads at once
 * but at normal priority, so it never holds up the stylesheet and the title,
 * which are what the reader (and LCP) waits for. `priority` (high) only for a
 * picture that is itself the largest thing in the first screen.
 */
export function Photo({
  p,
  sizes,
  priority = false,
  eager = false,
  decorative = false,
  className,
}: {
  p: PhotoData;
  sizes: string;
  priority?: boolean;
  eager?: boolean;
  /** Next to a title that already says it all (cards): empty alt. */
  decorative?: boolean;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a static export: no image optimiser to gain
    <img
      src={p.src}
      srcSet={p.srcSet}
      sizes={sizes}
      width={p.width}
      height={p.height}
      alt={decorative ? "" : p.alt}
      loading={priority || eager ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={className}
    />
  );
}

/** The width of a banner across the page: the content column (`--spw`, at most 1240 px; ~92 % below that). */
export const BANNER_SIZES = "(min-width: 1360px) 1240px, 92vw";
