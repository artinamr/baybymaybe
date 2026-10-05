import type { Service } from "@/content/services";

type Slug = Service["slug"];

/** One enquiry's way through the three disciplines, start to finish. */
export const JOURNEY: { t: string; b: string; by: Slug; person?: boolean }[] = [
  { t: "Someone finds you", b: "A clear page for the service they searched for, quick on their phone.", by: "websites" },
  { t: "They enquire or book", b: "A short form or a real booking calendar, with a promise of what happens next.", by: "websites" },
  { t: "It’s read and answered", b: "The enquiry is sorted and a reply drafted. A person checks it before it goes.", by: "ai-automation", person: true },
  { t: "The work is set up", b: "A record in your system, a job for your team, and a login for the client.", by: "platforms" },
  { t: "Everyone sees progress", b: "Documents, approvals and invoices in one place, not a chain of emails.", by: "platforms" },
  { t: "Follow-ups go out", b: "Reminders, updates and review requests, on time and the same way every time.", by: "ai-automation" },
];

const TAG: Record<Slug, string> = { websites: "Website", platforms: "Platform", "ai-automation": "Automation" };

/**
 * THE JOURNEY: one enquiry passing through a website, a platform and
 * automation, as a line of steps (a column on a phone), each tagged with the
 * discipline that does it. With `focus`, the steps of the other two step
 * back, so a service page shows where it fits. HTML, not a picture: its
 * words stay real text and it reflows.
 */
export function Journey({ focus }: { focus?: Slug }) {
  return (
    <ol className="jr" data-focus={focus}>
      {JOURNEY.map((s, i) => (
        <li key={s.t} className="jr-step" data-by={s.by} data-dim={focus && s.by !== focus ? "" : undefined}>
          <span className="jr-tag">{TAG[s.by]}</span>
          <span className="jr-dot" aria-hidden>
            <span className="mono">{String(i + 1).padStart(2, "0")}</span>
          </span>
          <p className="jr-t">
            {s.t}
            {s.person ? (
              <span className="jr-person" title="A person approves this step">
                <svg viewBox="0 0 24 24" aria-hidden>
                  <circle cx="12" cy="8" r="3.6" />
                  <path d="M4.8 20c.9-3.9 3.7-6 7.2-6s6.3 2.1 7.2 6" />
                </svg>
                <span className="sr-only"> (a person approves)</span>
              </span>
            ) : null}
          </p>
          <p className="jr-b">{s.b}</p>
        </li>
      ))}
    </ol>
  );
}
