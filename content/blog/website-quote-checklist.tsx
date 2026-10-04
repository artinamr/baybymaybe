import { H2, Callout, Check, Compare, Figure, Cite } from "@/components/blog/Prose";
import { Flow } from "@/components/blog/Diagrams";
import { PAGES } from "@/lib/content";

export const toc = [
  { id: "why-they-differ", title: "Why quotes differ so much" },
  { id: "the-lines", title: "The lines a good quote has" },
  { id: "red-flags", title: "Red flags" },
  { id: "questions", title: "Questions to ask before you sign" },
  { id: "comparing", title: "Comparing two quotes fairly" },
  { id: "fixed-price", title: "How a fixed price works" },
  { id: "what-to-send", title: "What to send to get a useful quote" },
  { id: "ours", title: "What ours includes" },
];

export default function Body() {
  return (
    <>
      <p>
        Two quotes for “a new website” can differ by several times, and both can be honest. They are usually
        pricing different things: different amounts of work, different standards and different assumptions about who
        does what. The trouble is that a quote rarely says so. This article lists what a good one should spell out, so
        you can see what you are actually being offered, and compare two offers fairly.
      </p>
      <p>
        It is written from the side of the business buying the website. It isn’t legal advice; for the contract
        itself, talk to someone who gives it.
      </p>

      <H2 id="why-they-differ">Why quotes for “a website” differ so much</H2>
      <p>“A website” covers a wide range of work. The biggest differences usually come from:</p>
      <ul>
        <li>
          <strong>How much is designed.</strong> A site built from a few layouts reused across many pages costs less than
          one where each page is designed on its own. A theme adjusted to fit costs less again, and looks it.
        </li>
        <li>
          <strong>Who writes the words.</strong> Writing, gathering and shaping content is often the largest hidden job in
          a project. Some quotes include it; many assume you’ll supply everything, finished, on time.
        </li>
        <li>
          <strong>What it connects to.</strong> A booking system, a CRM, payments or an accounting package each add design,
          building and testing.
        </li>
        <li>
          <strong>The standard it is built to.</strong> Speed on a phone, accessibility, search foundations and testing on
          real devices take time. A low quote often achieves its price by leaving them out.
        </li>
        <li>
          <strong>What happens after launch.</strong> Hosting, updates, backups and support are either in the quote, in a
          separate agreement, or nowhere until something breaks.
        </li>
      </ul>
      <Figure caption="A quote should cover the whole life of the site, not only the build.">
        <Flow
          steps={[
            { t: "Before you sign", b: "Scope, content, standards, price, payment schedule, how changes work." },
            { t: "While it’s built", b: "Approvals, what you supply and when, a review link to try it." },
            { t: "At launch", b: "Redirects, analytics, search, backups, final checks, training." },
            { t: "Afterwards", b: "Ownership, running costs, support, what an update costs." },
          ]}
        />
      </Figure>

      <H2 id="the-lines">The lines a good quote has</H2>
      <p>Each of these should be in writing. If one is missing, ask for it before you sign.</p>
      <Check
        items={[
          <>
            <strong>The scope.</strong> Which pages and templates, which features (forms, booking, search, accounts) and,
            just as useful, what is <em>not</em> included.
          </>,
          <>
            <strong>Content.</strong> Who writes the words, who supplies photographs, how many rounds of edits, and the date
            content is needed by. If they write it, how do they learn what only you know?
          </>,
          <>
            <strong>How design is approved.</strong> What you will see before building starts (static designs, or a
            clickable prototype), how many rounds of changes are included, and what counts as sign-off.
          </>,
          <>
            <strong>Integrations.</strong> Every system it connects to, what the connection does, and whose account each
            service runs on.
          </>,
          <>
            <strong>The standard.</strong> Accessibility named against a published standard, and speed against something
            measurable. The current accessibility standard is WCAG 2.2, from the W3C; its success criteria come at three
            levels, A, AA and AAA.
            <Cite n={1} /> For speed, Google’s Core Web Vitals thresholds give you numbers to hold the work to.
            <Cite n={2} />
          </>,
          <>
            <strong>Launch tasks.</strong> Redirects from old addresses, analytics and search set up, backups switched on,
            testing on real phones, and who does each.
          </>,
          <>
            <strong>Ownership and handover.</strong> That the domain, hosting, code, content and every account will be in
            your business’s name, and what you will be given at the end.
          </>,
          <>
            <strong>Running costs.</strong> Domain renewal, hosting, paid plug-ins or services, email: what each is for,
            roughly what it costs, and who pays whom.
          </>,
          <>
            <strong>Support.</strong> What is included after launch and for how long, how you ask for help, how quickly you
            can expect an answer, and what happens after the included period ends.
          </>,
          <>
            <strong>The payment schedule.</strong> How much is paid when (usually tied to milestones), and what each
            payment releases.
          </>,
          <>
            <strong>Changes.</strong> How a request outside the scope is priced and approved before any work on it starts.
          </>,
          <>
            <strong>Dates, and what they depend on.</strong> The launch date, and what you must provide by when for that
            date to hold.
          </>,
        ]}
      />

      <H2 id="red-flags">Red flags</H2>
      <ul>
        <li>
          <strong>A site you can’t take with you.</strong> Some arrangements build on a platform owned by the
          provider: you pay monthly, and if you leave, the site stays. That can suit some businesses, but you should know
          before you sign, not when you try to leave.
        </li>
        <li>
          <strong>Silence about ownership.</strong> If the quote doesn’t say the domain and accounts will be in your
          name, assume they won’t be, and ask.
        </li>
        <li>
          <strong>“Unlimited revisions.”</strong> It sounds generous. In practice it usually means nobody has
          agreed what is being built, and the project drifts until somebody’s patience runs out.
        </li>
        <li>
          <strong>Nothing about content.</strong> If the quote doesn’t mention words and images at all, the project
          will stall waiting for them, usually on you.
        </li>
        <li>
          <strong>No mention of redirects</strong> when you are replacing an existing site. Google’s guidance for
          moving a site is to redirect each old address to its new one, and to keep those redirects for at least a year.
          <Cite n={3} /> A quote that ignores this puts your existing search traffic at risk.
        </li>
        <li>
          <strong>No running costs.</strong> Every website costs something to keep online. A quote that is silent on it is
          either hiding the cost or hasn’t thought about it.
        </li>
        <li>
          <strong>Nothing that isn’t included.</strong> A scope with no exclusions is a scope nobody has examined.
        </li>
      </ul>

      <H2 id="questions">Questions to ask before you sign</H2>
      <ol>
        <li>Who will actually do the work, and will I speak to them?</li>
        <li>What will I see before you start building, and how do I approve it?</li>
        <li>What do you need from me, by when, and what happens to the date if it’s late?</li>
        <li>Whose name will the domain, the hosting and every account be in?</li>
        <li>What will it cost to run each year, and who will I be paying?</li>
        <li>What happens when I want to change something after launch?</li>
        <li>If we part ways, what do I take with me, and how?</li>
        <li>Can I click through something you’ve built that works the way mine will?</li>
      </ol>

      <H2 id="comparing">Comparing two quotes fairly</H2>
      <p>
        Put both quotes side by side and go line by line. For each line, note whether it is included, who does the work,
        and whether it costs extra. Gaps in one quote are costs you will pay later, or work you will do yourself.
      </p>
      <Compare
        caption="One way to line up two quotes"
        head={["Line", "What to check", "If one quote leaves it out"]}
        rows={[
          ["Scope", "The same pages, templates and features?", "Price the missing features before comparing totals."],
          ["Content", "Who writes it, who supplies photos?", "Count your own time, or a writer’s fee."],
          ["Design approval", "Prototype or static images? How many rounds?", "Expect surprises when it’s built."],
          ["Standard", "Accessibility and speed named and measurable?", "Expect to pay to fix it later."],
          ["Launch", "Redirects, analytics, backups included?", "Risk to existing traffic; extra work at launch."],
          ["Ownership", "Everything in your name?", "Cost and risk if you ever leave."],
          ["Running costs", "Listed, with who pays?", "Add them to the comparison yourself."],
          ["Support", "What is included, for how long?", "Price help at their hourly rate."],
        ]}
      />
      <Callout title="The cheapest quote isn’t always the cheapest website">
        <p>
          Once the gaps are priced in (your time on content, fixes after launch, a move later), the two totals are often
          much closer than they first looked. Sometimes they swap places.
        </p>
      </Callout>

      <H2 id="fixed-price">How a fixed price works</H2>
      <p>
        A fixed price is a promise about a defined piece of work: if the scope stays the same, the price does. It moves
        the risk of the work taking longer than expected onto the people doing it, which is where it belongs: they are
        the ones who can estimate it.
      </p>
      <p>That only holds if three things are written down:</p>
      <ul>
        <li>
          <strong>What the scope is</strong>, precisely enough that both sides would agree whether something is in it.
          “A booking page” is not precise; “a page where clients choose a service, a day and a time
          from the adviser’s calendar and receive a confirmation email” is.
        </li>
        <li>
          <strong>What you are providing, and when:</strong> content, decisions, access. If those arrive late, the date
          can move. That is fair, and the quote should say so.
        </li>
        <li>
          <strong>How a change is handled.</strong> New ideas during a project are normal and often good. The healthy
          pattern is simple: the change is described, priced and given a date effect, and you decide before any work on
          it starts. Nothing is added to the bill that you didn’t agree to first.
        </li>
      </ul>
      <p>
        Paying by milestones (a deposit to start, then payments as agreed stages are approved) protects both sides: you
        pay as you see the work, and the studio isn’t carrying months of unpaid time.
      </p>

      <H2 id="what-to-send">What to send to get a useful quote</H2>
      <p>
        The more a studio knows, the less it has to guess, and the closer the quote will be to what you end up paying.
        Before asking for a quote, it’s worth writing a page that covers:
      </p>
      <ul>
        <li>What the business does, for whom, and what the website needs to achieve, in your words rather than a brief template.</li>
        <li>The current site, if there is one, and what you like and dislike about it.</li>
        <li>The pages and features you think you need, marked “must have” or “nice to have”.</li>
        <li>The systems it should connect to: booking, CRM, payments, email, accounting.</li>
        <li>Who will write the words and supply the photographs.</li>
        <li>Any date that matters, and why.</li>
        <li>A budget range, if you have one. It saves both sides time: it tells the studio which version of the project to quote.</li>
      </ul>
      <p>
        Send the same page to everyone you ask. Quotes written against the same description are the only ones you can
        compare fairly.
      </p>

      <H2 id="ours">What ours includes</H2>
      <p>
        Every Nerodyn project is quoted from a written scope, with a fixed price and a date, before anything starts. The
        quote includes design and a clickable prototype you approve, building and testing on real devices, launch with
        redirects and analytics, everything handed over in your name with plain notes, training, and the support set out
        in writing. It lists the running costs to plan for. The <a href={PAGES.pricing}>investment page</a> explains how a
        quote comes together and what moves the price.
      </p>
    </>
  );
}
