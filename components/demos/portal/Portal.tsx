"use client";

import { useState } from "react";
import s from "./portal.module.css";

/**
 * STUDIO DEMONSTRATION — an operations and client portal for a fictional
 * building-maintenance company, "Kerrow". The team sees every job; a client
 * sees their own, approves quotes and pays invoices. Both views share one
 * state, so approving a quote as the client moves the job on the team's
 * board. Sample data only; nothing is sent anywhere.
 */
export type PortalView = "team" | "client";

type Status = "In progress" | "Scheduled" | "Awaiting approval" | "Approved" | "Awaiting parts" | "Done";
type Job = { id: string; title: string; client: string; site: string; status: Status; who: string; due: string };

const JOBS: Job[] = [
  { id: "J-2041", title: "Leaking skylight", client: "Harbour View Apartments", site: "Unit 4B", status: "In progress", who: "Tomas", due: "Today" },
  { id: "J-2038", title: "Replace fire-door closer", client: "Northside Medical", site: "Level 1 stairwell", status: "Scheduled", who: "Priya", due: "Thu" },
  { id: "J-2035", title: "Repaint exterior handrails", client: "Harbour View Apartments", site: "Front entrance", status: "Awaiting approval", who: "—", due: "—" },
  { id: "J-2031", title: "Heat pump service", client: "Kōwhai Kindergarten", site: "Main room", status: "Awaiting parts", who: "Tomas", due: "Next week" },
  { id: "J-2027", title: "Clear gutters", client: "Northside Medical", site: "Roof", status: "Done", who: "Priya", due: "Mon" },
];

const TONE: Record<Status, string> = {
  "In progress": s.tBlue,
  Scheduled: s.tGrey,
  "Awaiting approval": s.tAmber,
  Approved: s.tGreen,
  "Awaiting parts": s.tAmber,
  Done: s.tGreen,
};

function Chip({ status }: { status: Status }) {
  return <span className={`${s.chip} ${TONE[status]}`}>{status}</span>;
}

function JobDetail({ job, back }: { job: Job; back: () => void }) {
  const steps = ["Requested", "Quoted", "Approved", "Scheduled", "In progress", "Complete"];
  const at =
    job.status === "Done"
      ? 5
      : job.status === "In progress"
        ? 4
        : job.status === "Scheduled" || job.status === "Awaiting parts"
          ? 3
          : job.status === "Approved"
            ? 2
            : 1;
  return (
    <div className={s.detail}>
      <button type="button" className={s.back} onClick={back}>
        ← All jobs
      </button>
      <div className={s.detailHead}>
        <div>
          <p className={s.muted}>
            {job.id} · {job.client}
          </p>
          <p className={s.h}>{job.title}</p>
          <p className={s.muted}>{job.site}</p>
        </div>
        <Chip status={job.status} />
      </div>
      <ol className={s.timeline}>
        {steps.map((st, i) => (
          <li key={st} data-state={i < at ? "done" : i === at ? "now" : undefined}>
            <span />
            {st}
          </li>
        ))}
      </ol>
      <div className={s.detailGrid}>
        <section className={s.panel}>
          <p className={s.panelH}>Checklist</p>
          <ul className={s.check}>
            <li data-done="">Isolate and inspect</li>
            <li data-done="">Photos before work</li>
            <li data-done={at >= 4 ? "" : undefined}>Repair and seal</li>
            <li data-done={at >= 5 ? "" : undefined}>Photos after, client sign-off</li>
          </ul>
        </section>
        <section className={s.panel}>
          <p className={s.panelH}>Notes</p>
          <p className={s.note}>
            <b>{job.who === "—" ? "Office" : job.who}</b> · Access through the side gate; the tenant is home after 2pm.
          </p>
          <div className={s.photos}>
            <span>Before</span>
            <span>After</span>
          </div>
        </section>
      </div>
    </div>
  );
}

