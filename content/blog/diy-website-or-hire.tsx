import { PAGES } from "@/lib/content";
import { H2, Callout, Compare, Check, Cite } from "@/components/blog/Prose";
import { DecisionTree } from "@/components/blog/Diagrams";
import { Term } from "@/components/blog/Term";

export const toc = [
  { id: "the-question", title: "The question behind the question" },
  { id: "diy", title: "When building it yourself makes sense" },
  { id: "hire", title: "When hiring earns its cost" },
  { id: "costs", title: "Work out what each path costs you" },
  { id: "deciding", title: "Four questions to decide" },
  { id: "example", title: "Examples: a bike workshop and a landscaper" },
  { id: "if-you-build", title: "If you build it, set these up first" },
  { id: "if-you-hire", title: "If you hire, protect these" },
  { id: "changing", title: "Changing paths later" },
  { id: "yours", title: "How we’d look at yours" },
];

export default function Body() {
  return (
    <>
      <p>
        For many small businesses, a site builder is the sensible place to start, and hiring help makes sense once the
        site has to do more than a builder can.
      </p>
      <p>
        Four questions decide which you need: can a builder do everything the site must do, will a simple site do for
        now, do the words and photos exist, and who will keep it current? The answer can also be both: a professional
        sets the site up, and you run it.
      </p>

      <H2 id="the-question">The question behind the question</H2>
      <p>
        “Should I build my own website?” is really two questions: whose hours will it cost, and who is responsible when
        it needs changing? Building it yourself usually costs less money and more of your time, and you learn a tool
        along the way. Hiring costs more money and less time, and buys someone else’s craft.
      </p>
      <p>
        Business.govt.nz, comparing your own website with selling through a marketplace, notes that “setting up a
        website costs money, and maintaining it takes time and skill”.
        <Cite n={1} /> The time and skill are the part owners tend to discover late: launch is the start of the
        looking-after.
      </p>
      <p>
        Elsewhere, its advice for a small business comes in stages: a simple site to start with, and a professional
        developer and designer when it’s time to build a new one.
        <Cite n={2} />
      </p>

      <H2 id="diy">When building it yourself makes sense</H2>
      <p>Choose the do-it-yourself path when most of these are true:</p>
      <ul>
        <li>The site’s job is to show what you do and take enquiries, and a handful of pages cover it.</li>
        <li>The words and photos exist, or writing them is work you want to do.</li>
        <li>Someone in the business is happy to learn the tool and will keep the site current.</li>
        <li>The website supports the business rather than being the main way new customers arrive.</li>
      </ul>
      <p>
        Business.govt.nz is encouraging here: “Your first website doesn’t need to be expensive.” It notes that several
        online services offer free and low-cost templates for a site of just a few pages.
        <Cite n={2} /> A <Term id="website-builder">site builder</Term> bundles the templates, an editor in the browser
        and the hosting, usually for one subscription.
      </p>
      <p>
        Being found is less of a barrier than it’s made out to be. On getting into Google’s results, its starter guide
        says: “You usually don’t need to do anything except publish your site on the web.”
        <Cite n={3} /> Getting found for the searches you want takes more work (that’s <Term id="seo">SEO</Term>), but
        a small, clear site starts on the right side of it.
      </p>
      <Callout title="Selling a few products?">
        <p>
          If the aim is to sell a few products rather than run a shop, business.govt.nz describes an online marketplace
          as quick and low-cost, with limited room for your own branding, and your own website as the way to control
          the whole experience.
          <Cite n={1} />
        </p>
        <p>
          Either way, if consumers can buy from you online, the Commerce Commission says you must make it clear that
          you are in trade, so they know the Fair Trading Act and the Consumer Guarantees Act protect them.
          <Cite n={4} />
        </p>
      </Callout>

      <H2 id="hire">When hiring earns its cost</H2>
      <p>Hire, at least for part of the work, when one of these is true.</p>
      <ul>
        <li>
          <strong>The site must do a job the builder can’t.</strong> It might be bookings tied to a system you already
          use, payments, client logins, or a link to your{" "}
          <Term id="crm">customer relationship management (CRM) system</Term> or accounting software. If a builder’s
          own feature covers it exactly, you may only need help setting it up; if not, see{" "}
          <a href={`${PAGES.article("connect-website-crm-booking")}#three-ways`}>connecting your website to your tools</a>.
        </li>
        <li>
          <strong>Customers judge you on the site.</strong> If people choose you by how you present (an architect, a
          luxury lodge, a premium product), the writing and design are much of the value.
        </li>
        <li>
          <strong>Nobody has the hours.</strong> If no one can keep the site current, pay someone who will, and agree
          in writing what that covers.
        </li>
      </ul>
      <p>
        A professional build buys judgement as much as labour: what to leave out, what the pages must say, what to
        connect and how to check it before launch.
      </p>
      <p>
        Business.govt.nz’s advice is to be clear, before work starts, about what you need the site to do and how much
        you can spend.
        <Cite n={2} /> The <a href={`${PAGES.article("website-quote-checklist")}#the-lines`}>website quote checklist</a>{" "}
        covers what to put in writing.
      </p>

      <H2 id="costs">Work out what each path costs you</H2>
      <p>
        Prices change too often for an article to quote them, so work out your own. Fill in this worksheet with
        today’s prices, then add up each column for one year and for three.
      </p>
      <p>
        Use renewal prices, not introductory ones. The Domain Name Commission warns that some{" "}
        <Term id="registrar">registrars</Term> discount a <Term id="domain-name">domain name</Term> in its first year
        and charge more to renew it.
        <Cite n={5} /> Check the same on any subscription.
      </p>
      <Compare
        caption="What each path costs you: fill in your own figures"
        head={["Cost", "Building it yourself", "Hiring someone"]}
        rows={[
          ["To start", "The builder plan with the features you need; the domain", "The quoted build; writing and photography if you buy them"],
          [
            "Each year",
            "The plan at its renewal price; the domain; email; paid add-ons such as bookings",
            "Hosting; the domain; email; any support or update arrangement",
          ],
          [
            "Your hours to start",
            "Learning the tool, writing, building, testing on a phone",
            "Briefing, writing or checking content, approving designs, testing",
          ],
          [
            "Your hours each month",
            "New content, renewals, updates, checking the form still works",
            "Sending changes, checking them, approving them",
          ],
        ]}
      />
      <p>
        Put a value on your hours (what you’d earn in that time, or what you’d pay someone else) and add them in. Over
        three years, a cheap start that takes a lot of your time can cost more than a quoted build, or less: your own
        figures will show which.
      </p>

      <H2 id="deciding">Four questions to decide</H2>
      <p>Answer from the top. The first “no” is your answer; four yeses mean build it yourself.</p>
      <DecisionTree
        steps={[
          {
            q: "Can the builder’s own features do everything the site has to do?",
            no: {
              t: "Hire for the part it can’t do",
              b: "Get the booking, payment or connection scoped and priced first. A professional can often set it up on a builder, and you run the rest.",
            },
          },
          {
            q: "Would a simple, clear site do the job for now?",
            no: {
              t: "Hire for the design and the words",
              b: "When customers judge you on the site, the writing and design are much of the value.",
            },
          },
          {
            q: "Do the words and photos exist, or will you write them?",
            no: {
              t: "Buy the content, then decide",
              b: "Pay a writer or photographer first. With the content in hand, building the site may be the easy part.",
            },
          },
          {
            q: "Will someone keep it current every month: words, renewals, updates and logins?",
            no: {
              t: "Hire, and keep the keys",
              b: "Agree who keeps it current and what that costs, with the domain and every account in your name.",
            },
          },
        ]}
        end={{
          t: "Build it yourself",
          b: "A site builder is a good answer. Start with a few pages, set up the basics below, and look again when the site needs to do more.",
        }}
      />

      <H2 id="example">Examples: a bike workshop and a landscaper</H2>
      <p>Illustrations, not real clients.</p>
      <p>
        <strong>A bike repair workshop in Dunedin, run by its owner and one mechanic.</strong> The site has to show the
        services, prices and opening hours, and take booking requests, which a builder’s form can do. Most work comes
        through word of mouth and the workshop’s <a href={PAGES.article("google-business-profile")}>Google listing</a>,
        so a simple site will do.
      </p>
      <p>
        The owner takes good photos, writes well and will keep the site current. Four yeses, so the owner builds it,
        and before launch registers the domain in the business’s name with auto-renewal on, turns on two-step sign-in
        and adds a privacy statement for the form. The note for later: look again if the workshop starts selling parts
        online.
      </p>
      <p>
        <strong>A landscaping company in Whangārei with a small office team.</strong> Every quote request should land in
        the job-management system the office already uses, with the customer’s photos attached, not in someone’s inbox.
        Their site builder’s form only sends email, so the first answer is no.
      </p>
      <p>
        The rest is simple: a few pages, photos of finished gardens, and an office manager happy to keep it current. So
        they pay a professional to set up the site and the connection, agree in writing that everything is in the
        company’s name, and run it themselves after the handover.
      </p>

      <H2 id="if-you-build">If you build it, set these up first</H2>
      <p>A builder handles the hosting and the editor. These are the parts it leaves to you.</p>
      <Check
        items={[
          <>
            <strong>The domain in your business’s name.</strong> The Domain Name Commission says to make sure your
            business is listed as the registrant, and you can check by searching the domain name on its website.
            <Cite n={6} />
          </>,
          <>
            <strong>Auto-renewal on.</strong> Own Your Online, from the National Cyber Security Centre, warns that if a
            domain expires, an attacker could claim it and set up a scam site in your business’s name.
            <Cite n={7} /> The Commission says auto-renewal “greatly reduces the risk of your registration term
            ending”.
            <Cite n={6} />
          </>,
          <>
            <strong>Email on your domain, but not on its record.</strong> Business.govt.nz says a well-branded email
            address should link to your domain name, such as hello@yourbusiness.co.nz.
            <Cite n={2} /> For the domain’s own registration record, the Commission advises a different address: if the
            domain lapses, its email stops working too, and reinstating it may then be harder.
            <Cite n={6} />
          </>,
          <>
            <strong>
              <Term id="two-factor">Two-step sign-in</Term>
            </strong>{" "}
            on the builder, the registrar and your email account. Own Your Online strongly recommends two-factor
            authentication for your website.
            <Cite n={7} />
          </>,
          <>
            <strong>
              <Term id="https">HTTPS</Term> on every page
            </strong>
            , which business.govt.nz advises to keep your site secure.
            <Cite n={8} /> Check the form’s page in particular.
          </>,
          <>
            <strong>A privacy statement if the site has a form.</strong> It says why you’re collecting people’s details,
            how you’ll use them, who you’ll pass them to, whether they have to give them and what happens if they don’t,
            and that people can see and correct what you hold. The Privacy
            Commissioner says privacy statements are used to comply with principle 3 of the{" "}
            <Term id="privacy-act">Privacy Act</Term>; its online generator, the Priv-o-matic, helps you write one.
            <Cite n={9} />
          </>,
          <>
            <strong>Copies of your words and photos outside the tool</strong>, in a folder you own, so a move later
            doesn’t start from nothing.
          </>,
          <>
            <strong>Only the pages you’ll keep up.</strong> Business.govt.nz suggests a news page or blog only if you can
            update it regularly.
            <Cite n={8} />
          </>,
          <>
            <strong>The basics that make pages good:</strong> fast photos, honest titles, one clear page per service.
            The <a href={`${PAGES.article("what-is-seo")}#page-check`}>page checklist</a> applies to a builder site as
            much as a custom one.
          </>,
        ]}
      />

      <H2 id="if-you-hire">If you hire, protect these</H2>
      <ul>
        <li>
          <strong>Ownership, agreed before work starts.</strong> Everything on the{" "}
          <a href={`${PAGES.article("after-launch-ownership")}#handover`}>handover checklist</a> should end up in your
          business’s name, and the contract should say so.
        </li>
        <li>
          <strong>
            A <Term id="handover">handover</Term> at launch.
          </strong>{" "}
          Your own logins, a copy of everything and plain notes on how it works.
        </li>
        <li>
          <strong>A scope that says what isn’t included.</strong> In our experience, most overruns come from
          assumptions nobody wrote down.
        </li>
        <li>
          <strong>Who keeps it current, and at what cost.</strong> Updates, backups and renewals, written down.
        </li>
        <li>
          <strong>Work you can judge.</strong> Ask for sites they’ve built that you can visit, and talk to one of their
          clients if you can.
        </li>
      </ul>

      <H2 id="changing">Changing paths later</H2>
      <p>Neither choice locks you in for good, but some things move more easily than others.</p>
      <ul>
        <li>
          <strong>The domain can move, if it’s in your name.</strong> A .nz name moves to another registrar with
          its <Term id="udai">authorisation code</Term> (it used to be called the UDAI). Your provider must give it to
          you on request and free of charge,
          <Cite n={10} /> and the current registrar can’t charge an exit fee.
          <Cite n={5} /> The code is valid for 30 days and works once.
          <Cite n={11} />
        </li>
        <li>
          <strong>The site may not move.</strong> Wix says a Wix site “needs to be hosted and operated on Wix’s
          servers” to work properly.
          <Cite n={12} /> Squarespace exports only some content, to a file meant for WordPress; store pages, style
          settings and custom CSS stay behind.
          <Cite n={13} /> Changing builder usually means rebuilding the pages, so keep your own copies of the words and
          photos.
        </li>
        <li>
          <strong>From hired to in-house.</strong> If everything is in your name with your own logins, this is mostly a
          matter of passing access and notes to your team.
        </li>
        <li>
          <strong>The middle path.</strong> Have someone set the site up properly, then run it yourselves: your team
          edits the words and photos, and the professional handles bigger changes. It suits businesses that want a
          professional start without a heavy ongoing arrangement.
        </li>
      </ul>

      <H2 id="yours">How we’d look at yours</H2>
      <p>
        For a straightforward site and an owner with time to spend on it, a site builder can be a good choice. Our{" "}
        <a href={PAGES.service("websites")}>website work</a> suits businesses that need a more considered design,
        connected systems or someone to carry the build. Send us your current site or your plans for the free audit.
        We’ll explain which path we would take and why.
      </p>
    </>
  );
}
