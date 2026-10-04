"use client";

import { useState } from "react";
import s from "./enquiry.module.css";

/**
 * STUDIO DEMONSTRATION — an enquiry desk for a fictional physiotherapy
 * clinic, "Pellow". Step through what the automation does with an email:
 * it arrives, the details are organised, availability is checked, a reply is
 * drafted — and a person approves it. One of the sample enquiries shows the
 * limit: a symptom that may be urgent is never answered automatically; it
 * goes straight to a person. Local sample data; nothing is sent anywhere.
 */

type Field = { k: string; v: string; flag?: string };
type Enquiry = {
  id: string;
  from: string;
  address: string;
  at: string;
  subject: string;
  body: string;
  fields: Field[];
  slots?: { when: string; who: string }[];
  rules?: string[];
  draft?: string;
  urgent?: string;
};

const ENQUIRIES: Enquiry[] = [
  {
    id: "booking",
    from: "Sam Ellis",
    address: "sam@example.com",
    at: "9:14",
    subject: "Sore shoulder: appointment this week?",
    body: "Hi, I’ve had a sore right shoulder for about three weeks, since I moved house. Could I get an appointment this week, ideally after 4pm? Would it be covered by ACC? Thanks, Sam",
    fields: [
      { k: "Name", v: "Sam Ellis" },
      { k: "Reply to", v: "sam@example.com" },
      { k: "Reason", v: "Right shoulder pain, about three weeks" },
      { k: "Wants", v: "A first appointment this week" },
      { k: "Times", v: "After 4pm" },
      { k: "Funding", v: "Asks about ACC", flag: "Injury while moving: the clinic confirms cover, not the system" },
      { k: "Priority", v: "Routine" },
    ],
    slots: [
      { when: "Wed 14 Oct · 4:30pm", who: "with Jess" },
      { when: "Thu 15 Oct · 5:15pm", who: "with Aroha" },
    ],
    rules: ["First appointments are 45 minutes", "Only after-4pm times, as asked", "Times are held for 24 hours, not booked"],
    draft:
      "Hi Sam,\n\nThanks for getting in touch, and sorry to hear about your shoulder. We have two first appointments this week after 4pm:\n\n• Wednesday 14 October, 4:30pm with Jess\n• Thursday 15 October, 5:15pm with Aroha\n\nReply with the one that suits and we’ll confirm it. As it started with an injury while moving house, it may be covered by ACC. We’ll go through that with you at the appointment.\n\nPellow Physiotherapy",
  },
  {
    id: "move",
    from: "Alex Moana",
    address: "alex@example.com",
    at: "11:02",
    subject: "Can I move Thursday’s appointment?",
    body: "Kia ora, something’s come up at work. Is there any chance I can move my Thursday 10am to the same time next week? Cheers, Alex",
    fields: [
      { k: "Name", v: "Alex Moana" },
      { k: "Reply to", v: "alex@example.com" },
      { k: "Reason", v: "Move an existing appointment" },
      { k: "Found", v: "Thu 15 Oct · 10:00am with Jess (follow-up)" },
      { k: "Wants", v: "Same time next week" },
      { k: "Priority", v: "Routine" },
    ],
    slots: [
      { when: "Thu 22 Oct · 10:00am", who: "with Jess" },
      { when: "Thu 22 Oct · 11:30am", who: "with Jess" },
    ],
    rules: ["Same physio as before", "More than 24 hours' notice, so no late-change fee applies"],
    draft:
      "Kia ora Alex,\n\nNo problem. Jess has Thursday 22 October at 10:00am free, the same time next week. Reply 'yes' and we’ll move it across; if that doesn’t suit, 11:30am the same day is also open.\n\nPellow Physiotherapy",
  },
  {
    id: "urgent",
    from: "Jordan Lee",
    address: "jordan@example.com",
    at: "13:40",
    subject: "Chest tightness when running",
    body: "Hi, I’ve been getting a tight feeling in my chest and some dizziness when I run. Can I book in to get it looked at? Jordan",
    fields: [
      { k: "Name", v: "Jordan Lee" },
      { k: "Reply to", v: "jordan@example.com" },
      { k: "Reason", v: "Chest tightness and dizziness when running", flag: "Possible urgent symptom" },
      { k: "Priority", v: "Urgent: needs a person" },
    ],
    urgent:
      "Symptoms like these are never answered automatically. The enquiry has gone straight to the clinic’s phone list, marked urgent, so a person calls Jordan back. No times were offered and no reply was drafted.",
  },
];

