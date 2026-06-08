"use client";

import { startDive } from "@/lib/heroAnim";

export function HearTheStory({ onDive }: { onDive: () => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        onDive();
        startDive();
      }}
      className="btn-shine group relative inline-flex items-center gap-3 rounded-full px-7 py-3.5 text-[0.92rem] font-medium tracking-tight text-white shadow-[0_10px_30px_-8px_rgba(91,61,240,0.65),inset_0_1px_0_rgba(255,255,255,0.28)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_38px_-8px_rgba(91,61,240,0.75),inset_0_1px_0_rgba(255,255,255,0.3)]"
      style={{
        backgroundImage: "linear-gradient(180deg, #6b4eff 0%, #5024e6 100%)",
      }}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
      </span>
      Hear the story
      <span className="relative ml-0.5 block h-[14px] w-[18px] overflow-hidden">
        <span className="absolute inset-0 flex items-center transition-transform duration-300 group-hover:translate-x-[140%]">
          →
        </span>
        <span className="absolute inset-0 flex items-center -translate-x-[140%] transition-transform duration-300 group-hover:translate-x-0">
          →
        </span>
      </span>
    </button>
  );
}
