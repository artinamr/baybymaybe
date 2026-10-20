import { PAGES } from "@/lib/content";
import { H2, H3, Callout, Check, Compare, Steps, Cite } from "@/components/blog/Prose";
import { Term } from "@/components/blog/Term";

export const toc = [
  { id: "what-it-saves", title: "What connecting means, and what it saves" },
  { id: "common", title: "The connections that usually come first" },
  { id: "three-ways", title: "Three ways to connect, and what each costs" },
  { id: "field-map", title: "Map the data before anything is built" },
  { id: "bookings", title: "Bookings: the details that trip people up" },
  { id: "consent", title: "Consent, privacy and keeping it safe" },
  { id: "failure", title: "What breaks, and how you’ll know" },
  { id: "start-small", title: "Start with one connection" },
  { id: "checklist", title: "The connection checklist" },
  { id: "yours", title: "How we’d look at yours" },
];

export default function Body() {
  return (
    <>
      <p>
        Start with the details your team types more than once. An enquiry can go from the website into your{" "}
        <Term id="crm">CRM</Term> (customer relationship management system), or a booking into the calendar staff use,
        without anyone retyping it. The work is deciding which system holds the truth for each detail, what
        consent you need, and who is told when a connection stops.
      </p>

      <H2 id="what-it-saves">What connecting means, and what it saves</H2>
      <p>
        A connection, or <Term id="integration">integration</Term>, passes details from one system to another when
        something happens, such as a form being sent or a booking made.
      </p>
      <p>
        To see where one would help, note every time someone copies a detail across in an ordinary week (inbox to CRM,
        booking app to calendar, payment notice to accounts), roughly how long it takes and what goes wrong when it’s
        missed.
      </p>
      <p>
        The list shows where double entry costs time, where it costs customers (an enquiry left in an inbox can go days
        without a reply) and where one customer has three different records.
      </p>
      <Callout title="When it isn’t worth connecting">
        <p>
          If someone copies a handful of enquiries a week in a few minutes, a connection may cost more to look after than
          it saves. Connect where the volume or the mistakes are real and the steps are the same each time. If it’s
          client paperwork going back and forth, a{" "}
          <a href={PAGES.article("when-you-need-a-client-portal")}>client portal</a> may suit better.
        </p>
      </Callout>

      <H2 id="common">The connections that usually come first</H2>
      <p>For most service businesses, a handful of connections do most of the work:</p>
      <Compare
        caption="The usual first connections, as a plan to copy"
        head={["When this happens", "What moves", "Where it goes", "Who’s told if it fails"]}
        rows={[
          ["Someone sends the enquiry form", "Name, email, mobile, need, message, source", "CRM: new or existing contact, plus an enquiry", "Office manager, same day"],
          ["Someone books online", "Name, email, mobile, service, time", "The one calendar staff use, and the contact in the CRM", "Reception, within the hour"],
          ["A customer pays online", "Amount, invoice number, date", "Accounts: invoice marked paid", "Whoever does the accounts"],
          ["Someone signs up for the newsletter", "Name, email, consent wording and date", "Email platform", "Whoever sends the newsletter"],
        ]}
      />
      <p>
        Often the best first step isn’t a connection at all. If your business software has its own booking page or
        enquiry form, use it: the details land where they belong, with nothing in between to break.
      </p>

      <H2 id="three-ways">Three ways to connect, and what each costs</H2>
      <p>There are broadly three ways to join two systems, and most businesses use more than one.</p>
      <ul>
        <li>
          <strong>The tools’ own integrations.</strong> Many products connect to popular partners in a few clicks. If one
          does what you need, start there: its maker maintains it.
        </li>
        <li>
          <strong>A connector service.</strong> Zapier and services like it pass information between tools by rules you
          set, such as “when the form is sent, create a contact”. It’s quick to start and easy to change, but the logic
          lives outside both systems and needs looking after.
        </li>
        <li>
          <strong>A custom integration.</strong> Code written against each system’s official interface, its{" "}
          <Term id="api">API</Term>. It costs more to build, but fits your process exactly, handles unusual cases and
          reports problems your way.
        </li>
      </ul>
      <Compare
        caption="The three ways to connect, compared"
        head={["", "The tools’ own", "Connector service", "Custom integration"]}
        rows={[
          ["Setup", "Minutes to hours", "Hours to days", "Days to weeks"],
          ["Running cost", "Depends on your plan", "A subscription, often priced by use", "Hosting and support"],
          ["Runs on", "Your account in the tool", "A connector account the business owns", "Access keys issued to the business"],
          ["Best for", "Standard links between popular tools", "Simple rules that change often", "Core processes, unusual cases, volume"],
        ]}
      />
      <p>
        Whichever you choose, use each system’s documented way in: workarounds that copy data out of screens or emails
        break when the screen or email changes.
      </p>
      <H3>What it costs</H3>
      <p>
        For a tool’s own integration, check which plan includes it. A connector service such as Zapier charges by use:
        it counts each successful action as a task,
        <Cite n={1} /> and prices its plans by how many tasks you need.<Cite n={2} /> So count the actions one enquiry
        needs (a contact and a follow-up is two) and multiply by a busy month.
      </p>
      <p>In every case, weigh the time it takes to look after against the hours it saves.</p>

      <H2 id="field-map">Map the data before anything is built</H2>
      <p>
        Then write down which piece of information goes where. A <Term id="field-map">field map</Term> is a simple
        table, and it settles questions that otherwise turn up as bugs: what if the name is one box on the form but two
        in the CRM? Which system wins when they disagree?
      </p>
      <Compare
        caption="An example field map: a website enquiry form into a CRM"
        head={["On the form", "In the CRM", "Notes"]}
        rows={[
          ["Your name", "Full name", "Keep it as entered; ask separately if the CRM needs first and last names."],
          ["Email", "Email (the match key)", "If the email exists, update that contact; don’t create a second."],
          ["What do you need?", "Enquiry type", "The form’s choices match the CRM’s list exactly."],
          ["Message", "Note on the enquiry", "Kept whole, never cut short."],
          ["(not on the form)", "Source: website form", "Set automatically, for reporting."],
          ["Keep me updated (unticked)", "Marketing consent, date and wording", "Set only when the person ticks it."],
        ]}
      />
      <p>
        Check how your CRM matches records. HubSpot, for example, matches contacts by email address, but company records
        created through its API, including by sync apps, aren’t matched by domain name, so they can double up.
        <Cite n={3} />
      </p>
      <Callout title="Name one master for each detail">
        <p>
          For each kind of information (contacts, bookings, invoices), decide which system is the{" "}
          <Term id="source-of-truth">source of truth</Term>. The others read from it. Two-way syncing between systems
          that both think they’re in charge breeds duplicates and overwrites. Check, too, that you can get your data out
          of each master.
        </p>
      </Callout>

      <H2 id="bookings">Bookings: the details that trip people up</H2>
      <p>Settle these before online booking goes live.</p>
      <ul>
        <li>
          <strong>One calendar is the truth.</strong> Calendly, for example, checks your calendar for busy times and adds
          new meetings to it.<Cite n={4} /> So a phone booking missing from that calendar looks like a free slot: every
          booking, online or not, has to land there.
        </li>
        <li>
          <strong>New Zealand time, all year.</strong> Show times in New Zealand time and say so. Daylight saving starts
          at 2am on the last Sunday in September and ends at 3am on the first Sunday in April.<Cite n={5} /> Test a
          booking across each change, and one made from overseas.
        </li>
        <li>
          <strong>Public holidays.</strong> Block them before they fill. Matariki’s date varies from year to year, and
          each region has its own anniversary day.<Cite n={6} />
        </li>
        <li>
          <strong>Changes and cancellations.</strong> Whether people can move or cancel themselves and until when, and
          what happens to the CRM record when they do.
        </li>
        <li>
          <strong>Confirmations and reminders.</strong> What the customer receives, from which address and when, and
          that a reply reaches a person. Under the{" "}
          <Term id="uema">Unsolicited Electronic Messages Act 2007</Term>, a message that confirms or helps complete a
          booking the person made isn’t a commercial message, and nor is a quote they asked for.<Cite n={7} /> So
          neither needs marketing consent. Keep offers out of them.
        </li>
      </ul>

      <H2 id="consent">Consent, privacy and keeping it safe</H2>
      <ul>
        <li>
          <strong>Tell people what happens to their details.</strong> Under the{" "}
          <Term id="privacy-act">Privacy Act 2020</Term>, information privacy principle 3 expects people to be made
          aware, when you collect their information, of the fact it is being collected, why, who will receive it, and
          their rights to access and correct it.
          <Cite n={8} /> Put a clear privacy notice next to the form and link to the full details. Check that it explains
          who collects and holds the information, and what it will be used for.
        </li>
        <li>
          <strong>Details from someone else.</strong> Since May 2026, principle 3A also asks you to tell people when you
          collect their information from another source, such as a referral partner, unless an exception applies.
          <Cite n={9} />
        </li>
        <li>
          <strong>Marketing needs consent.</strong> The Department of Internal Affairs sums up the Unsolicited Electronic
          Messages Act 2007 in three steps for commercial messages: send them only with consent (express, inferred or
          deemed), clearly identify who sent them and how to contact you, and include a working unsubscribe, honouring
          requests within five working days.
          <Cite n={10} /> So an enquiry is not a newsletter sign-up: record marketing consent separately, with the date
          and the wording the person agreed to, and connect unsubscribes back to the CRM.
        </li>
        <li>
          <strong>Keep the proof.</strong> The Department adds that it’s up to the sender to prove consent, and advises
          confirming each sign-up in a second step (double opt-in).<Cite n={10} />
        </li>
      </ul>
      <H3>Keep it safe on every system</H3>
      <p>
        Principle 5 asks for security safeguards that are reasonable in the circumstances against loss and misuse, and,
        when you give the information to a service provider, for everything reasonably within your power to be done to
        stop it being used or disclosed without authorisation.<Cite n={11} /> For information you put in the cloud, the
        Privacy Commissioner says that in most circumstances you, not the cloud provider, are responsible for it.
        <Cite n={12} />
      </p>
      <p>
        Each connected tool is one more place to secure: individual logins, <Term id="two-factor">two-step sign-in</Term>,
        and access only for the people who need it.
      </p>

      <H2 id="failure">What breaks, and how you’ll know</H2>
      <p>
        Connections rarely fail loudly. They stop, and nobody notices until a customer asks why no one called back. The
        usual causes:
      </p>
      <ul>
        <li>A password or access key expires, or the person whose login the connection used leaves.</li>
        <li>Someone renames a field, adds a required one or changes a list of choices in one system.</li>
        <li>
          A service limits how many requests it accepts. Xero, for example, allows an app 60 calls a minute for each
          organisation, then refuses with a “too many requests” error.<Cite n={13} />
        </li>
        <li>
          The same thing arrives twice, or out of order. Stripe says its <Term id="webhook">webhooks</Term> can deliver
          the same event more than once, don’t guarantee the order, and keep retrying for up to three days when your end
          doesn’t answer.<Cite n={14} />
        </li>
        <li>
          A connector stops quietly. With autoreplay switched on, Zapier retries a failed step up to five times, and
          sends no error email until the last attempt fails.<Cite n={15} />
        </li>
      </ul>
      <p>Build these protections in:</p>
      <ul>
        <li>
          <strong>Keep the original.</strong> Store every submission before it’s passed on, so a failed hand-off can be
          replayed rather than lost.
        </li>
        <li>
          <strong>Retry, then alert a person.</strong> Temporary failures retry on their own; anything that still fails
          goes to a named person, not a log nobody reads.
        </li>
        <li>
          <strong>A weekly glance.</strong> Compare form submissions with new CRM enquiries, and online bookings with
          calendar entries. If they don’t match, something is wrong.
        </li>
      </ul>
      <H3>Test before it goes live</H3>
      <p>Try these on test records first.</p>
      <Check
        items={[
          "Send the form twice with the same email: you should get one contact, not two.",
          "Book, move and cancel a test appointment, and check every system shows each change.",
          "Book across a daylight saving change, and try to book on a public holiday.",
          "Rename a field in a test account, and see what fails and who hears about it.",
          "Switch the connection off for an hour, then back on: nothing should be lost.",
          "Tick the marketing box, then unsubscribe, and check the CRM agrees both times.",
        ]}
      />

      <H2 id="start-small">Start with one connection</H2>
      <p>
        Connect the one thing that costs the most time or customers today. Count how long the manual version takes in a
        typical week, run the connection for a few weeks, fix what turns up, then count again: that is the honest
        measure of its worth. The next one is easier, because the field map and the alerts already exist.
      </p>
      <H3>An example: a salon’s first connections</H3>
      <p>An illustration, not a real client: a hair salon in Nelson with four stylists and a receptionist.</p>
      <Steps
        items={[
          {
            t: "The week’s list",
            b: (
              <p>
                Enquiries are copied from the inbox into the salon software, online bookings retyped from a separate
                booking app, and card payments matched by hand in the accounts. Newsletter sign-ups sit in a spreadsheet.
              </p>
            ),
          },
          {
            t: "First, bookings, with no connection at all",
            b: (
              <p>
                A missed copy can mean a double booking, so this comes first. The salon switches to its software’s own
                booking page: one calendar, nothing to connect. Public holidays are blocked, and reminders carry no
                offers.
              </p>
            ),
          },
          {
            t: "Second, enquiries",
            b: (
              <p>
                A connector service now passes each website enquiry to the salon software as a client and a task for
                reception, using the field map above. The consent box starts unticked.
              </p>
            ),
          },
          {
            t: "Failures made loud",
            b: (
              <p>
                The website keeps a copy of every enquiry. Failures go to the reception inbox, and every Friday someone
                compares enquiries received with enquiries created.
              </p>
            ),
          },
          {
            t: "Count again after a month",
            b: <p>Time spent retyping, before and after. That answer decides whether payments come next.</p>,
          },
        ]}
      />

      <H2 id="checklist">The connection checklist</H2>
      <p>Use it before you build each connection, and again before you switch it on.</p>
      <Check
        items={[
          "A week’s list of what you retype, and how long it takes.",
          "One source of truth for each kind of information.",
          "A written plan and field map, agreed before anything is built.",
          "The tools’ own features first; documented ways in only, never screen-scraping.",
          "Connections on business accounts, with two-step sign-in.",
          "Every submission stored before it’s passed on.",
          "Failures retried, then reported to a named person.",
          "Tested with duplicates, changes, cancellations, daylight saving and public holidays.",
          "A privacy notice by every form.",
          "Marketing consent recorded separately, with the date and wording; unsubscribes flow back.",
          "A weekly check that the numbers match.",
        ]}
      />

      <H2 id="yours">How we’d look at yours</H2>
      <p>
        Joining a website to the systems behind it is the everyday work of our{" "}
        <a href={PAGES.service("platforms")}>platforms service</a>. For the free audit, tell us which tools you use and
        where your team copies information between them. We’ll suggest the first connection to investigate and what it
        needs to handle.
      </p>
    </>
  );
}
