import { H2, Callout, Check, Compare, Figure, Cite } from "@/components/blog/Prose";
import { Routes } from "@/components/blog/Diagrams";

export const toc = [
  { id: "what-it-saves", title: "What “connected” saves" },
  { id: "common", title: "The common connections" },
  { id: "three-ways", title: "Three ways to connect" },
  { id: "field-map", title: "Mapping the data" },
  { id: "bookings", title: "Bookings: the details that trip people up" },
  { id: "consent", title: "Consent and privacy" },
  { id: "failure", title: "What breaks, and how you’ll know" },
  { id: "start-small", title: "Start with one connection" },
  { id: "checklist", title: "A checklist" },
];

export default function Body() {
  return (
    <>
      <p>
        A website, a CRM, a booking tool and an accounting package can each be good at their job and still make a lot of
        work, if a person has to carry information between them by hand. Connecting them means each detail is entered
        once — by the customer, usually — and arrives everywhere it is needed. This article covers what to connect, the
        ways to do it, and the parts that are easy to forget: consent, and knowing when a connection has quietly stopped
        working.
      </p>

      <H2 id="what-it-saves">What “connected” saves</H2>
      <ul>
        <li>
          <strong>Double entry.</strong> Every time someone retypes a name, an email address or a booking time, it costs
          minutes and invites mistakes. Across a year, the minutes add up to weeks.
        </li>
        <li>
          <strong>Lost leads.</strong> An enquiry that sits in an inbox until someone copies it into the CRM can wait days
          for a reply. One that lands in the CRM with a follow-up already assigned doesn’t.
        </li>
        <li>
          <strong>Arguments about which list is right.</strong> When the same customer exists in three places with three
          versions of their details, nobody trusts any of them.
        </li>
      </ul>

      <H2 id="common">The common connections</H2>
      <p>For most service businesses, a handful of connections do most of the work:</p>
      <Figure caption="Where each thing a customer does on the website should end up — and what happens when a connection fails.">
        <Routes
          rows={[
            { from: "Enquiry form", to: ["CRM: contact + enquiry", "Team alert"], note: "Assigned to a person, with a reply due." },
            { from: "Online booking", to: ["Staff calendar", "CRM: booking on the contact"], note: "Confirmation and reminder to the customer." },
            { from: "Online payment", to: ["Accounting: invoice marked paid"], note: "Receipt to the customer." },
            { from: "Newsletter sign-up", to: ["Email platform, with consent recorded"] },
          ]}
          failure={<p>If any step fails, a named person is told the same day — and the original submission is kept, so nothing is lost.</p>}
        />
      </Figure>

      <H2 id="three-ways">Three ways to connect</H2>
      <p>There are broadly three ways to join two systems, and most businesses end up using more than one:</p>
      <ul>
        <li>
          <strong>The tools’ own integrations.</strong> Many products connect to popular partners with a few clicks.
          When one exists and does what you need, start there: it is maintained by the people who make the tool.
        </li>
        <li>
          <strong>A connector service.</strong> General-purpose automation services pass information between hundreds of
          tools using rules you set up — “when a form is submitted, create a contact”. Quick to start, priced
          by volume, and easy to change, but the logic lives outside both systems and needs someone to look after it.
        </li>
        <li>
          <strong>A custom integration.</strong> Code written against each system’s official interface (its API).
          It costs more to build, but it can do exactly what your process needs, handle unusual cases, and report problems
          the way you want.
        </li>
      </ul>
      <Compare
        caption="The three ways to connect, compared"
        head={["", "The tools’ own", "Connector service", "Custom integration"]}
        rows={[
          ["Setup", "Minutes to hours", "Hours to days", "Days to weeks"],
          ["Cost", "Usually included", "Subscription, by volume", "A build, then hosting and support"],
          ["Flexibility", "What the tool offers", "Good, within its building blocks", "Whatever your process needs"],
          ["Who maintains it", "The tool’s maker", "Whoever set it up", "Whoever built it"],
          ["Best for", "Standard links between popular tools", "Simple rules, changing often", "Core processes, unusual cases, volume"],
        ]}
      />
      <p>
        Whichever you choose, use each system’s official, documented way in. Workarounds that copy data out of
        screens or emails break the first time the screen or email changes.
      </p>

      <H2 id="field-map">Mapping the data</H2>
      <p>
        Before anything is connected, write down which piece of information goes where. A field map is a simple table,
        and it settles most of the questions that otherwise surface as bugs: what if the name is one box on the form but
        two in the CRM? Which system wins when they disagree?
      </p>
      <Compare
        caption="An example field map: a website enquiry form into a CRM"
        head={["On the form", "In the CRM", "Notes"]}
        rows={[
          ["Your name", "First name + last name", "Split on the first space; keep the original too."],
          ["Email", "Email (the match key)", "If the email exists, update that contact; don’t create a second."],
          ["Phone", "Mobile", "Stored as typed; formatted for display."],
          ["What do you need?", "Enquiry type", "The form’s choices match the CRM’s list exactly."],
          ["Message", "Note on the enquiry", "Kept whole, never truncated."],
          ["(not on the form)", "Source: website form", "Set automatically, for reporting."],
          ["Keep me updated (unticked)", "Marketing consent + date + wording", "Only set when the person ticks it."],
        ]}
      />
      <Callout title="Decide which system is the source of truth">
        <p>
          For each kind of information — contact details, bookings, invoices — name one system as the master. The others
          read from it. Two-way syncing between systems that both think they’re in charge is where duplicates and
          overwrites come from.
        </p>
      </Callout>

      <H2 id="bookings">Bookings: the details that trip people up</H2>
      <p>
        Online booking is often the connection that saves the most time, and the one with the most small decisions. Settle
        these before it goes live:
      </p>
      <ul>
        <li>
          <strong>Whose calendar is the truth.</strong> If staff also book appointments by phone, every booking — online or
          not — has to land in the same calendar, or the website will offer times that are already taken.
        </li>
        <li>
          <strong>Time zones.</strong> Show times in New Zealand time and say so, especially if clients may be overseas or
          travelling; daylight saving changes are where mismatches usually appear.
        </li>
        <li>
          <strong>Gaps and limits.</strong> Travel or preparation time between appointments, how far ahead people can book,
          and the latest notice you’ll accept.
        </li>
        <li>
          <strong>Changes and cancellations.</strong> Whether people can move or cancel a booking themselves, until when,
          and what happens to the CRM record when they do.
        </li>
        <li>
          <strong>Confirmations and reminders.</strong> What the customer receives, from which address, and when — and
          that a reply to that email reaches a person.
        </li>
      </ul>

      <H2 id="consent">Consent and privacy</H2>
      <p>
        Connecting systems spreads personal information further, so it is worth being careful about what you collect and
        what you do with it.
      </p>
      <ul>
        <li>
          <strong>Tell people what happens to their details.</strong> Under the Privacy Act 2020, information privacy
          principle 3 expects people to be made aware, when you collect their information, of the fact it is being
          collected, why, who will receive it, and their rights to access and correct it.
          <Cite n={1} /> A short line next to the form, linking to your privacy policy, covers most of this.
        </li>
        <li>
          <strong>Marketing needs consent.</strong> The Department of Internal Affairs sums up the Unsolicited Electronic
          Messages Act 2007 in three steps for commercial messages: send them only with consent (express, inferred or
          deemed), clearly identify who sent them and how to contact you, and include a working unsubscribe — honouring
          requests within five working days.
          <Cite n={2} /> So an enquiry is not a newsletter sign-up: record marketing consent separately, with the date and
          the wording the person agreed to, and connect unsubscribes back to the CRM.
        </li>
        <li>
          <strong>Keep it safe on every system.</strong> Principle 5 asks for reasonable security safeguards wherever
          personal information is held, including when a service provider holds it for you.
          <Cite n={3} /> Each connected tool is one more place to secure: individual logins, two-step sign-in, and access
          only for the people who need it.
        </li>
        <li>
          <strong>Collect only what you need.</strong> Every field you add to a form is information you are then
          responsible for, in every system it flows into.
        </li>
      </ul>

      <H2 id="failure">What breaks, and how you’ll know</H2>
      <p>
        Connections rarely fail loudly. They stop, and nobody notices until a customer asks why no one called back. The
        usual causes:
      </p>
      <ul>
        <li>A password or access key expires, or the person whose account the connection used leaves.</li>
        <li>Someone renames a field, adds a required one, or changes a list of choices in one system.</li>
        <li>A service limits how many requests it accepts, and a busy day goes over.</li>
        <li>The same person submits twice, and the connection creates two contacts.</li>
      </ul>
      <p>The protections are not complicated, but they have to be designed in:</p>
      <ul>
        <li>
          <strong>Keep the original.</strong> Every submission is stored before it’s passed on, so a failed hand-off
          can be replayed rather than lost.
        </li>
        <li>
          <strong>Retry, then alert.</strong> Temporary failures are retried automatically; anything that still fails is
          sent to a named person, not to a log nobody reads.
        </li>
        <li>
          <strong>Run connections on a business account</strong>, not on one employee’s login.
        </li>
        <li>
          <strong>A weekly glance.</strong> Compare the number of form submissions with the number of new CRM enquiries.
          If they don’t match, something is wrong.
        </li>
      </ul>

      <H2 id="start-small">Start with one connection</H2>
      <p>
        It is tempting to connect everything at once. It is usually better to connect the one thing that costs the most
        time today — often enquiries into the CRM — run it for a few weeks, and fix what turns up. Each connection after
        that is easier, because the field map, the alerts and the habit of checking already exist.
      </p>
      <p>
        Before you start, count how long the manual version takes in a typical week. After a month, count again. That is
        the only honest measure of what the connection was worth, and it tells you which one to do next.
      </p>

      <H2 id="checklist">A checklist</H2>
      <Check
        items={[
          "Each kind of information has one system that is its source of truth.",
          "A written field map for every connection, agreed before building.",
          "Official integrations or documented APIs only — no screen-scraping.",
          "Connections run on business accounts, with two-step sign-in.",
          "Every submission stored before it is passed on.",
          "Failures retried, then reported to a named person.",
          "Marketing consent recorded separately, with date and wording; unsubscribes flow back.",
          "A privacy notice by every form, saying what happens to the details.",
          "A weekly check that the numbers match.",
        ]}
      />
    </>
  );
}