export function Portal({ view: initial = "team" }: { view?: PortalView }) {
  const [view, setView] = useState<PortalView>(initial);
  const [jobs, setJobs] = useState(JOBS);
  const [open, setOpen] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const approved = jobs.find((j) => j.id === "J-2035")?.status === "Approved";
  const approve = () => setJobs((js) => js.map((j) => (j.id === "J-2035" ? { ...j, status: "Approved", due: "Next week" } : j)));
  const job = jobs.find((j) => j.id === open);
  const count = (st: Status) => jobs.filter((j) => j.status === st).length;

  return (
    <div className={s.root}>
      <div className={s.side}>
        <p className={s.logo}>
          <b>K</b> Kerrow
        </p>
        <div className={s.sideNav} role="group" aria-label="Demo portal sections">
          {(view === "team" ? ["Overview", "Jobs", "Schedule", "Clients", "Invoices"] : ["My jobs", "Quotes", "Invoices", "Messages"]).map((n, i) => (
            <span key={n} data-on={i === (view === "team" ? 1 : 0) || undefined}>
              {n}
            </span>
          ))}
        </div>
        <div className={s.switch} role="group" aria-label="Whose view">
          <button type="button" aria-pressed={view === "team"} onClick={() => setView("team")}>
            Team
          </button>
          <button
            type="button"
            aria-pressed={view === "client"}
            onClick={() => {
              setView("client");
              setOpen(null);
            }}
          >
            Client
          </button>
        </div>
      </div>

      <div className={s.main}>
        {view === "team" ? (
          job ? (
            <JobDetail job={job} back={() => setOpen(null)} />
          ) : (
            <>
              <div className={s.top}>
                <p className={s.h}>Jobs</p>
                <span className={s.search}>Search jobs, clients, sites…</span>
              </div>
              <div className={s.stats}>
                <div>
                  <b>{jobs.filter((j) => j.status !== "Done").length}</b>
                  <span>Open</span>
                </div>
                <div>
                  <b>{count("In progress") + count("Scheduled")}</b>
                  <span>This week</span>
                </div>
                <div>
                  <b>{count("Awaiting approval")}</b>
                  <span>Awaiting approval</span>
                </div>
                <div>
                  <b>{count("Awaiting parts")}</b>
                  <span>Waiting on parts</span>
                </div>
              </div>
              <div className={s.table}>
                <div className={s.thead} aria-hidden>
                  <span>Job</span>
                  <span>Client · site</span>
                  <span>Status</span>
                  <span>Who</span>
                  <span>Due</span>
                </div>
                {jobs.map((j) => (
                  <button
                    key={j.id}
                    type="button"
                    className={s.row}
                    aria-label={`${j.title}, ${j.client}, ${j.status}. Open the job.`}
                    onClick={() => setOpen(j.id)}
                    data-flash={j.id === "J-2035" && approved ? "" : undefined}
                  >
                    <span>
                      <b>{j.title}</b>
                      <em>{j.id}</em>
                    </span>
                    <span>
                      {j.client}
                      <em>{j.site}</em>
                    </span>
                    <span>
                      <Chip status={j.status} />
                    </span>
                    <span>{j.who}</span>
                    <span>{j.due}</span>
                  </button>
                ))}
              </div>
            </>
          )
        ) : (
          <>
            <div className={s.top}>
              <p className={s.h}>Harbour View Apartments</p>
              <span className={s.muted}>Signed in as the building manager</span>
            </div>
            <section className={`${s.panel} ${s.ask}`}>
              {approved ? (
                <p className={s.approved} role="status">
                  <span aria-hidden>✓</span> Quote Q-1187 approved. We&apos;ll schedule the work and let you know the date.
                </p>
              ) : (
                <>
                  <p className={s.panelH}>Waiting for your approval</p>
                  <div className={s.quote}>
                    <div>
                      <b>Q-1187 · Repaint exterior handrails</b>
                      <span className={s.muted}>Front entrance · two coats, rust treatment first · sample figures</span>
                    </div>
                    <b className={s.amount}>$2,480 + GST</b>
                  </div>
                  <div className={s.askBtns}>
                    <button type="button" className={s.btn} onClick={approve}>
                      Approve quote
                    </button>
                  </div>
                </>
              )}
            </section>
            <div className={s.clientGrid}>
              <section className={s.panel}>
                <p className={s.panelH}>Your jobs</p>
                <ul className={s.list}>
                  {jobs
                    .filter((j) => j.client === "Harbour View Apartments")
                    .map((j) => (
                      <li key={j.id}>
                        <span>
                          <b>{j.title}</b>
                          <em>{j.site}</em>
                        </span>
                        <Chip status={j.status} />
                      </li>
                    ))}
                </ul>
              </section>
              <section className={s.panel}>
                <p className={s.panelH}>Invoices</p>
                <ul className={s.list}>
                  <li>
                    <span>
                      <b>INV-3301</b>
                      <em>Blocked drain, Unit 2A</em>
                    </span>
                    <span className={`${s.chip} ${s.tGreen}`}>Paid</span>
                  </li>
                  <li>
                    <span>
                      <b>INV-3309</b>
                      <em>Due 30 October · $1,180</em>
                    </span>
                    {paid ? (
                      <span className={`${s.chip} ${s.tGreen}`}>Paid</span>
                    ) : (
                      <button type="button" className={s.pay} onClick={() => setPaid(true)}>
                        Pay
                      </button>
                    )}
                  </li>
                </ul>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