const STEPS = ["Arrives", "Organised", "Checked", "Drafted", "Approved"];
const STEPS_URGENT = ["Arrives", "Organised", "Handed to a person"];

function logFor(e: Enquiry, step: number, approvedBy: string | null) {
  const [h, m] = e.at.split(":").map(Number);
  const t = (plus: number) => `${h}:${String(m + plus).padStart(2, "0")}`;
  const out: { at: string; text: string; tone?: "flag" | "ok" }[] = [{ at: t(0), text: "Email received" }];
  if (step >= 1) {
    const flags = e.fields.filter((f) => f.flag).length;
    out.push({ at: t(0), text: flags ? `Details organised: ${flags} to check` : "Details organised", tone: flags ? "flag" : undefined });
  }
  if (e.urgent) {
    if (step >= 2) out.push({ at: t(0), text: "Marked urgent · sent to the clinic’s call list", tone: "flag" });
    return out;
  }
  if (step >= 2) out.push({ at: t(0), text: `${e.slots?.length} matching times found` });
  if (step >= 3) out.push({ at: t(1), text: "Reply drafted, waiting for approval" });
  if (step >= 4 && approvedBy) out.push({ at: t(7), text: `Approved by ${approvedBy} · sent (simulated)`, tone: "ok" });
  return out;
}

