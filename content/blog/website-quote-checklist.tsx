import { H2, H3, Check, Compare, Cite } from "@/components/blog/Prose";
import { Term } from "@/components/blog/Term";
import { PAGES } from "@/lib/content";

export const toc = [
  { id: "why-they-differ", title: "Why quotes differ so much" },
  { id: "the-lines", title: "The lines a good quote has" },
  { id: "red-flags", title: "Red flags" },
  { id: "the-law", title: "What New Zealand law does" },
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
        Compare website quotes by what they include before you compare the totals. A useful quote is a fixed price for
        a written scope. It says who supplies the words and photos, how you approve the design, the standard it’s built
        to, who owns what at the end and what it costs to keep running.
      </p>
      <p>
        Use the checklist below to get every gap filled in writing before you sign. Consumer law may not protect a
        business buying a website (see <a href="#the-law">what New Zealand law does</a>), so the quote has to.
      </p>

      <H2 id="why-they-differ">Why quotes for “a website” differ so much</H2>
      <p>
        When quotes vary a lot, Consumer Protection’s advice is to ask why: the business may be more experienced, more
        realistic about how long the job will take, or may have misunderstood the project.<Cite n={1} /> For websites,
        look at five things:
      </p>
      <ul>
        <li>
          <strong>How much is designed.</strong> Reusing a few layouts costs less than designing every page.
        </li>
        <li>
          <strong>Who writes the words.</strong> In our experience, often the largest hidden job: many quotes
          assume you’ll supply everything, finished, on time.
        </li>
        <li>
          <strong>What it connects to.</strong> A booking system, a <Term id="crm">CRM</Term>, payments or accounting
          software each add work.
        </li>
        <li>
          <strong>The standard.</strong> Speed on a phone, accessibility and testing take time; in our experience, a low
          quote often leaves them out.
        </li>
        <li>
          <strong>After launch.</strong> Hosting, updates, backups and support: in the quote, in another agreement, or
          nowhere until something breaks.
        </li>
      </ul>
      <p>
        Not every job needs this much paper. For a few changes to a site you’re happy with, a written list and an hourly
        rate will do. If a site builder would do the job, read{" "}
        <a href={PAGES.article("diy-website-or-hire")}>building it yourself or hiring</a> first.
      </p>

      <H2 id="the-lines">The lines a good quote has</H2>
      <p>Each line should be in writing. If one is missing, ask for it before you sign.</p>
      <H3>The work</H3>
      <Check
        items={[
          <>
            <strong>Scope.</strong> The pages, the features (forms, booking, search, accounts) and what isn’t included.
          </>,
          <>
            <strong>Content.</strong> Who writes the words and supplies the photos, how many rounds of edits, and when
            content is due.
          </>,
          <>
            <strong>Design and approval.</strong> What you’ll see before building starts (designs or a clickable
            prototype), how many rounds of changes, and what counts as sign-off.
          </>,
          <>
            <strong>Integrations.</strong> Every system it connects to, what each connection does, and whose account
            each runs on.
          </>,
          <>
            <strong>The standard.</strong> Ask for <Term id="wcag">WCAG 2.2</Term> at level AA. The W3C encourages using
            the latest version, now 2.2, and sets its success criteria at three levels: A, AA and AAA.<Cite n={2} /> It
            also advises putting accessibility criteria in “any request for quotations and contracts”.<Cite n={3} /> For
            speed, ask for Google’s <Term id="core-web-vitals">Core Web Vitals</Term> thresholds.<Cite n={4} />
          </>,
          <>
            <strong>Testing and acceptance.</strong> Which phones and browsers, how the standard is checked, and how
            faults found before you accept the site are fixed.
          </>,
        ]}
      />
      <H3>Who owns what</H3>
      <Check
        items={[
          <>
            <strong>The domain.</strong> In your business’s name. For a .nz domain, the Domain Name Commission says to
            make sure your business is listed as the registrant; if your web developer is listed instead, contact your{" "}
            <Term id="registrar">registrar</Term> to have it transferred.<Cite n={5} />
          </>,
          <>
            <strong>The work itself.</strong> Who owns the design, the code, the words and the photos. The{" "}
            <a href="#the-law">law section</a> explains why this needs writing down.
          </>,
          <>
            <strong>Accounts and licences.</strong> Hosting, analytics, email, plug-ins, fonts and photos, each on an
            account in your business’s name. Adobe, for one, says a client’s website must load Adobe Fonts “through
            their own Creative Cloud subscription to ensure uninterrupted font licensing or web font
            hosting”.<Cite n={6} />
          </>,
          <>
            <strong>The handover.</strong> Your own logins, a copy of everything and plain notes on how it fits together.
            The <a href={`${PAGES.article("after-launch-ownership")}#handover`}>handover checklist</a> lists the lot.
          </>,
        ]}
      />
      <H3>After launch</H3>
      <Check
        items={[
          <>
            <strong>Launch tasks.</strong> Redirects from old addresses, analytics and{" "}
            <Term id="search-console">Search Console</Term> set up, backups switched on, and who does each.
          </>,
          <>
            <strong>Updates and security.</strong> Who applies updates and security patches, and whether backups run
            automatically, the admin sign-in uses <Term id="two-factor">two-factor authentication</Term> and the
            domain auto-renews. Own Your Online advises all four, and says updates are the business owner’s
            responsibility.<Cite n={7} /> If you pay someone to do them, write it down.
          </>,
          <>
            <strong>Privacy.</strong> If the site collects enquiries, who writes the privacy statement. The Privacy
            Commissioner says these are used to comply with principle 3 of the <Term id="privacy-act">Privacy Act</Term>{" "}
            (sometimes 3A too), and offers an online generator for them, the Priv-o-matic.<Cite n={8} />
          </>,
          <>
            <strong>Running costs.</strong> The domain, hosting, paid plug-ins and services, email: what each costs and
            who pays whom.
          </>,
          <>
            <strong>Support.</strong> What’s included and for how long, how quickly you’ll hear back, and whether faults
            in their own work are fixed free for a period.
          </>,
          <>
            <strong>Money and dates.</strong> Whether the total includes GST, payments tied to milestones, the hourly
            rate for extra work, and the launch date with what you must supply for it to hold.
          </>,
          <>
            <strong>Changes and endings.</strong> How a change is priced and approved before work on it starts, how
            either side can end the agreement, what you get if it stops partway, and how disputes are resolved.
            Business.govt.nz’s contract checklist covers ending a contract, disputes and changes too.<Cite n={9} />
          </>,
        ]}
      />

      <H2 id="red-flags">Red flags</H2>
      <ul>
        <li>
          <strong>A site you can’t take with you.</strong> Some providers build on a platform they own: if you leave,
          the site stays. That can suit some businesses; know before you sign.
        </li>
        <li>
          <strong>Silence about ownership.</strong> If the quote doesn’t say the domain, accounts and licences will be
          in your name, assume they won’t be.
        </li>
        <li>
          <strong>“Unlimited revisions.”</strong> Usually a sign nobody has agreed what is being built, so the project
          drifts.
        </li>
        <li>
          <strong>No redirects</strong> when you’re replacing a site. Google’s guidance for a move is a{" "}
          <Term id="redirect">permanent redirect</Term> from each old address to its new one, kept for as long as
          possible, generally at least a year.<Cite n={10} /> Without them, your search traffic is at risk.
        </li>
        <li>
          <strong>An estimate dressed as a quote.</strong> “Approximately” or “from” beside the total.
        </li>
      </ul>

      <H2 id="the-law">What New Zealand law does and doesn’t do</H2>
      <p>
        This isn’t legal advice: for your contract, talk to a lawyer. But four points of New Zealand law change what to
        get in writing.
      </p>
      <H3>A quote isn’t an estimate</H3>
      <p>
        Consumer Protection defines a quote as “an offer to do a job for a specified price”, and an estimate as the
        provider’s best guess of the cost. Once you accept a quote, the provider can’t charge you more unless you agree
        to extra work or the scope changes while the job is underway, which is a variation to your contract.<Cite n={1} />
      </p>
      <p>
        <strong>What it means for you.</strong> That guidance is written for consumers, but it’s the distinction to pin
        down. If the total says “approximately”, ask for a quote.
      </p>
      <H3>Consumer law may not cover you</H3>
      <p>
        To be a “consumer” under the Consumer Guarantees Act, you must acquire goods or services “of a kind ordinarily
        acquired for personal, domestic, or household use or consumption”.<Cite n={11} /> A business website may not
        be that kind of service.
      </p>
      <p>
        And where everyone involved is in trade, the Act allows a written agreement that it won’t apply to a deal made
        in trade, if it is fair and reasonable that they are bound by it.<Cite n={12} />
      </p>
      <p>
        <strong>What it means for you.</strong> Don’t count on consumer law to fill a quote’s gaps. Watch for a clause
        that excludes the Act, and put what matters into the quote itself.
      </p>
      <H3>Unfair terms in standard contracts</H3>
      <p>
        Since 16 August 2022, businesses have been protected from unfair terms in standard form small trade
        contracts.<Cite n={13} /> These are standard form contracts between businesses in a trading relationship with
        an actual or expected total value of up to $250,000 in any 12-month period. Only the Commerce Commission can
        take action to stop a business using an unfair term in one.<Cite n={14} />
      </p>
      <p>
        <strong>What it means for you.</strong> The rules cover unfair terms. They won’t add a line the quote leaves
        out. If a provider explains a term, the Commission advises getting the explanation in writing and attaching it
        to the contract.
        You can report a term you think is unfair on 0800 943 600 or online.<Cite n={14} />
      </p>
      <H3>Who owns the work</H3>
      <p>
        Under the Copyright Act, if you commission, and pay or agree to pay for, “the making of a computer program”, a
        drawing, a diagram or the taking of a photograph, among other things, you are the first owner of any copyright
        in what is made. But only “subject to any agreement to the contrary”, and written words aren’t on the
        list.<Cite n={15} />
      </p>
      <p>
        <strong>What it means for you.</strong> Don’t rely on the default: a studio’s terms can override it, and it
        doesn’t cover the words. Have the quote or contract say who owns the design, the code, the words and the
        photos, and what licence you get for anything the studio keeps.
      </p>

      <H2 id="questions">Questions to ask before you sign</H2>
      <p>Ask each studio the same questions, and keep the answers with its quote.</p>
      <ol>
        <li>Who will do the work, and will I speak to them?</li>
        <li>Is this a quote or an estimate, and does it include GST?</li>
        <li>What will I see before you build, and how do I approve it?</li>
        <li>Whose name will the domain, hosting, accounts and licences be in?</li>
        <li>Who will own the design, the code, the words and the photos?</li>
        <li>What will it cost to run each year, and who will I pay?</li>
        <li>If we part ways, what do I take with me?</li>
        <li>Can I try something you’ve built that works the way mine will?</li>
      </ol>

      <H2 id="comparing">Comparing two quotes fairly</H2>
      <p>
        Check both quotes line by line against the checklist. A gap is a cost you’ll pay later or work you’ll do
        yourself, so price it: ask the studio to quote the missing line, or add up its cost to you (your hours, a
        writer’s fee, support at their hourly rate). Compare the totals only when both quotes cover the same lines.
      </p>
      <p>
        Here is how that looks in an illustrative example, not a client: a joinery firm in Christchurch, replacing a
        dated site, has two quotes, and Quote A’s total is well below Quote B’s.
      </p>
      <Compare
        caption="Two quotes for a joinery firm, line by line"
        head={["Line", "Quote A", "Quote B"]}
        rows={[
          ["Price", "“Approximately”, GST not mentioned", "Fixed price, GST shown"],
          ["Content", "“Client to supply all content”", "Writing for the service pages"],
          ["Approval", "Not stated", "Clickable prototype, two rounds"],
          ["Standard", "Not mentioned", "WCAG 2.2 AA; Core Web Vitals on phones"],
          ["Redirects", "Not mentioned", "A map from the old site"],
          ["Ownership", "Domain in the studio’s name", "Everything in the firm’s name"],
        ]}
      />
      <p>
        The owner asks Studio A, in writing, to fix its price and to price each missing line. Most come back priced;
        the redirects come back as “not something we do”.
      </p>
      <p>
        The totals now compare like with like, and the gap is much smaller, but Quote A would still leave the site
        without redirects. The owner decides on what each quote leaves the firm with.
      </p>

      <H2 id="fixed-price">How a fixed price works</H2>
      <p>
        A fixed price is a promise about a defined piece of work: if the scope stays the same, so does the price, and
        the risk of it taking longer sits with the studio. Three things make it hold:
      </p>
      <ul>
        <li>
          <strong>The scope</strong>, precisely. “A booking page” isn’t precise; “a page where clients choose a
          service, a day and a time from the adviser’s calendar and get a confirmation email” is.
        </li>
        <li>
          <strong>What you provide, and when.</strong> If it arrives late, the date can move; the quote should say so.
        </li>
        <li>
          <strong>How a change is handled.</strong> It’s described and priced, and you agree before work on it starts.
          Business.govt.nz notes that most variation clauses require the change to be recorded in writing, and that a
          short email can do it.<Cite n={16} />
        </li>
      </ul>
      <p>
        Paying by milestones protects both sides: you pay as you see the work, and the studio isn’t carrying months of
        unpaid time.
      </p>

      <H2 id="what-to-send">What to send to get a useful quote</H2>
      <p>
        Business.govt.nz’s advice is to be clear, before anyone starts work, about what you need the site to do and how
        much you can spend.<Cite n={17} /> Fill in this brief and send the same page to everyone you ask, so the quotes
        can be compared.
      </p>
      <Compare
        caption="A one-page brief for website quotes"
        head={["Heading", "What to write"]}
        rows={[
          ["About us", "What we do, for whom, and where."],
          ["The site’s job", "What it must achieve, such as more bookings or fewer calls asking the same questions."],
          ["The current site", "Its address, what works and what doesn’t."],
          ["Pages and features", "Each marked “must have” or “nice to have”."],
          ["Connections", "The booking, CRM, payment and accounting tools we use."],
          ["Content", "Who writes the words and supplies photos, and by when."],
          ["Must-haves", "WCAG 2.2 AA, Core Web Vitals on phones, everything in our name."],
          ["Dates and budget", "Any date that matters, and a budget range."],
          ["Please quote", "A fixed price, exclusions, GST, the payment schedule and the hourly rate for extra work."],
        ]}
      />

      <H2 id="ours">What ours includes</H2>
      <p>
        Every Nerodyn <a href={PAGES.service("websites")}>website project</a> is quoted from a written scope, with a
        fixed price and a date, before anything starts. The quote includes design and a clickable prototype you
        approve, building and testing on real devices, launch with redirects and analytics, everything handed over in
        your name with plain notes, training, and the support set out in writing. It lists the running costs to plan
        for. The <a href={PAGES.pricing}>investment page</a> explains how a quote comes together and what affects the
        price. If you’re still working out what the site needs, the free audit gives you a starting point: a review of
        your current site and the changes we would make first.
      </p>
    </>
  );
}
