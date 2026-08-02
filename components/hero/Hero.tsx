"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { heroLayout } from "@/lib/heroLayout";
import { usePointerTracking } from "@/lib/usePointer";
import { useSmoothScroll } from "@/lib/useSmoothScroll";
import { HearTheStory } from "./HearTheStory";
import { Logo } from "./Logo";
import { Seal } from "./Seal";

const HeroCanvas = dynamic(() => import("./HeroCanvas"), { ssr: false });

const NAV_LINKS = ["Work", "Our Story", "Labs", "Insights", "Connect"];

export function Hero() {
  const [diving, setDiving] = useState(false);
  const [rockHot, setRockHot] = useState(false);

  usePointerTracking();
  useSmoothScroll();

  // Publish the rock's geometry to CSS from the same authority the 3D scene
  // uses, so the field glow, its shadow and the seal all track the object.
  useEffect(() => {
    const apply = () => {
      const L = heroLayout(window.innerWidth, window.innerHeight);
      const s = document.documentElement.style;
      s.setProperty("--hero-pad", `${L.padX}px`);
      s.setProperty("--rock-left", `${L.rockLeft}px`);
      s.setProperty("--rock-x", `${(L.rockX * 100).toFixed(2)}%`);
      s.setProperty("--rock-base", `${(L.rockBaseY * 100).toFixed(2)}%`);
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  const dive = useCallback(() => setDiving(true), []);
  const fade = diving ? "opacity-0" : "opacity-100";

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* The page field. CSS rather than a shader quad, because the canvas above
          it must stay transparent for the rock to occlude the headline. */}
      <div aria-hidden className={`hero-field ${rockHot ? "is-hot" : ""}`} />
      <div className="grain" aria-hidden />

      {/* THE HEADLINE, BEHIND THE ROCK.
          z-[1] puts it under the transparent canvas, so the rock genuinely cuts
          across the letters. Three deliberately different textures — bold sans,
          serif italic, and a huge outline — because three lines at one size in
          one weight is the thing that reads as a template. */}
      <h1
        className={`hero-head pointer-events-none absolute z-[1] transition-opacity duration-700 ${fade}`}
      >
        <span className="reveal block" style={{ ["--d" as string]: "0.30s" }}>
          <span className="hh-1">Maximise</span>
        </span>
        <span className="reveal block" style={{ ["--d" as string]: "0.42s" }}>
          <span className="hh-2">your digital</span>
        </span>
        <span className="reveal block" style={{ ["--d" as string]: "0.54s" }}>
          <span className="hh-3">POTENTIAL</span>
        </span>
      </h1>

      {/* The rock. */}
      <div
        className={`fixed inset-0 z-[2] transition-opacity duration-700 ${fade}`}
      >
        <HeroCanvas onEnter={dive} onHover={setRockHot} />
      </div>

      {/* UI */}
      <div
        className={`pointer-events-none relative z-30 flex h-screen flex-col transition-opacity duration-700 ${fade}`}
        style={{ paddingInline: "var(--hero-pad, 5.5vw)" }}
      >
        <header className="flex items-center justify-between py-9">
          <Link
            href="/"
            className="reveal-fade pointer-events-auto flex items-center gap-3 text-ink"
            aria-label="Nerodyn home"
          >
            <Logo className="h-9 w-9" />
            <span className="text-[1.35rem] font-semibold leading-none tracking-[-0.02em]">
              Nerodyn
            </span>
          </Link>
          <nav className="hidden items-center gap-10 text-[0.78rem] font-medium tracking-[0.02em] text-ink/75 md:flex">
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
        </header>

        <div className="flex-1" />

        {/* Capped at the rock's left edge, from the same layout authority, so
            the seal lands in the channel beside the rock instead of underneath
            it. */}
        <footer
          className="flex items-end justify-between gap-10 pb-12"
          style={{ maxWidth: "calc(var(--rock-left, 62%) - var(--hero-pad, 5.5vw) - 2.5rem)" }}
        >
          <div className="flex max-w-[26rem] flex-col gap-7">
            <p
              className="reveal-fade pointer-events-auto text-[0.98rem] leading-[1.65] text-ink/65"
              style={{ ["--d" as string]: "0.70s" }}
            >
              <span className="font-medium text-ink">
                The architecture behind ambitious companies.
              </span>{" "}
              We build and run the digital infrastructure and AI automation that
              move you faster.
            </p>

            <div
              className="reveal-fade flex flex-wrap items-center gap-3"
              style={{ ["--d" as string]: "0.82s" }}
            >
              <div className="pointer-events-auto">
                <HearTheStory onDive={dive} />
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

          {/* The seal sits under the rock's base, so the two read as one
              object rather than as a widget parked in a corner. */}
          <div
            className="reveal-fade mb-1 hidden lg:block"
            style={{ ["--d" as string]: "0.95s" }}
          >
            <Seal onClick={dive} />
          </div>
        </footer>
      </div>
    </section>
  );
}
