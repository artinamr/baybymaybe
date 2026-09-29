"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { CONTACT, FORM_ENDPOINT } from "@/lib/content";

const NEEDS = ["Website", "Platform", "AI automation", "Not sure yet"] as const;
type State = "idle" | "sending" | "sent" | "error";

/** A plain email with everything the form holds — the way through if the post fails. */
function mailto(f: { name: string; email: string; site: string; need: string; message: string }) {
  const subject = encodeURIComponent(`Free audit${f.site ? ` — ${f.site}` : ""}`);
  const body = encodeURIComponent(
    `Name: ${f.name}\nEmail: ${f.email}\nWebsite: ${f.site || "—"}\nWhat we need: ${f.need}\n\n${f.message}`.trim() + "\n"
  );
  return `mailto:${CONTACT.email}?subject=${subject}&body=${body}`;
}

/**
 * THE AUDIT FORM — the site's one ask. Name, email, the website, what you
 * need, anything else. It posts to FORM_ENDPOINT (lib/content.ts) and says
 * plainly what happened; if the post cannot go through, it hands you the same
 * message as an email, already written.
 */
export function AuditForm({ tone = "paper" }: { tone?: "paper" | "card" }) {
  const uid = useId();
  const [need, setNeed] = useState<string[]>([]);
  const [state, setState] = useState<State>("idle");
  const [errs, setErrs] = useState<{ name?: string; email?: string }>({});
  const [sentTo, setSentTo] = useState("");
  const [mailHref, setMailHref] = useState(`mailto:${CONTACT.email}`);
  // The thank-you keeps the form's height, so the page never jumps under the reader.
  const formRef = useRef<HTMLFormElement>(null);
  const [doneH, setDoneH] = useState(0);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (state === "sending") return;
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const site = String(data.get("site") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const honey = String(data.get("_honey") ?? "");
    const bad: typeof errs = {};
    if (!name) bad.name = "Your name, so we know who to write to.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) bad.email = "An email we can reply to.";
    setErrs(bad);
    if (bad.name || bad.email) {
      e.currentTarget.querySelector<HTMLInputElement>(bad.name ? "input[name=name]" : "input[name=email]")?.focus();
      return;
    }
    const needs = need.length ? need.join(", ") : "Not said";
    setMailHref(mailto({ name, email, site, need: needs, message }));
    // A bot filled the hidden field: thank it and send nothing.
    if (honey) {
      setDoneH(formRef.current?.offsetHeight ?? 0);
      setSentTo(name);
      setState("sent");
      return;
    }
    setState("sending");
    const ctl = new AbortController();
    const timer = window.setTimeout(() => ctl.abort(), 15000);
    try {
      const r = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name,
          email,
          website: site || "—",
          need: needs,
          message: message || "—",
          _subject: `Free audit — ${site || name}`,
          _replyto: email,
          _template: "table",
          _captcha: "false",
        }),
        signal: ctl.signal,
      });
      const j = (await r.json().catch(() => ({}))) as { success?: boolean | string; ok?: boolean };
      const ok = r.ok && (j.success === undefined ? j.ok !== false : j.success === true || j.success === "true");
      setDoneH(formRef.current?.offsetHeight ?? 0);
      setSentTo(name);
      setState(ok ? "sent" : "error");
    } catch {
      setState("error");
    } finally {
      window.clearTimeout(timer);
    }
  };

  if (state === "sent") {
    return (
      <div className={`audit-form af-${tone} af-done`} role="status" aria-live="polite" style={doneH ? { minHeight: doneH } : undefined}>
        <span className="af-tick" aria-hidden>
          <svg viewBox="0 0 24 24">
            <path d="M5 12.5l4.4 4.3L19 7.5" />
          </svg>
        </span>
        <p className="af-done-title">Thank you{sentTo ? `, ${sentTo.split(" ")[0]}` : ""}.</p>
        <p className="af-done-line">
          It&apos;s with us. You&apos;ll have your audit — a straight answer, no pitch — within two days, at the address you gave.
        </p>
        <button
          type="button"
          className="text-link"
          onClick={() => {
            setState("idle");
            setNeed([]);
          }}
        >
          Send another <span aria-hidden>↺</span>
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} className={`audit-form af-${tone}`} onSubmit={submit} noValidate data-state={state}>
      <fieldset className="af-need">
        <legend className="af-label">What do you need?</legend>
        <div className="af-chips">
          {NEEDS.map((n) => {
            const on = need.includes(n);
            return (
              <button
                key={n}
                type="button"
                className="chip"
                aria-pressed={on}
                onClick={() => setNeed((cur) => (on ? cur.filter((x) => x !== n) : [...cur, n]))}
              >
                {n}
              </button>
            );
          })}
        </div>
      </fieldset>
      <div className="af-grid">
        <label className="af-field" data-bad={errs.name ? "" : undefined}>
          <span className="af-label">Your name</span>
          <input
            name="name"
            autoComplete="name"
            placeholder="Full name"
            aria-invalid={errs.name ? true : undefined}
            aria-describedby={errs.name ? `${uid}-n` : undefined}
            onInput={() => errs.name && setErrs((x) => ({ ...x, name: undefined }))}
          />
          {errs.name ? (
            <span className="af-err" id={`${uid}-n`}>
              {errs.name}
            </span>
          ) : null}
        </label>
        <label className="af-field" data-bad={errs.email ? "" : undefined}>
          <span className="af-label">Your email</span>
          <input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@yourbusiness.com"
            aria-invalid={errs.email ? true : undefined}
            aria-describedby={errs.email ? `${uid}-e` : undefined}
            onInput={() => errs.email && setErrs((x) => ({ ...x, email: undefined }))}
          />
          {errs.email ? (
            <span className="af-err" id={`${uid}-e`}>
              {errs.email}
            </span>
          ) : null}
        </label>
        <label className="af-field af-wide">
          <span className="af-label">
            Your website <span className="af-opt">— if you have one</span>
          </span>
          <input name="site" inputMode="url" autoComplete="url" placeholder="yourbusiness.com" />
        </label>
        <label className="af-field af-wide">
          <span className="af-label">
            Anything we should know? <span className="af-opt">— optional</span>
          </span>
          <textarea name="message" rows={3} placeholder="What's working, what isn't, what you'd like it to do." />
        </label>
        {/* A field only bots fill. */}
        <label className="af-honey" aria-hidden>
          Leave this empty
          <input name="_honey" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="af-foot">
        <button type="submit" className="pill btn-shine pill-lg af-send" disabled={state === "sending"}>
          <span>{state === "sending" ? "Sending…" : "Start my free audit"}</span>
          <span className="pill-arrow" aria-hidden>
            <span>→</span>
            <span>→</span>
          </span>
        </button>
        <p className="af-note" aria-live="polite">
          {state === "error" ? (
            <>
              That didn&apos;t go through.{" "}
              <a href={mailHref} className="af-mail">
                Send it as an email instead
              </a>{" "}
              — it&apos;s already written.
            </>
          ) : (
            <>Free, and no pitch. We reply within two days.</>
          )}
        </p>
      </div>
    </form>
  );
}
