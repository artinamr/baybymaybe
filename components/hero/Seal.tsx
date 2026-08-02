"use client";

/**
 * A rotating type seal — the affordance for story mode, sitting against the
 * rock's lower edge so the two read as one object.
 *
 * A circular badge is a piece of vocabulary premium studios use constantly: it
 * carries perpetual motion and craft in a very small footprint, without adding
 * another block of copy to the page.
 */
export function Seal({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Enter the core"
      className="seal group pointer-events-auto relative grid h-[8.5rem] w-[8.5rem] place-items-center rounded-full"
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-full border border-ink/12 transition-colors duration-500 group-hover:border-accent/45"
      />
      <svg viewBox="0 0 100 100" className="seal-spin absolute inset-0 h-full w-full">
        <defs>
          <path
            id="sealArc"
            d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0"
            fill="none"
          />
        </defs>
        <text className="fill-ink/55 text-[7.4px] font-medium uppercase tracking-[0.34em]">
          <textPath href="#sealArc" startOffset="0">
            Enter the core · Nerodyn · Obsidian ·
          </textPath>
        </text>
      </svg>
      <span
        aria-hidden
        className="relative grid h-11 w-11 place-items-center rounded-full bg-ink text-paper transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M5 12h13M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  );
}
