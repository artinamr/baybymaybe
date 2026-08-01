"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { heroLayout } from "@/lib/heroLayout";
import { usePointerTracking } from "@/lib/usePointer";
import { useSmoothScroll } from "@/lib/useSmoothScroll";
import { HearTheStory } from "./HearTheStory";

const HeroCanvas = dynamic(() => import("./HeroCanvas"), { ssr: false });

const NAV_LINKS = ["Work", "Our Story", "Labs", "Insights", "Connect"];

/** The capability index. Sits in the notch the headline cascade leaves open —
 *  the composition's one dead pocket — and carries the eyebrow's old job. */
const INDEX = [
  { n: "01", label: "Infrastructure" },
  { n: "02", label: "Automation" },
  { n: "03", label: "Intelligence" },
];

/** Base rail. Slow enough to read as a held breath, not a news crawl. */
const RAIL = [
  "Digital Infrastructure",
  "AI Automation",
  "Internal Systems",
  "Applied Intelligence",
  "Platform Engineering",
];

// next/image does NOT prepend basePath for us (Next 16 docs) — do it manually,
// same as the GLB URL, so assets resolve on the GitHub Pages subpath.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function Hero() {
  const [diving, setDiving] = useState(false);

  usePointerTracking();
  useSmoothScroll();

  // Publish the type zone's edges to CSS, from the same authority the headline
  // mask and the crystal use. Every piece of DOM chrome then lines up with the
  // headline and stops where the monument begins, at any viewport.
  useEffect(() => {
    const apply = () => {
      const L = heroLayout(window.innerWidth, window.innerHeight);
      const s = document.documentElement.style;
      s.setProperty("--hero-right", `${L.right}px`);
      s.setProperty("--hero-inset-r", `${window.innerWidth - L.right}px`);
      s.setProperty("--hero-pad", `${L.padX}px`);
      s.setProperty("--hero-l2", `${L.line2Top}px`);
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  const fade = diving ? "opacity-0" : "opacity-100";

  return (
    <section className="relative min-h-screen w-full overflow-hidden">
      {/* Film grain over everything */}
      <div className="grain" aria-hidden />

      {/* Super effect: the headline as flowing liquid, and the monument. */}
      <div
        className={`pointer-events-none fixed inset-0 z-[1] transition-opacity duration-700 ${fade}`}
      >
        <HeroCanvas />
      </div>

      {/* Hairline column grid. Reads as a designed room rather than an empty
          page, and vanishes over the shard where ink-on-black is invisible. */}
      <div
        aria-hidden
        className={`reveal-fade pointer-events-none fixed inset-y-0 left-0 z-[2] hidden lg:block transition-opacity duration-700 ${fade}`}
        style={{
          width: "calc(var(--hero-right, 60%) + 1px)",
          // Barely there on purpose: enough to feel like a room, not enough to
          // read as lines drawn over the headline.
          backgroundImage:
            "linear-gradient(to right, rgba(10,11,16,0.028) 1px, transparent 1px)",
          backgroundSize: "calc((var(--hero-right, 60%) - var(--hero-pad, 4vw)) / 4) 100%",
          backgroundPosition: "var(--hero-pad, 4vw) 0",
        }}
      />

      {/* Vertical editorial caption along the left edge (over the light field) */}
      <span
        aria-hidden
        className={`reveal-fade fixed left-4 top-1/2 z-30 hidden -translate-y-1/2 text-[0.58rem] font-medium uppercase tracking-[0.34em] text-ink/35 [writing-mode:vertical-rl] lg:block transition-opacity duration-700 ${fade}`}
      >
        Nerodyn · Obsidian Core · EST MMXXVI
      </span>

      {/* Accessible headline (the visual is rendered as liquid in the canvas) */}
      <h1 className="sr-only">Maximise Your Digital Potential</h1>

      {/* Capability index, right-aligned to the headline's own edge. */}
      <div
        aria-hidden
        className={`reveal-fade pointer-events-none absolute z-30 hidden text-right lg:block transition-opacity duration-700 ${fade}`}
        style={{
          right: "var(--hero-inset-r, 40%)",
          top: "var(--hero-l2, 26%)",
          ["--d" as string]: "1.15s",
        }}
      >
        <ul className="flex flex-col items-end">
          {INDEX.map((it) => (
            <li
              key={it.n}
              className="flex items-baseline gap-3 border-t border-ink/[0.09] py-1.5 pl-10"
            >
              <span className="text-[0.58rem] font-medium tabular-nums tracking-[0.2em] text-accent/70">
                {it.n}
              </span>
              <span className="text-[0.66rem] font-medium uppercase tracking-[0.24em] text-ink/55">
                {it.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* UI layer */}
      <div
        className={`pointer-events-none relative z-30 flex min-h-screen flex-col px-[4vw] transition-opacity duration-700 ${fade}`}
      >
        <header className="flex items-center justify-between border-b border-ink/[0.07] py-7">
          <div className="flex items-center gap-7">
            <Link
              href="/"
              className="reveal-fade pointer-events-auto flex items-center gap-2 text-ink"
              aria-label="Nerodyn home"
            >
              <Image src={`${BASE}/new-logo.svg`} alt="" width={30} height={30} priority />
              <span className="text-lg font-semibold tracking-tight">Nerodyn</span>
            </Link>
            {/* Availability — the one live signal on the page. */}
            <span
              className="reveal-fade hidden items-center gap-2 border-l border-ink/[0.12] pl-7 text-[0.6rem] font-medium uppercase tracking-[0.22em] text-ink/45 lg:flex"
              style={{ ["--d" as string]: "0.75s" }}
            >
              <span aria-hidden className="live-dot relative block h-1.5 w-1.5 rounded-full bg-accent" />
              Taking work · Q3 2026
            </span>
          </div>
          <nav className="hidden items-center gap-9 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-ink/80 md:flex">
            {NAV_LINKS.map((l) => (
              <a
                key={l}
                href="#"
                className="reveal-fade group pointer-events-auto relative inline-block overflow-hidden leading-none"
              >
                <span className="block transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-full">
                  {l}
                </span>
                <span
                  aria-hidden
                  className="absolute left-0 top-full block text-accent transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-full"
                >
                  {l}
                </span>
              </a>
            ))}
          </nav>
          <button
            type="button"
            className="reveal-fade pointer-events-auto text-[0.72rem] font-medium uppercase tracking-[0.16em] text-ink md:hidden"
            aria-label="Open menu"
          >
            Menu
          </button>
        </header>

        <div className="flex-1" />

        <footer
          className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between"
          style={{ maxWidth: "calc(var(--hero-right, 60%) - 4vw)" }}
        >
          {/* All copy lives in a confident left column; the monument owns the
              right zone outright — nothing else is allowed into it. */}
          <div className="flex max-w-[32rem] flex-col gap-7">
            <p className="reveal-fade pointer-events-auto max-w-[30rem] border-l border-accent/30 pl-5 text-[0.95rem] leading-relaxed text-ink/70">
              <span className="font-medium text-ink">
                The architecture behind ambitious companies.
              </span>{" "}
              We build and run the digital infrastructure and AI automation that
              move you faster.
            </p>

            <div className="reveal-fade flex flex-wrap items-center gap-3">
              <div className="pointer-events-auto">
                <HearTheStory onDive={() => setDiving(true)} />
              </div>
              <a
                href="#"
                className="group pointer-events-auto inline-flex items-center gap-2 rounded-full border border-ink/15 px-6 py-3.5 text-[0.92rem] font-medium tracking-tight text-ink transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-white"
              >
                Start a project
                <span className="text-base transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  ↗
                </span>
              </a>
            </div>
          </div>

          {/* Scroll cue, in the channel between the copy and the shard. */}
          <span className="reveal-fade pointer-events-none mb-1 hidden items-center gap-3 text-[0.62rem] font-medium uppercase tracking-[0.28em] text-ink/40 sm:flex">
            Scroll
            <span aria-hidden className="scroll-cue relative block h-9 w-px bg-ink/20" />
          </span>
        </footer>

        {/* Base rail: a slow band of capability at the foot of the composition.
            Anchored to the headline's own edges so it sits on the same grid. */}
        <div
          aria-hidden
          className="reveal-fade mt-7 hidden border-t border-ink/[0.09] pb-8 pt-3.5 lg:block"
          style={{
            maxWidth: "calc(var(--hero-right, 60%) - 4vw)",
            ["--d" as string]: "1.35s",
          }}
        >
          <div className="rail-mask overflow-hidden">
            <div className="rail-track flex w-max">
              {[0, 1].map((k) => (
                <div key={k} className="flex shrink-0">
                  {RAIL.map((r) => (
                    <span
                      key={r}
                      className="flex shrink-0 items-center gap-8 pr-8 text-[0.62rem] font-medium uppercase tracking-[0.3em] text-ink/40"
                    >
                      {r}
                      <span className="text-accent/50">◆</span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
