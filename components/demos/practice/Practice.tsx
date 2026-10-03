"use client";

import { useState } from "react";
import s from "./practice.module.css";

/**
 * STUDIO DEMONSTRATION — a website for a fictional accounting practice,
 * "Tarn & Wick". Every screen works inside its frame: the home page, a
 * service page and the booking flow. It lays itself out for its frame
 * (a size container), so the same component is the desktop and the phone
 * view. Sample data only; nothing is sent anywhere.
 */
export type PracticeScreen = "home" | "service" | "booking";

const TOPICS = ["Starting a business", "Switching accountants", "A tax question", "Something else"];
const DAYS = [
  { d: "Mon", n: "12" },
  { d: "Tue", n: "13" },
  { d: "Wed", n: "14" },
  { d: "Thu", n: "15" },
  { d: "Fri", n: "16" },
];
const SLOTS: Record<string, string[]> = {
  "12": ["9:00", "11:30", "2:00"],
  "13": ["10:00", "3:30"],
  "14": ["9:30", "12:00", "4:00"],
  "15": ["1:00"],
  "16": ["9:00", "10:30", "2:30", "4:00"],
};

function Header({ go: goTo }: { go: (s: PracticeScreen) => void }) {
  const [open, setOpen] = useState(false);
  const go = (next: PracticeScreen) => {
    setOpen(false);
    goTo(next);
  };
  return (
    <header className={s.header}>
      <button type="button" className={s.brand} onClick={() => go("home")}>
        <span className={s.brandName}>Tarn &amp; Wick</span>
        <span className={s.brandSub}>Accountants &amp; advisers</span>
      </button>
      <div className={s.nav} role="group" aria-label="Demo site menu">
        <button type="button" onClick={() => go("service")}>
          Services
        </button>
      </div>
      <button type="button" className={s.headCta} onClick={() => go("booking")}>
        Book a call
      </button>
      <button type="button" className={s.burger} aria-expanded={open} aria-label="Menu" onClick={() => setOpen(!open)}>
        <i />
        <i />
      </button>
      {open ? (
        <div className={s.drop}>
          <button type="button" onClick={() => go("service")}>
            Services
          </button>
          <button type="button" onClick={() => go("booking")}>
            Book a call
          </button>
        </div>
      ) : null}
    </header>
  );
}

function Home({ go }: { go: (s: PracticeScreen) => void }) {
  return (
    <>
      <section className={s.hero}>
        <div className={s.heroText}>
          <p className={s.kicker}>Accounting for owner-run businesses</p>
          <p className={s.h1}>Know your numbers before the year is out.</p>
          <p className={s.lede}>
            Year-end accounts, GST, payroll and plain-English advice — for a fixed monthly fee, from one person who knows your
            business.
          </p>
          <div className={s.actions}>
            <button type="button" className={s.primary} onClick={() => go("booking")}>
              Book a 20-minute call
            </button>
            <button type="button" className={s.secondary} onClick={() => go("service")}>
              What&apos;s included
            </button>
          </div>
        </div>
        <div className={s.heroCards} aria-label="Sample client dashboard">
          <div className={s.dash}>
            <p className={s.dashH}>This month</p>
            <ul>
              <li>
                <span className={`${s.dot} ${s.done}`} />
                <span>GST return</span>
                <em>Filed</em>
              </li>
              <li>
                <span className={`${s.dot} ${s.soon}`} />
                <span>Payroll</span>
                <em>Runs Thursday</em>
              </li>
              <li>
                <span className={s.dot} />
                <span>Year-end accounts</span>
                <em>Draft to review</em>
              </li>
            </ul>
            <p className={s.dashFoot}>Your adviser: Maya · replies within a day</p>
          </div>
        </div>
      </section>
      <section className={s.services}>
        {[
          ["Tax & compliance", "Returns, GST and provisional tax, filed on time — with a reminder before anything is due."],
          ["Bookkeeping & payroll", "Your books kept current each month, payroll run and payday filing done."],
          ["Advice & planning", "Cash flow, pricing and structure, in a short conversation every month."],
        ].map(([t, b]) => (
          <article key={t} className={s.card}>
            <div className={s.cardTitle}>{t}</div>
            <p>{b}</p>
            {t === "Tax & compliance" ? (
              <button type="button" onClick={() => go("service")}>
                Learn more <span aria-hidden>→</span>
              </button>
            ) : null}
          </article>
        ))}
      </section>
      <section className={s.steps}>
        <p className={s.h2}>How it works</p>
        <ol>
          <li>
            <b>A 20-minute call</b>
            <span>We learn how your business runs and what you need from us.</span>
          </li>
          <li>
            <b>A fixed monthly fee</b>
            <span>One price for the year, agreed before we start. No surprise invoices.</span>
          </li>
          <li>
            <b>One person, all year</b>
            <span>The same adviser for every question, from GST to growth.</span>
          </li>
        </ol>
      </section>
      <footer className={s.foot}>
        <span>Tarn &amp; Wick — a fictional practice</span>
        <span>Privacy · Contact</span>
      </footer>
    </>
  );
}

