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

// next/image does NOT prepend basePath for us (Next 16 docs) — do it manually,
// same as the GLB URL, so assets resolve on the GitHub Pages subpath.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function Hero() {
  const [diving, setDiving] = useState(false);

  usePointerTracking();
  useSmoothScroll();

  // Publish the type zone's right edge to CSS, from the same authority the
  // headline mask and the crystal use. The DOM chrome then ends exactly where
  // the monument begins, at every viewport, with no magic percentages.
  useEffect(() => {
    const apply = () =>
      document.documentElement.style.setProperty(
        "--hero-right",
        `${heroLayout(window.innerWidth, window.innerHeight).right}px`
      );
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  const fade = diving ? "opacity-0" : "opacity-100";

  return (
    <section className="relative min-h-screen w-full overflow-hidden">
      {/* Film grain over everything */}
      <div className="grain" aria-hidden />

      {/* Vertical editorial caption along the left edge (over the light field) */}
      <span
        aria-hidden
        className={`reveal-fade fixed left-4 top-1/2 z-30 hidden -translate-y-1/2 text-[0.58rem] font-medium uppercase tracking-[0.34em] text-ink/35 [writing-mode:vertical-rl] lg:block transition-opacity duration-700 ${fade}`}
      >
        Nerodyn · Obsidian Core · EST MMXXVI
      </span>

      {/* Accessible headline (the visual is rendered as liquid in the canvas) */}
      <h1 className="sr-only">Maximise Your Digital Potential</h1>

      {/* Super effect: the headline as flowing liquid */}
      <div
        className={`pointer-events-none fixed inset-0 z-[1] transition-opacity duration-700 ${fade}`}
      >
        <HeroCanvas />
      </div>

      {/* UI layer */}
      <div
        className={`pointer-events-none relative z-30 flex min-h-screen flex-col px-[4vw] transition-opacity duration-700 ${fade}`}
      >
        <header className="flex items-center justify-between border-b border-ink/[0.07] py-7">
          <Link
            href="/"
            className="reveal-fade pointer-events-auto flex items-center gap-2 text-ink"
            aria-label="Nerodyn home"
          >
            <Image src={`${BASE}/new-logo.svg`} alt="" width={30} height={30} priority />
            <span className="text-lg font-semibold tracking-tight">Nerodyn</span>
          </Link>
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
          className="flex flex-col gap-10 pb-9 sm:flex-row sm:items-end sm:justify-between"
          style={{ maxWidth: "calc(var(--hero-right, 60%) - 4vw)" }}
        >
          {/* All copy lives in a confident left column; the monument owns the
              right zone outright — nothing else is allowed into it. */}
          <div className="flex max-w-[32rem] flex-col gap-7">
            <span className="reveal-fade flex items-center gap-3 text-[0.68rem] font-medium uppercase tracking-[0.26em] text-muted">
              <span className="h-px w-8 bg-accent/70" />
              Digital Infrastructure · AI Automation
            </span>

            <p className="reveal-fade pointer-events-auto max-w-[28rem] border-l border-accent/30 pl-5 text-[0.95rem] leading-relaxed text-ink/70">
              <span className="font-medium text-ink">
                The architecture behind ambitious companies.
              </span>{" "}
              {/* Small screens are one column and the shard needs its own band —
                  the second sentence would push the copy up into it. */}
              <span className="hidden sm:inline">
                Nerodyn engineers the digital infrastructure and AI automation
                that move you faster — built, integrated, and run end to end.
              </span>
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

          {/* Scroll cue. It used to sit in the footer's right slot, which the
              monument now occupies entirely. It sits in the channel between the
              copy column and the shard instead — the one piece of quiet space
              left in the composition — and stays the lowest thing on the page. */}
          <span className="reveal-fade pointer-events-none mb-1 hidden items-center gap-3 text-[0.62rem] font-medium uppercase tracking-[0.28em] text-ink/40 sm:flex">
            Scroll
            <span aria-hidden className="scroll-cue relative block h-9 w-px bg-ink/20" />
          </span>
        </footer>
      </div>
    </section>
  );
}
