"use client";

import { useEffect, useState } from "react";
import { PLACE } from "@/lib/content";

const fmt = () =>
  new Intl.DateTimeFormat("en-NZ", { timeZone: PLACE.timeZone, hour: "numeric", minute: "2-digit", hour12: true })
    .format(new Date())
    .replace(/\s/g, " ")
    .toLowerCase();

/**
 * The time in Auckland, for anyone wondering whether we are awake. Rendered
 * after load (the server doesn't know when you are reading), then kept current.
 */
export function NzTime({ label = true, className = "nz-time" }: { label?: boolean; className?: string }) {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () => setT(fmt());
    tick();
    const id = window.setInterval(tick, 20000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span className={className} data-ready={t ? "" : undefined}>
      {label ? <span className="nz-time-l">{PLACE.city}</span> : null}
      <time suppressHydrationWarning>{t || " "}</time>
    </span>
  );
}