function Service({ go }: { go: (s: PracticeScreen) => void }) {
  return (
    <>
      <section className={s.page}>
        <p className={s.crumb}>
          <button type="button" onClick={() => go("home")}>
            Home
          </button>{" "}
          / Services
        </p>
        <p className={s.h1}>Tax &amp; compliance</p>
        <p className={s.lede}>
          Everything the tax year asks of you, done on time and explained plainly — so the only surprise is how little you have to
          think about it.
        </p>
        <div className={s.split}>
          <div>
            <p className={s.h2}>What&apos;s included</p>
            <ul className={s.ticks}>
              <li>Annual accounts and income tax return</li>
              <li>GST returns, prepared and filed</li>
              <li>Provisional tax, planned ahead</li>
              <li>Reminders before every due date</li>
              <li>Answers to questions as they come up</li>
            </ul>
          </div>
          <div className={s.dates}>
            <p className={s.h2}>Your next dates</p>
            <p className={s.sample}>Sample dates</p>
            <ol>
              <li>
                <b>28 Oct</b> GST return
              </li>
              <li>
                <b>15 Jan</b> Provisional tax
              </li>
              <li>
                <b>31 Mar</b> Year end
              </li>
            </ol>
            <button type="button" className={s.primary} onClick={() => go("booking")}>
              Talk it through
            </button>
          </div>
        </div>
      </section>
      <footer className={s.foot}>
        <span>Tarn &amp; Wick — a fictional practice</span>
        <span>Privacy · Contact</span>
      </footer>
    </>
  );
}

/** The booking flow: a topic, a day and a time, a name — and a confirmation. */
export function Booking({ still = false, annotate = false }: { still?: boolean; annotate?: boolean }) {
  const [topic, setTopic] = useState(still ? TOPICS[1] : "");
  const [day, setDay] = useState(still ? "14" : "");
  const [time, setTime] = useState(still ? "12:00" : "");
  const [done, setDone] = useState(false);
  const [name, setName] = useState("");
  if (done) {
    const d = DAYS.find((x) => x.n === day);
    return (
      <div className={`${s.root} ${s.booking}`}>
        <div className={s.confirm} role="status">
          <span className={s.tick} aria-hidden>
            ✓
          </span>
          <p className={s.h2}>You&apos;re booked{name ? `, ${name.split(" ")[0]}` : ""}.</p>
          <p>
            {d?.d} {d?.n} October at {time} · 20 minutes · {topic.toLowerCase()}
          </p>
          <p className={s.sample}>In the real site, a confirmation and a calendar invite arrive by email. This demo sends nothing.</p>
          <button
            type="button"
            className={s.secondary}
            onClick={() => {
              setDone(false);
              setTopic("");
              setDay("");
              setTime("");
            }}
          >
            Book another
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className={`${s.root} ${s.booking}${annotate ? ` ${s.annotated}` : ""}`}>
      <p className={s.h2}>Book a 20-minute call</p>
      <p className={`${s.step} ${s.annotationTarget}`}>
        {annotate ? <span className={s.annotationPin} aria-hidden>1</span> : null}
        <b>1</b> What would you like to talk about?
      </p>
      <div className={s.chips}>
        {TOPICS.map((t) => (
          <button key={t} type="button" aria-pressed={topic === t} onClick={() => setTopic(t)}>
            {t}
          </button>
        ))}
      </div>
      <p className={s.step}>
        <b>2</b> Pick a time <span className={s.tz}>· times in NZ time</span>
      </p>
      <div className={`${s.days} ${s.annotationTarget}`}>
        {annotate ? <span className={s.annotationPin} aria-hidden>2</span> : null}
        {DAYS.map((x) => (
          <button
            key={x.n}
            type="button"
            aria-pressed={day === x.n}
            onClick={() => {
              setDay(x.n);
              setTime("");
            }}
          >
            <span>{x.d}</span>
            <b>{x.n}</b>
          </button>
        ))}
      </div>
      <div className={s.slots} aria-live="polite">
        {day ? (
          SLOTS[day].map((t) => (
            <button key={t} type="button" aria-pressed={time === t} onClick={() => setTime(t)}>
              {t}
            </button>
          ))
        ) : (
          <p className={s.hint}>Choose a day to see open times.</p>
        )}
      </div>
      <p className={s.step}>
        <b>3</b> Your details
      </p>
      <div className={s.fields}>
        <label>
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        </label>
        <label>
          <span>Email</span>
          <input type="email" placeholder="you@business.example" />
        </label>
      </div>
      <button type="button" className={`${s.primary} ${s.annotationTarget}`} disabled={!topic || !day || !time} onClick={() => setDone(true)}>
        {annotate ? <span className={s.annotationPin} aria-hidden>3</span> : null}
        {topic && day && time ? `Confirm ${DAYS.find((x) => x.n === day)?.d} ${day} at ${time}` : "Choose a topic and a time"}
      </button>
    </div>
  );
}

export function Practice({ screen = "home" }: { screen?: PracticeScreen }) {
  const [at, setAt] = useState<PracticeScreen>(screen);
  const go = (next: PracticeScreen) => setAt(next);
  return (
    <div className={s.root}>
      <Header go={go} />
      {at === "home" ? <Home go={go} /> : null}
      {at === "service" ? <Service go={go} /> : null}
      {at === "booking" ? (
        <section className={s.page}>
          <p className={s.crumb}>
            <button type="button" onClick={() => go("home")}>
              Home
            </button>{" "}
            / Book a call
          </p>
          <Booking />
        </section>
      ) : null}
    </div>
  );
}
