"use client";

import { useCallback, useState } from "react";
import { MenuSheet } from "@/components/chrome/MenuSheet";
import { NAV, type Here } from "@/lib/nav";

/** The sub-pages' Menu button (phones) and its sheet: every page, and the free audit. */
export function SubMenu({ here, audit }: { here?: Here; audit: string }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const links = [
    ...NAV.map((l, i) => ({ label: l.label, mark: String(i + 1).padStart(2, "0"), href: l.href, current: l.key === here })),
    { label: "Free audit", mark: audit.startsWith("#") ? "↓" : "→", href: audit, onClick: audit.startsWith("#") ? () => jumpTo(audit) : undefined },
  ];
  return (
    <>
      <button type="button" className="sp-menu mono" onClick={() => setOpen(true)} aria-haspopup="dialog">
        Menu
      </button>
      <MenuSheet open={open} onClose={close} links={links} />
    </>
  );
}

/** An in-page anchor, once the sheet has let go of the page. */
function jumpTo(hash: string) {
  requestAnimationFrame(() => document.querySelector(hash)?.scrollIntoView());
}
