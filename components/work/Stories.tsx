import type { CSSProperties, ReactNode } from "react";
import { BrowserFrame, PhoneFrame } from "@/components/demos/Frames";
import { Practice, Booking } from "@/components/demos/practice/Practice";
import { Portal } from "@/components/demos/portal/Portal";
import { EnquiryDesk } from "@/components/demos/enquiry/EnquiryDesk";
import type { Project } from "@/content/work";

/** The working demonstration, large, at the top of its case study. */
export function Stage({ p }: { p: Project }) {
  const label = `${p.client} — a working studio demonstration`;
  return (
    <BrowserFrame url={p.url} label={label} style={{ "--dev-h": "700px" } as CSSProperties}>
      {p.slug === "practice-website" ? <Practice /> : null}
      {p.slug === "operations-portal" ? <Portal /> : null}
      {p.slug === "enquiry-desk" ? <EnquiryDesk /> : null}
    </BrowserFrame>
  );
}

function Cap({ n, children }: { n: string; children: ReactNode }) {
  return (
    <figcaption className="cs-cap">
      <b>{n}</b>
      <span>{children}</span>
    </figcaption>
  );
}

/** The visual story: the same live component seen another way, with what to notice. */
export function Story({ p }: { p: Project }) {
  if (p.slug === "practice-website") {
    return (
      <>
        <div className="cs-views">
          <figure data-rv>
            <BrowserFrame url={`${p.url}/services/tax`} label="The Tarn & Wick service page, on a desktop">
              <Practice screen="service" />
            </BrowserFrame>
            <Cap n="01">A service page: what&apos;s included, and the dates that matter, beside one way to start.</Cap>
          </figure>
          <figure data-rv>
            <PhoneFrame label="The Tarn & Wick home page, on a phone">
              <Practice />
            </PhoneFrame>
            <Cap n="02">The same site on a phone — one column, and the call to action first.</Cap>
          </figure>
        </div>
        <figure className="cs-close" data-rv>
          <div className="cs-close-shot">
            <Booking still annotate />
          </div>
          <figcaption>
            <ol className="cs-notes">
              <li>
                <span>1</span>
                <p>Three steps, in the order people decide: why, when, who. Nothing is asked before it is needed.</p>
              </li>
              <li>
                <span>2</span>
                <p>The sample availability offers specific times, and says which time zone they are in.</p>
              </li>
              <li>
                <span>3</span>
                <p>The button says exactly what will happen — the day and time — before anyone presses it.</p>
              </li>
            </ol>
          </figcaption>
        </figure>
      </>
    );
  }
  if (p.slug === "operations-portal") {
    return (
      <div className="cs-views">
        <figure data-rv>
          <BrowserFrame url={`${p.url}/client`} label="The Kerrow portal, as a client sees it">
            <Portal view="client" />
          </BrowserFrame>
          <Cap n="01">The client&apos;s view: what&apos;s waiting for them, what&apos;s happening and what they owe — one button each.</Cap>
        </figure>
        <figure data-rv>
          <PhoneFrame label="The Kerrow job board, on a technician's phone">
            <Portal view="team" />
          </PhoneFrame>
          <Cap n="02">The team&apos;s board on a technician&apos;s phone: the same jobs, one column.</Cap>
        </figure>
      </div>
    );
  }
  return (
    <div className="cs-views">
      <figure data-rv>
        <BrowserFrame url={`${p.url}/inbox`} label="The Pellow enquiry desk, a reply waiting for approval">
          <EnquiryDesk start="move" startStep={3} />
        </BrowserFrame>
        <Cap n="01">A change of appointment: found in the diary, drafted in the clinic&apos;s words, waiting for a person to approve.</Cap>
      </figure>
      <figure data-rv>
        <PhoneFrame label="The Pellow enquiry desk, an urgent enquiry handed to a person">
          <EnquiryDesk start="urgent" startStep={2} />
        </PhoneFrame>
        <Cap n="02">The limit: a possible urgent symptom goes straight to a person. Nothing is drafted.</Cap>
      </figure>
    </div>
  );
}
