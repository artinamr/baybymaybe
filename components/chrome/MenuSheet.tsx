"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export type MenuLink = { label: string; mark: string; href: string; current?: boolean; onClick?: () => void };

/**
 * The phone's menu: a sheet over the page. Closed it is inert (out of the tab
 * order and the accessibility tree); open it takes focus, keeps Tab inside,
 * Escape closes it, and focus goes back to the Menu button. A link with an
 * `onClick` acts in place (a jump on the home page) and closes the sheet.
 */
export function MenuSheet({
  open,
  onClose,
  links,
  extra,
}: {
  open: boolean;
  onClose: () => void;
  links: MenuLink[];
  extra?: ReactNode;
}) {
  const sheet = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const back = document.activeElement as HTMLElement | null;
    close.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !sheet.current) return;
      // Keep Tab inside the sheet: from the last link round to Close, and back.
      const f = sheet.current.querySelectorAll<HTMLElement>("button, a[href]");
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (back?.isConnected) back.focus({ preventScroll: true });
    };
  }, [open, onClose]);
  return (
    <div className="menu-sheet" ref={sheet} data-open={open || undefined} inert={!open} role="dialog" aria-modal="true" aria-label="Menu">
      <button type="button" className="menu-close mono" onClick={onClose} ref={close}>
        Close
      </button>
      <nav aria-label="Site">
        {links.map((l, i) => (
          <a
            key={l.label}
            href={l.href}
            style={{ "--i": i } as CSSProperties}
            aria-current={l.current ? "page" : undefined}
            onClick={
              l.onClick
                ? (e) => {
                    e.preventDefault();
                    onClose();
                    l.onClick?.();
                  }
                : undefined
            }
          >
            <span className="mono">{l.mark}</span> {l.label}
          </a>
        ))}
      </nav>
      {extra}
    </div>
  );
}