export function EnquiryDesk({ start = "booking", startStep = 0 }: { start?: string; startStep?: number }) {
  const [pick, setPick] = useState(start);
  const [step, setStep] = useState(startStep);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [approved, setApproved] = useState<string | null>(startStep >= 4 ? "Reception" : null);
  const [handed, setHanded] = useState(false);
  const e = ENQUIRIES.find((x) => x.id === pick) ?? ENQUIRIES[0];
  const steps = e.urgent ? STEPS_URGENT : STEPS;
  const last = steps.length - 1;
  const log = logFor(e, step, approved);
  if (handed) log.push({ at: log[log.length - 1].at, text: "Handed to reception, with the draft", tone: "flag" });
  const choose = (id: string) => {
    setPick(id);
    setStep(0);
    setApproved(null);
    setHanded(false);
  };

  return (
    <div className={s.root}>
      <div className={s.inbox} role="group" aria-label="Sample enquiries">
        <p className={s.brand}>
          <b>P</b> Pellow <span>· Enquiry desk</span>
        </p>
        <p className={s.label}>Inbox · sample</p>
        {ENQUIRIES.map((x) => (
          <button key={x.id} type="button" className={s.mail} aria-pressed={pick === x.id} onClick={() => choose(x.id)}>
            <span className={s.mailTop}>
              <b>{x.from}</b>
              <em>{x.at}</em>
            </span>
            <span className={s.mailSub}>{x.subject}</span>
            {x.urgent ? <span className={s.urgentTag}>Urgent</span> : null}
          </button>
        ))}
      </div>

      <div className={s.main}>
        <ol className={s.steps} aria-label="Progress">
          {steps.map((st, i) => (
            <li key={st} data-state={i < step ? "done" : i === step ? "now" : undefined} aria-current={i === step ? "step" : undefined}>
              <span className={s.stepN}>{i < step ? "✓" : i + 1}</span>
              <span>{st}</span>
            </li>
          ))}
        </ol>

        <section className={s.stage} aria-live="polite">
          {step === 0 ? (
            <div className={s.email}>
              <p className={s.meta}>
                <b>{e.from}</b> &lt;{e.address}&gt; · today {e.at}
              </p>
              <p className={s.subject}>{e.subject}</p>
              <p className={s.body}>{e.body}</p>
            </div>
          ) : null}

          {step === 1 ? (
            <div>
              <p className={s.stageH}>What the email says, organised</p>
              <dl className={s.fields}>
                {e.fields.map((f) => (
                  <div key={f.k} data-flag={f.flag ? "" : undefined}>
                    <dt>{f.k}</dt>
                    <dd>
                      {f.v}
                      {f.flag ? <span className={s.flag}>{f.flag}</span> : null}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          {step === 2 && !e.urgent ? (
            <div>
              <p className={s.stageH}>Checked against the clinic’s diary</p>
              <ul className={s.slots}>
                {e.slots?.map((sl) => (
                  <li key={sl.when}>
                    <b>{sl.when}</b>
                    <span>{sl.who}</span>
                  </li>
                ))}
              </ul>
              <ul className={s.rules}>
                {e.rules?.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {step === 2 && e.urgent ? (
            <div className={s.handover} role="note">
              <p className={s.stageH}>Handed to a person</p>
              <p>{e.urgent}</p>
            </div>
          ) : null}

          {step === 3 && !e.urgent && handed ? (
            <div className={s.handover} role="note">
              <p className={s.stageH}>Handed to reception</p>
              <p>The enquiry and the draft are in reception’s queue, to finish and send themselves. Nothing was sent.</p>
            </div>
          ) : null}

          {step === 3 && !e.urgent && !handed ? (
            <div>
              <p className={s.stageH}>A reply, drafted in the clinic’s own words. Edit anything.</p>
              <label className={s.draftWrap}>
                <span className={s.srOnly}>Draft reply</span>
                <textarea className={s.draft} value={draft[e.id] ?? e.draft} onChange={(ev) => setDraft((d) => ({ ...d, [e.id]: ev.target.value }))} rows={9} />
              </label>
              <p className={s.hint}>Nothing is sent until a person approves it.</p>
            </div>
          ) : null}

          {step === 4 && !e.urgent ? (
            <div className={s.done} role="status">
              <span className={s.tick} aria-hidden>
                ✓
              </span>
              <div>
                <p className={s.stageH}>Approved by {approved ?? "Reception"}</p>
                <p>Sent (in this demonstration, only on this page). In the clinic, the times are held until {e.from.split(" ")[0]} replies.</p>
              </div>
            </div>
          ) : null}
        </section>

        <div className={s.controls}>
          <button
            type="button"
            className={s.ghost}
            onClick={() => {
              setHanded(false);
              setStep((x) => Math.max(0, x - 1));
            }}
            disabled={step === 0}
          >
            Back
          </button>
          {step === 3 && !e.urgent && handed ? (
            <button type="button" className={s.primary} onClick={() => choose(ENQUIRIES[(ENQUIRIES.indexOf(e) + 1) % ENQUIRIES.length].id)}>
              Try the next enquiry
            </button>
          ) : step === 3 && !e.urgent ? (
            <>
              <button type="button" className={s.ghost} onClick={() => setHanded(true)}>
                Hand to a person
              </button>
              <button
                type="button"
                className={s.primary}
                onClick={() => {
                  setApproved("Reception");
                  setStep(4);
                }}
              >
                Approve and send
              </button>
            </>
          ) : step < last ? (
            <button type="button" className={s.primary} onClick={() => setStep((x) => x + 1)}>
              Next: {steps[step + 1]}
            </button>
          ) : (
            <button type="button" className={s.primary} onClick={() => choose(ENQUIRIES[(ENQUIRIES.indexOf(e) + 1) % ENQUIRIES.length].id)}>
              Try the next enquiry
            </button>
          )}
        </div>
      </div>

      <div className={s.log} role="group" aria-label="What happened">
        <p className={s.label}>Log</p>
        <ol>
          {log.map((l, i) => (
            <li key={i} data-tone={l.tone}>
              <em>{l.at}</em>
              <span>{l.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
