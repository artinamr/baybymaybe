import { H2, H3, Callout, Steps, Compare, Figure, Cite } from "@/components/blog/Prose";
import { Routes } from "@/components/blog/Diagrams";
import { PAGES } from "@/lib/content";

export const toc = [
  { id: "what-it-is", title: "What a portal is (and isn’t)" },
  { id: "signals", title: "Five signals" },
  { id: "off-the-shelf", title: "Off the shelf, or custom?" },
  { id: "first-version", title: "What the first version should do" },
  { id: "running", title: "What it takes to keep it running" },
  { id: "security", title: "Security and privacy basics" },
  { id: "did-it-work", title: "Judging whether it worked" },
  { id: "example", title: "An example you can click through" },
];

export default function Body() {
  return (
    <>
      <p>
        Most businesses don’t decide to build a client portal. They drift towards one: the inbox fills with
        “any update?”, documents go back and forth as attachments, approvals hide in long threads, and someone
        on the team spends part of every day copying details from one place to another. At some point the question stops
        being whether you need a better way to share work with clients, and becomes what that way should be.
      </p>

      <H2 id="what-it-is">What a portal is (and isn’t)</H2>
      <p>
        A client portal is a private place, behind a login, where each client sees their own work with you: what’s
        happening, what they need to provide, what needs their approval, and what they owe. Your team sees the same
        information from the other side, for every client at once.
      </p>
      <p>
        It isn’t a replacement for talking to people. Good portals take the routine traffic (status, documents,
        approvals, invoices) out of email, so that when you do talk, it’s about something that needs a person.
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

      <H2 id="signals">Five signals that email has become the bottleneck</H2>
      <H3>1. The same status question, every day</H3>
      <p>
        If a good share of incoming email is clients asking where things are, the information exists. It just lives
        somewhere they can’t see. A status page each client can check removes the question rather than answering it
        faster.
      </p>
      <H3>2. Chasing documents</H3>
      <p>
        When work regularly waits on a file from the client, and someone on your team spends time reminding, finding and
        renaming attachments, a single place to upload, with a list of what’s still missing, pays for itself in
        hours.
      </p>
      <H3>3. Approvals buried in threads</H3>
      <p>
        “Yes, go ahead” at the bottom of a forty-message thread is a weak record of what was agreed. A portal
        can show exactly what was approved, by whom and when.
      </p>
      <H3>4. Typing the same details twice</H3>
      <p>
        If job details are written in an email, typed into a spreadsheet and typed again into the accounting software,
        every copy is a chance for a mistake. A portal connected to your other systems lets each detail be entered once.
      </p>
      <H3>5. Requests after hours</H3>
      <p>
        Clients who want to check something at nine at night will either wait until morning or email you. Neither helps
        them. Letting them look it up (or book, or pay) whenever it suits them is often the change they notice most.
      </p>
      <p>
        One signal on its own can usually be solved with a better process or a shared folder. Three or more, every week,
        is the point where a portal starts to make sense.
      </p>

      <H2 id="off-the-shelf">Off the shelf, or custom?</H2>
      <p>
        Honestly: often off the shelf is the right first step. Many industries have established software with a client
        area built in, and many general tools offer shared workspaces. If one fits the way you work, it will be cheaper
        and quicker than building, and you’ll learn what you really need.
      </p>
      <p>
        A custom portal earns its cost when your work doesn’t fit the shape of the tools: when your jobs have stages
        no product models, when the portal must join up several systems you already depend on, when the client’s
        experience is part of what you sell, or when the per-user pricing of a product grows faster than your business
        does.
      </p>
      <Compare
        caption="Off-the-shelf and custom portals compared"
        head={["", "Off the shelf", "Custom"]}
        rows={[
          ["Time to start", "Days to weeks", "Weeks to months"],
          ["Upfront cost", "Low; usually a subscription", "Higher; a build quoted from a scope"],
          ["Fits your process", "If your process fits the product", "Built around your process"],
          ["Connections", "Whatever the product supports", "To the systems you choose"],
          ["Running costs", "Per user or per client, rising as you grow", "Hosting and support, largely flat"],
          ["If you leave", "Export what the product allows", "The code and data are yours"],
        ]}
      />

      <H2 id="first-version">What the first version should do</H2>
      <p>
        The most common mistake is building everything at once. The first version should be the smallest thing that
        removes the most email, and nothing else. A sensible order:
      </p>
      <Steps
        items={[
          { t: "Accounts and the client’s list of work", b: <p>Each client signs in and sees their own jobs, nothing else.</p> },
          {
            t: "Status, in your words",
            b: <p>One clear stage per job, the next step, and who it’s waiting on. Updated by your team as part of the work, not as an extra task.</p>,
          },
          { t: "Documents both ways", b: <p>Upload, download, and a list of what’s still needed.</p> },
          { t: "Approvals with a record", b: <p>The quote or the change, approved in one step, with the time and the name kept.</p> },
          { t: "Then, and only then, the rest", b: <p>Payments, messaging, scheduling and reports, once the first version is in daily use and you know which would help most.</p> },
        ]}
      />

      <H2 id="running">What it takes to keep it running</H2>
      <p>
        A portal is only as good as the information in it. The ones that fail usually fail quietly: statuses stop being
        updated, clients learn the portal is out of date, and the emails come back. Plan for the everyday side before
        launch:
      </p>
      <ul>
        <li>
          <strong>Updating it is part of the work, not extra work.</strong> If a job moves stage when someone does the
          thing that moves it (approves, uploads, completes), the portal stays true without anyone remembering to update
          it. Where a person must update a status, make it one click from the screen they already use.
        </li>
        <li>
          <strong>Someone owns it.</strong> One person in your business decides what’s shown, answers questions
          about it, and notices when something looks wrong.
        </li>
        <li>
          <strong>Clients are shown, not told.</strong> A short welcome (what they’ll find, how to sign in, who to
          call) and a link in every email that would previously have carried the update.
        </li>
        <li>
          <strong>Email doesn’t vanish overnight.</strong> Some clients will keep emailing for a while. Answer with
          a link to the right page, and they learn where to look.
        </li>
        <li>
          <strong>Running costs are known.</strong> Hosting, the services it relies on, and support, all written down
          before you commit, so the second year holds no surprises.
        </li>
      </ul>

      <H2 id="security">Security and privacy basics</H2>
      <p>
        A portal holds your clients’ information, so it carries real responsibility. Under New Zealand’s
        Privacy Act 2020, information privacy principle 5 requires a business holding personal information to protect it
        with security safeguards that are reasonable in the circumstances, against loss, unauthorised access, use,
        modification or disclosure, and other misuse.
        <Cite n={1} /> In practice, for a portal, that means at least:
      </p>
      <ul>
        <li>
          <strong>Individual accounts.</strong> Every person signs in as themselves. No shared logins, for your team or for
          clients.
        </li>
        <li>
          <strong>Two-step sign-in.</strong> The National Cyber Security Centre calls enforcing multi-factor authentication
          the most critical control for preventing unauthorised access,
          <Cite n={2} /> and its Own Your Online guidance notes that codes sent by text or email can be intercepted,
          recommending authenticator apps, tokens or physical keys instead.
          <Cite n={3} /> Make it compulsory for your staff; offer it to clients.
        </li>
        <li>
          <strong>Roles.</strong> The NCSC’s principle of least privilege, giving people the minimum access they need
          to do their job,
          <Cite n={2} /> applies to clients too: each sees only their own work.
        </li>
        <li>
          <strong>A record of who did what.</strong> An audit trail of approvals, uploads and changes protects you and your
          clients when there’s a disagreement, and helps you notice when something is wrong.
        </li>
        <li>
          <strong>A plan for when something goes wrong.</strong> The Privacy Commissioner expects a privacy breach that has
          caused, or might cause, serious harm to be notified to it within 72 hours of the business becoming aware of it,
          even while still investigating, and the affected people to be told as soon as possible.
          <Cite n={4} /> Know in advance who would make that call.
        </li>
      </ul>
      <Callout title="Collect less">
        <p>
          The safest information is the information you never stored. Before adding a field to the portal, ask whether you
          really need it, and for how long.
        </p>
      </Callout>

      <H2 id="did-it-work">Judging whether it worked</H2>
      <p>
        Decide before launch what you will look at afterwards, and measure it yourself rather than relying on a
        vendor’s case study. Useful things to count, before and after:
      </p>
      <ul>
        <li>How many status questions arrive by email or phone in a typical week.</li>
        <li>How long an approval takes, from sending the quote to the go-ahead.</li>
        <li>How long documents take to arrive once requested.</li>
        <li>How many hours a week the team spends copying details between systems.</li>
        <li>What clients say about it, unprompted.</li>
      </ul>
      <p>
        Give it a couple of months of normal use before judging. If the numbers haven’t moved, find out why before
        adding features. Usually some part of the work is still happening outside the portal.
      </p>

      <H2 id="example">An example you can click through</H2>
      <p>
        We built a working demonstration of this kind of portal for a fictional building-maintenance company,{" "}
        <a href={PAGES.project("operations-portal")}>Kerrow</a>: one job board for the team, and one place for clients to
        follow their jobs, approve quotes and pay. Approving a quote in the client view moves the job on the team’s
        board. It is a demonstration (the business and its data are invented, and nothing is sent), but it shows the
        shape of a first version better than a description can.
      </p>
    </>
  );
}
