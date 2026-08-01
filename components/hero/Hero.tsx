"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";
import { usePointerTracking } from "@/lib/usePointer";
import { useSmoothScroll } from "@/lib/useSmoothScroll";
import { HearTheStory } from "./HearTheStory";

const HeroCanvas = dynamic(() => import("./HeroCanvas"), { ssr: false });

const NAV_LINKS = ["Work", "Our Story", "Labs", "Insights", "Connect"];

export function Hero() {
  const [diving, setDiving] = useState(false);

  usePointerTracking();
  useSmoothScroll();

  const fade = diving ? "opacity-0" : "opacity-100";

  return (
    <section className="relative min-h-screen w-full overflow-hidden">
      {/* Whisper-quiet background */}
      <div className="hero-bg fixed inset-0 z-0" />

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
        <header className="flex items-center justify-between py-7">
          <a
            href="/"
            className="reveal-fade pointer-events-auto flex items-center gap-2 text-ink"
            aria-label="Nerodyn home"
          >
            <Image src="/logo-mark.svg" alt="" width={34} height={34} priority />
            <span className="text-lg font-semibold tracking-tight">Nerodyn</span>
          </a>
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

        <footer className="flex flex-col gap-10 pb-9 sm:flex-row sm:items-end sm:justify-between">
          {/* All copy lives in a confident left column; the monument owns the right. */}
          <div className="flex max-w-[32rem] flex-col gap-7">
            <span className="reveal-fade flex items-center gap-3 text-[0.68rem] font-medium uppercase tracking-[0.26em] text-muted">
              <span className="h-px w-8 bg-accent/70" />
              Digital Infrastructure · AI Automation
            </span>

            <p className="reveal-fade pointer-events-auto max-w-[28rem] border-l border-accent/30 pl-5 text-[0.95rem] leading-relaxed text-ink/70">
              <span className="font-medium text-ink">
                The architecture behind ambitious companies.
              </span>{" "}
              Nerodyn engineers the digital infrastructure and AI automation that
              move you faster — built, integrated, and run end to end.
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

          {/* Scroll cue, lower-right, clear of the monument's narrow base. */}
          <span className="reveal-fade pointer-events-none mb-1 hidden items-center gap-3 text-[0.62rem] font-medium uppercase tracking-[0.28em] text-ink/40 sm:flex">
            Scroll to explore
            <span aria-hidden className="scroll-cue relative block h-9 w-px bg-ink/20" />
          </span>
        </footer>
      </div>
    </section>
  );
}
