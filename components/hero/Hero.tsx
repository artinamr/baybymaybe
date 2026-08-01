"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { heroLayout, LINES } from "@/lib/heroLayout";
import { usePointerTracking } from "@/lib/usePointer";
import { useSmoothScroll } from "@/lib/useSmoothScroll";
import { HearTheStory } from "./HearTheStory";
import { Logo } from "./Logo";

const HeroCanvas = dynamic(() => import("./HeroCanvas"), { ssr: false });

const NAV_LINKS = ["Work", "Our Story", "Labs", "Insights", "Connect"];

export function Hero() {
  const [diving, setDiving] = useState(false);

  usePointerTracking();
  useSmoothScroll();

  // Publish the headline's geometry to CSS from the same authority the crystal
  // uses, so the type block and the object can never drift apart.
  useEffect(() => {
    const apply = () => {
      const L = heroLayout(window.innerWidth, window.innerHeight);
      const s = document.documentElement.style;
      s.setProperty("--hero-fs", `${L.fontSize}px`);
      s.setProperty("--hero-pad", `${L.padX}px`);
      s.setProperty("--hero-top", `${L.typeTop}px`);
      s.setProperty("--hero-right", `${L.right}px`);
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  const fade = diving ? "opacity-0" : "opacity-100";

  return (
    <section className="relative min-h-screen w-full overflow-hidden">
      <div className="grain" aria-hidden />

      {/* The object and the page field. */}
      <div
        className={`pointer-events-none fixed inset-0 z-[1] transition-opacity duration-700 ${fade}`}
      >
        <HeroCanvas />
      </div>

      {/* The headline. Real text — sharper than the canvas mask it replaced,
          selectable, and it needs no sr-only twin. Absolutely placed so it sits
          exactly where heroLayout says, beside the object's channel. */}
      <h1
        className={`hero-head pointer-events-none absolute z-20 transition-opacity duration-700 ${fade}`}
      >
        {LINES.map((line, i) => (
          <span
            key={line.text}
            className="reveal block"
            style={{ ["--d" as string]: `${0.35 + i * 0.11}s` }}
          >
            <span className={line.style === "hollow" ? "hollow" : undefined}>
              {line.text}
            </span>
          </span>
        ))}
      </h1>

      {/* UI layer */}
      <div
        className={`pointer-events-none relative z-30 flex min-h-screen flex-col transition-opacity duration-700 ${fade}`}
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
          <button
            type="button"
            className="reveal-fade pointer-events-auto text-[0.78rem] font-medium text-ink md:hidden"
            aria-label="Open menu"
          >
            Menu
          </button>
        </header>

        <div className="flex-1" />

        <footer className="flex flex-col gap-7 pb-14">
          <p
            className="reveal-fade pointer-events-auto max-w-[27rem] text-[0.98rem] leading-[1.65] text-ink/65"
            style={{ ["--d" as string]: "0.75s" }}
          >
            <span className="font-medium text-ink">
              The architecture behind ambitious companies.
            </span>{" "}
            We build and run the digital infrastructure and AI automation that
            move you faster.
          </p>

          <div
            className="reveal-fade flex flex-wrap items-center gap-3"
            style={{ ["--d" as string]: "0.88s" }}
          >
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
        </footer>
      </div>
    </section>
  );
}
