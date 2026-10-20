import { H2, H3, Callout, Steps, Check, Figure, Cite } from "@/components/blog/Prose";
import { Routes, DecisionTree } from "@/components/blog/Diagrams";
import { Term } from "@/components/blog/Term";
import { PAGES } from "@/lib/content";

export const toc = [
  { id: "what-it-is", title: "What a portal is (and isn’t)" },
  { id: "signals", title: "Five signals, and how to count them" },
  { id: "off-the-shelf", title: "Off the shelf, or custom?" },
  { id: "first-version", title: "What the first version should do" },
  { id: "security", title: "Security and privacy basics" },
  { id: "running", title: "What it takes to keep it running" },
  { id: "did-it-work", title: "Judging whether it worked" },
  { id: "example", title: "An example: a property manager’s office" },
  { id: "yours", title: "How we’d look at yours" },
];

export default function Body() {
  return (
    <>
      <p>
        A client portal is worth it when routine updates, document chasing and approvals fill your inbox every week.
        Before paying for one, count those signals for two weeks, then check whether software you already use has a
        client area you can switch on. Build a custom portal only when your work has stages no product can show.
      </p>

      <H2 id="what-it-is">What a portal is (and isn’t)</H2>
      <p>
        A client portal is a private place, behind a login, where each client sees their own work with you: what’s
        happening, what they need to send, what needs their approval and what they owe. Your team sees the same records
        from the other side, for every client at once.
      </p>
      <p>
        It doesn’t replace talking to people. It takes the routine traffic out of email (status, documents, approvals,
        invoices), so when you do talk, it’s about something that needs a person.
      </p>
      <Figure caption="What moves out of the inbox: each routine exchange gets one place to live.">
        <Routes
          rows={[
            { from: "“Any update on our job?”", to: ["The job’s page: status and next step"] },
            { from: "A document by email", to: ["Uploaded to the job, versioned"] },
            { from: "A quote to approve", to: ["Approved in one click, with a record"] },
            { from: "An invoice to chase", to: ["Paid online", "Accounts updated"] },
          ]}
          failure={<p>Anything unusual still goes to a person. The portal just says who, and keeps the history.</p>}
        />
      </Figure>

      <H2 id="signals">Five signals, and how to count them</H2>
      <H3>1. The same status question, every day</H3>
      <p>
        If clients keep asking where things are, the information exists but lives where they can’t see it. A status page
        each client can check removes the question instead of answering it faster.
      </p>
      <H3>2. Chasing documents</H3>
      <p>
        Work waits on a client’s file while your team sends reminders, then finds and renames the attachments. One place
        to upload, with a list of what’s missing, shows clients what you need without anyone asking.
      </p>
      <H3>3. Approvals buried in threads</H3>
      <p>
        “Yes, go ahead” at the bottom of a long thread is a weak record of what was agreed. A portal shows exactly what
        was approved, by whom and when.
      </p>
      <H3>4. Typing the same details twice</H3>
      <p>
        Job details arrive by email, go into a spreadsheet, then into the accounting software. Every copy is a chance for
        a mistake. A portal <a href={PAGES.article("connect-website-crm-booking")}>connected to your other systems</a>{" "}
        lets each detail be entered once.
      </p>
      <H3>5. Requests after hours</H3>
      <p>
        A client checking something at nine at night either waits until morning or emails you. Letting them look it up,
        book or pay then helps you both.
      </p>
      <H3>How to count them</H3>
      <p>
        For two weeks, keep a tally: a column for each signal, a mark each time it happens, and roughly how long it took.
        The tally is also your baseline for judging whether a portal worked.
      </p>
      <p>
        One signal, or signals that only show up in your busiest season, can usually be fixed with a better process.
        Three or more, every week, and a portal is worth pricing.
      </p>

      <H2 id="off-the-shelf">Off the shelf, or custom?</H2>
      <p>There are four answers, and the cheapest comes first.</p>
      <Figure caption="Answer from the top, and stop at your first “no”.">
        <DecisionTree
          steps={[
            {
              q: "Do three or more of the signals turn up every week?",
              no: {
                t: "Fix the process first",
                b: "A shared folder for each client, a standard update email and one person who owns the replies.",
              },
            },
            {
              q: "Have you ruled out a client area in software you already pay for?",
              no: { t: "Switch on what you have", b: "Try its client area with a few friendly clients for a month." },
            },
            {
              q: "Have you ruled out the products made for your kind of work?",
              no: { t: "Subscribe", b: "Choose one that fits your stages and budget, after the checks below." },
            },
          ]}
          end={{
            t: "Scope a custom first version",
            b: "The smallest portal that removes the most email, under a contract that gives you the code and your data.",
          }}
        />
      </Figure>
      <H3>Before you subscribe: the checks</H3>
      <p>
        Own Your Online, from the National Cyber Security Centre (NCSC), suggests questions to ask before you rely on{" "}
        <Term id="off-the-shelf">off-the-shelf software</Term>.<Cite n={1} /> With New Zealand’s rules added:
      </p>
      <Check
        items={[
          <>Can it show your stages and a quote waiting for approval, not just files and messages?</>,
          <>
            Can each person, staff and client, have their own login, with{" "}
            <Term id="two-factor">two-factor sign-in</Term>?<Cite n={1} />
          </>,
          <>
            Can you set roles, so clients see only their own work and staff only what they need?<Cite n={1} />
          </>,
          <>
            Can you see what it stores, export all of it in a usable form, and delete it?<Cite n={1} />
          </>,
          <>
            Where is the data held? Even if it’s overseas, the Privacy Commissioner says that in most circumstances
            you’ll be responsible for the personal information you put in the cloud, not the provider.<Cite n={2} />
          </>,
          <>
            Will it hold invoices or other business records? Inland Revenue says records stored offshore, including in
            the cloud, need its approval, held by you or the provider.<Cite n={3} /> Ask the provider.
          </>,
          <>
            Do you hold health information? For the health sector, the Health Information Privacy Code 2020 takes the
            place of the privacy principles,<Cite n={4} /> so check the product against the code.
          </>,
          <>What will it cost in three years at your size: per user, per client or flat?</>,
          <>What happens to your data, and your clients’ logins, if you cancel?</>,
        ]}
      />
      <H3>If you build, make sure you own it</H3>
      <p>
        Custom earns its cost when your work doesn’t fit the tools: stages no product models, several systems the portal
        must join up, or a client experience that is part of what you sell.
      </p>
      <p>
        Under the Copyright Act 1994, a business that commissions, and pays or agrees to pay for, a computer program is
        the first owner of its copyright, but only “subject to any agreement to the contrary”.<Cite n={5} /> A
        development contract can be that agreement.
      </p>
      <p>
        Read its intellectual property clause, get the code and your data in a form another developer can work on, and
        ask a lawyer if the portal is central to your business.
      </p>

      <H2 id="first-version">What the first version should do</H2>
      <p>
        A common mistake is to build everything at once. The first version should be the smallest thing that removes the
        most email. A sensible order:
      </p>
      <Steps
        items={[
          {
            t: "Accounts and each client’s list of work",
            b: <p>Each person signs in as themselves and sees their own jobs, nothing else.</p>,
          },
          {
            t: "Status, in your words",
            b: <p>One clear stage per job, the next step and who it’s waiting on, updated by your team as part of the work.</p>,
          },
          { t: "Documents both ways", b: <p>Upload, download, and a list of what’s still needed.</p> },
          {
            t: "Approvals with a record",
            b: <p>The quote or the change, approved in one step, with the name, the time and the exact version kept.</p>,
          },
          {
            t: "Then, and only then, the rest",
            b: (
              <p>
                Payments, messaging, scheduling and reports, once the first version is in daily use and you know which
                would help most.
              </p>
            ),
          },
        ]}
      />
      <p>
        Approvals deserve care. The Contract and Commercial Law Act 2017 presumes an electronic signature reliable
        enough when the means of signing is linked to the signer and nobody else, was under their control alone, and any
        later change to the signature is detectable.<Cite n={6} /> Build approvals the same way: individual logins,
        nobody approving for someone else, and a record nobody can quietly edit.
      </p>

      <H2 id="security">Security and privacy basics</H2>
      <p>
        Under New Zealand’s <Term id="privacy-act">Privacy Act 2020</Term>, principle 5 requires you to protect personal
        information with security safeguards that are reasonable in the circumstances, against loss, unauthorised
        access, use, modification or disclosure, and other misuse.<Cite n={7} /> For a portal, that means at least:
      </p>
      <Check
        items={[
          <>
            <strong>Individual accounts.</strong> Everyone signs in as themselves. No shared logins, for your team or for
            clients.
          </>,
          <>
            <strong>Two-factor sign-in.</strong> The NCSC calls enforcing multi-factor authentication the most critical
            control for preventing unauthorised access, especially for accounts reachable from anywhere on the internet,
            <Cite n={8} /> as a portal’s are. Codes sent by text or email can be intercepted, so Own Your Online advises
            authenticator apps, tokens or physical key fobs.<Cite n={9} /> Make it compulsory for staff and offer it to
            clients.
          </>,
          <>
            <strong>Access that follows the record.</strong> The failure that matters most in a portal is one client
            seeing another’s records. Broken access control tops the OWASP Top 10 of web application security risks,
            and its common examples include viewing or editing someone else’s account by supplying its identifier.
            OWASP’s advice: deny by default, except for public resources, and enforce who owns each record.
            <Cite n={10} /> Give staff only the access their job needs.<Cite n={8} />
          </>,
          <>
            <strong>A record of who did what.</strong> An audit trail of approvals, uploads and changes protects you and
            your clients when there’s a disagreement, and helps you notice when something is wrong.
          </>,
          <>
            <strong>A plan for a breach.</strong> If it’s reasonable to believe a{" "}
            <Term id="privacy-breach">privacy breach</Term> has caused serious harm, or is likely to, the Privacy Act
            requires you to notify the Privacy Commissioner as soon as practicable.<Cite n={11} /> The Commissioner’s
            guidance on timing: “Ideally you’ll do that within 72 hours after you’re aware that you have a notifiable
            breach, even if you’re still investigating it.” You also need to tell the people affected as soon as you
            can, unless an exception applies.<Cite n={12} /> Decide now who would make that call.
          </>,
        ]}
      />
      <Callout title="Collect less">
        <p>
          Principle 1 says to collect personal information only when it’s necessary for your purpose.<Cite n={11} /> The
          safest information is what you never stored. Before adding a field, ask whether you need it, and for how long.
        </p>
      </Callout>
      <H3>Before launch: the access test</H3>
      <p>Run these with two test clients and a test staff account, before any real client signs in.</p>
      <Check
        items={[
          <>
            Signed in as client A, try to open one of client B’s jobs by changing the number in the page address. It must
            refuse.
          </>,
          <>A removed staff member and a former client can’t sign in, and links they were sent no longer open files.</>,
          <>Every page and file asks for a login, unless it’s meant to be public.</>,
          <>An approval shows who, when and which version, and nobody can edit it afterwards.</>,
          <>A staff account can’t sign in without the second step.</>,
        ]}
      />

      <H2 id="running">What it takes to keep it running</H2>
      <p>
        When portals fail, it’s usually quietly: statuses stop being updated, clients learn the portal is out of date,
        and the emails come back. Plan the everyday side before launch.
      </p>
      <ul>
        <li>
          <strong>Updating it is part of the work.</strong> A job moves stage when someone approves, uploads or completes
          something. Where a person must update a status, make it one click from the screen they already use.
        </li>
        <li>
          <strong>Someone owns it.</strong> One person decides what’s shown, answers questions about it and notices when
          something looks wrong.
        </li>
        <li>
          <strong>Clients are shown where to look.</strong> A short welcome (what they’ll find, how to sign in, who to
          call), and a link in every email that used to carry the update. When clients still email, reply with the link.
        </li>
        <li>
          <strong>Leaving is planned too.</strong> When a client’s work ends, close their login. Keep invoices and other
          business records for at least seven tax years, as Inland Revenue asks,<Cite n={3} /> but don’t keep other
          personal information longer than you need it: that’s principle 9.<Cite n={11} />
        </li>
        <li>
          <strong>Running costs are written down.</strong> Hosting, the services it relies on and support, agreed before
          you commit, so the second year holds no surprises.
        </li>
      </ul>

      <H2 id="did-it-work">Judging whether it worked</H2>
      <p>
        Use your two-week tally as the baseline. After a couple of months of normal use, count the same things for
        another two weeks:
      </p>
      <ul>
        <li>Status questions by email or phone.</li>
        <li>How long an approval takes, from sending the quote to the go-ahead.</li>
        <li>How long documents take to arrive once requested.</li>
        <li>Hours spent copying details between systems.</li>
        <li>What clients say about it, unprompted.</li>
      </ul>
      <p>
        Measure it yourself rather than trusting a vendor’s case study. If the numbers haven’t moved, find out why before
        adding features: usually some of the work still happens outside the portal.
      </p>

      <H2 id="example">An example: a property manager’s office</H2>
      <p>
        An illustration, not a real client: a property management office in Dunedin, with two managers and an
        administrator.
      </p>
      <Steps
        items={[
          {
            t: "Count for two weeks",
            b: (
              <p>
                Owners ask about repairs and rent most days, signed forms and insurance papers are chased weekly, and
                repair quotes wait in long threads for an owner’s go-ahead. Each repair is typed into a spreadsheet, then
                the accounts. Four signals, every week.
              </p>
            ),
          },
          {
            t: "Check what they already pay for",
            b: (
              <p>
                Their property management software has an owner portal nobody has switched on. It shows statements and
                repairs, takes documents and lets owners approve quotes.
              </p>
            ),
          },
          {
            t: "Run the checks",
            b: (
              <p>
                They make two-factor sign-in compulsory for staff and offer it to owners, check they can export
                everything, and ask whether the provider has Inland Revenue’s approval to store records offshore.
              </p>
            ),
          },
          {
            t: "Try it small",
            b: (
              <p>
                Five owners who like trying new things use it for a month and say what’s missing. Then everyone is
                invited, and the standard emails link to the portal instead of carrying attachments.
              </p>
            ),
          },
          {
            t: "Count again",
            b: <p>After two months of normal use, they repeat the two-week tally and compare it with the first.</p>,
          },
        ]}
      />
      <p>
        They build nothing; the double typing waits for a connection between the two systems. Custom would make sense
        only if their work changed shape, or per-owner pricing outgrew their fees.
      </p>
      <H3>And one you can click through</H3>
      <p>
        For the custom path, our <a href={PAGES.project("operations-portal")}>Kerrow demonstration</a> is a fictional
        building-maintenance company’s portal: one job board for the team, and one place for clients to follow jobs,
        approve quotes and pay. Its business and data are invented, and nothing is sent.
      </p>

      <H2 id="yours">How we’d look at yours</H2>
      <p>
        Our <a href={PAGES.service("platforms")}>platforms work</a> starts with the way your team runs jobs and what
        clients need to see. In the free audit, tell us where the email traffic and double entry happen. We’ll suggest
        what to change first, including an off-the-shelf tool when one fits.
      </p>
    </>
  );
}
