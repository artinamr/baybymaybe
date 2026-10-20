import { PAGES } from "@/lib/content";
import { H2, Callout, Check, Compare, Figure, Steps, Cite } from "@/components/blog/Prose";
import { Layers } from "@/components/blog/Diagrams";
import { Term } from "@/components/blog/Term";

export const toc = [
  { id: "owning", title: "What owning your website means" },
  { id: "handover", title: "The handover checklist" },
  { id: "hosting", title: "Hosting in plain words" },
  { id: "backups", title: "Backups and updates" },
  { id: "security", title: "Security basics" },
  { id: "support", title: "Support: two ways to arrange it" },
  { id: "today", title: "If you’re not sure what you own" },
  { id: "leaving", title: "Leaving a provider without drama" },
];

export default function Body() {
  return (
    <>
      <p>
        Before launch, confirm who controls the domain, the hosting, the content and the code. Your team should have
        access to the accounts and know who handles renewals, backups and faults. A clear handover makes those
        responsibilities visible while the people who built the site are still there to explain them.
      </p>

      <H2 id="owning">What owning your website really means</H2>
      <p>
        “You own it” is said a lot and checked rarely. A website is several separate things, each with its own
        account, and owning the site means each of them is in your business’s name, with someone in your business
        able to get in.
      </p>
      <Figure caption="A website is a stack of separate accounts. Each one should be in your name.">
        <Layers
          rows={[
            { t: "Domain name", b: "Your address on the internet, held through a registrar and renewed every year or few years.", yours: "Registered to your business" },
            { t: "DNS and email", b: "The settings that point the domain at your website and your email.", yours: "Managed in an account you control" },
            { t: "Hosting", b: "The computers that serve the site to visitors.", yours: "Billed to your business, your login" },
            { t: "Code", b: "The website itself, kept in a code repository with its history.", yours: "A repository you own, or a full copy handed over" },
            { t: "Content and editor", b: "Your pages, images and documents, and the tool you edit them in.", yours: "You hold the top-level admin account" },
            { t: "Analytics and search", b: "Visitor statistics and your search engine accounts.", yours: "Owned by your business account" },
          ]}
        />
      </Figure>
      <p>
        The domain matters most, because everything else hangs from it. For a .nz name, the Domain Name Commission is
        explicit: make sure your business’s name is listed as the registrant, and if your web developer or provider is
        listed instead, ask your registrar to have it transferred. A search on the Commission’s website shows who the
        registrant is.
        <Cite n={1} /> The .nz Rules back this up: a registrar or reseller must not register a .nz name in its own name
        unless it means to use the name itself. If you want someone else to manage the name for you, their details can
        go in the administrative contact instead.
        <Cite n={2} /> Strictly, you hold a licence from InternetNZ to use the name for as long as it stays registered,
        rather than owning it outright. That is why renewals matter.
        <Cite n={2} />
      </p>

      <H2 id="handover">The handover checklist</H2>
      <p>At launch, you should be able to fill in every row of this table without asking anyone:</p>
      <Compare
        caption="What to have in hand at launch"
        head={["Item", "Where it lives", "In whose name", "Who else can get in"]}
        rows={[
          ["Domain name", "The registrar", "Your business", "Your developer, as admin contact if you choose"],
          ["DNS", "Registrar or DNS service", "Your business", "As needed, with their own login"],
          ["Hosting", "The hosting provider", "Your business", "Your developer, with their own login"],
          ["Code", "A code repository", "Your business", "Your developer"],
          ["Website editor", "The site’s admin", "You, as top-level admin", "Your team, with their own logins"],
          ["Analytics", "Your analytics account", "Your business", "Anyone you add"],
          ["Search Console", "Google Search Console", "Your business", "Anyone you add"],
          ["Paid services", "Each service", "Your business, on your card", "No one else needs to"],
          ["Notes", "A document you keep", "Yours", "Whoever you share them with"],
        ]}
      />
      <p>
        The notes matter more than they sound. A page or two in plain language (what each account is for, how the site
        is put together, how to make the common changes, and who to call) turns a future handover from an investigation
        into an afternoon.
      </p>
      <Callout title="Your own logins, not shared ones">
        <p>
          Everyone who works on the site (you, your team, your developer) should have their own login to each account.
          Shared passwords can’t be taken back from one person without changing them for everyone.
        </p>
      </Callout>

      <H2 id="hosting">Hosting in plain words</H2>
      <p>
        Hosting is the computer (in practice, a service) that sends your website to every visitor. What matters to a
        business is simple: that it’s fast for your visitors, reliable, secure, backed up, and billed to you. For a
        site that mostly shows information, very simple hosting is often the fastest and cheapest choice. A site with
        accounts, bookings or payments needs a server-side application and a database, which means more to look after.
      </p>
      <p>
        Ask what you’re paying for, roughly what it costs a year, and what happens if you need more. Be wary of
        hosting bundled into a monthly fee with everything else, where you can’t see what it costs or move it on
        its own.
      </p>

      <H2 id="backups">Backups and updates</H2>
      <p>
        Own Your Online, the National Cyber Security Centre’s advice for businesses and individuals, recommends having
        reliable, tested backups, kept offline or disconnected from your computers so an attacker can’t delete them,
        and regularly installing updates so attackers can’t exploit known weaknesses.
        <Cite n={3} /> For a website that means:
      </p>
      <ul>
        <li>
          <strong>Backups of everything that changes</strong> (the content and any database) on a schedule, kept
          somewhere separate from the site itself.
        </li>
        <li>
          <strong>A restore that has actually been tried.</strong> A backup that has never been restored is a hope, not a
          backup.
        </li>
        <li>
          <strong>Updates on a rhythm.</strong> Editors, plug-ins and server software publish security fixes regularly.
          The NCSC lists keeping software up to date among its critical controls.
          <Cite n={4} /> Someone should be responsible for applying them, and for checking the site afterwards.
        </li>
      </ul>

      <H2 id="security">Security basics</H2>
      <Check
        items={[
          <>
            <strong>
              <Term id="two-factor">Two-step sign-in</Term> on every account
            </strong>
            , especially the <Term id="registrar">registrar</Term>, hosting, email and the
            site’s admin. Own Your Online recommends authenticator apps, tokens or physical keys over codes by text or
            email, which can be intercepted.
            <Cite n={5} />
          </>,
          <>
            <strong>Least privilege.</strong> The NCSC’s principle: give people the minimum access they need to do
            their job.
            <Cite n={4} /> Editors don’t need to be administrators.
          </>,
          <>
            <strong>A password manager</strong> for the business, so passwords are long, unique and not kept in a
            spreadsheet. It is on the NCSC’s list of critical controls too.
            <Cite n={4} />
          </>,
          <>
            <strong>Domain renewals that can’t lapse.</strong> If a registration expires, someone else could register
            the name. Own Your Online suggests automatic renewal with a payment method that’s kept current, and
            contact details that are complete and up to date.
            <Cite n={6} />
          </>,
          <>
            <strong>Removing people promptly.</strong> When someone leaves your business, or a supplier’s work ends,
            their access ends the same day.
          </>,
        ]}
      />

      <H2 id="support">Support: two ways to arrange it</H2>
      <p>
        After launch, most businesses choose one of two arrangements. Neither is right for everyone; what matters is that
        it’s written down.
      </p>
      <Compare
        caption="Ongoing care and help-when-needed compared"
        head={["", "Ongoing care", "Help when needed"]}
        rows={[
          ["How it works", "A regular arrangement: updates, backups checked, small changes", "You ask; the work is quoted or charged as it’s done"],
          ["Cost", "Predictable, every month or year", "Only when you use it"],
          ["Updates and checks", "Done on a schedule", "Done when someone remembers, or is asked"],
          ["Response when something breaks", "Agreed in advance", "As soon as they can"],
          ["Suits", "Sites that change often, take bookings or payments", "Simple sites that rarely change"],
        ]}
      />
      <p>
        Whichever you choose, the agreement should say what’s included, how you ask for help, how quickly you can
        expect an answer, and what happens to your accounts and code if it ends.
      </p>

      <H2 id="today">If you’re not sure what you own today</H2>
      <p>
        Many businesses discover the answer only when they try to leave, or when the person who set it all up has moved
        on. You can find out in an afternoon, without telling anyone:
      </p>
      <Steps
        items={[
          {
            t: "Look up the domain",
            b: (
              <p>
                For a .nz name, a search on the Domain Name Commission’s website shows who the registrant is.
                <Cite n={1} /> If it isn’t your business, that is the first thing to fix.
              </p>
            ),
          },
          {
            t: "List every bill",
            b: (
              <p>
                Go through a year of statements for anything web-related: domain, hosting, email, plug-ins, the website
                provider. Each one is an account; each account should be in your name.
              </p>
            ),
          },
          {
            t: "Try to sign in",
            b: (
              <p>
                For each account, check that someone in your business can sign in as an administrator: not through a
                supplier, and not with a password only one former staff member knew.
              </p>
            ),
          },
          {
            t: "Ask for what’s missing, in writing",
            b: (
              <p>
                A polite email listing exactly what you need (the domain moved into your name, your own login to the
                hosting, a copy of the code and content) is usually all it takes. Keep the replies.
              </p>
            ),
          },
        ]}
      />
      <p>
        If a .nz registration was put in someone else’s name, ask them to transfer it to you. If they agree, their
        registrar handles the change; if they refuse, the Commission runs a dispute resolution service.
        <Cite n={7} /> A problem with a provider goes to the provider first. If it hasn’t responded, is taking too long
        or didn’t resolve the issue, you can complain to the Commission.
        <Cite n={8} />
      </p>

      <H2 id="leaving">Leaving a provider without drama</H2>
      <p>
        If everything in the handover table is already in your name, leaving is mostly a matter of removing someone’s
        access and giving it to someone else. If it isn’t, sort that first, while the relationship is still good.
      </p>
      <ul>
        <li>
          <strong>Moving a .nz domain to another registrar</strong> needs its authorisation code (it used to be called
          the <Term id="udai">UDAI</Term>), which confirms the request. Your current provider must give it to you on
          request and free of charge, and must not delay the move by withholding it.
          <Cite n={9} /> Moving registrar doesn’t necessarily end other contracts with the old provider, such as
          hosting, so check what else you have with them.
        </li>
        <li>
          <strong>Ask for the code and content</strong> in a standard form (a repository, an export of the content and
          media) and check you can open it before the old service ends.
        </li>
        <li>
          <strong>Plan the switch for a quiet time</strong>, keep the old hosting running until the new one is confirmed
          working, and test the forms and email afterwards.
        </li>
      </ul>
      <H2 id="yours">How we’d look at yours</H2>
      <p>
        We hand over the project’s code and content with access to the accounts and notes on how they work. Ongoing
        care is set out in our <a href={PAGES.service("websites")}>website service</a>. If you’re unsure who controls your
        current site, bring the records you have to the free audit. We’ll help identify the gaps and what to ask
        your provider for.
      </p>
    </>
  );
}
