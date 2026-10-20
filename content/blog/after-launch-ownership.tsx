import { PAGES } from "@/lib/content";
import { H2, H3, Check, Compare, Figure, Steps, Cite } from "@/components/blog/Prose";
import { Layers } from "@/components/blog/Diagrams";
import { Term } from "@/components/blog/Term";

export const toc = [
  { id: "owning", title: "What owning your website means" },
  { id: "handover", title: "The handover checklist" },
  { id: "hosting", title: "Hosting and DNS in plain words" },
  { id: "backups", title: "Backups and updates" },
  { id: "security", title: "Security basics" },
  { id: "support", title: "Support: two ways to arrange it" },
  { id: "today", title: "If you’re not sure what you own" },
  { id: "leaving", title: "Leaving a provider without drama" },
  { id: "example", title: "An example: a clinic’s website" },
  { id: "yours", title: "How we’d look at yours" },
];

export default function Body() {
  return (
    <>
      <p>
        Your business should hold every part of its website in its own name, with its own administrator logins: the
        domain, the DNS that points it at your site and email, the hosting, the code and content, and accounts such as
        analytics.
      </p>
      <p>
        Your contract should say the work made for you is yours. Check it all at launch, while the people who built it
        can explain it.
      </p>

      <H2 id="owning">What owning your website means</H2>
      <p>A website is a stack of separate accounts, and “you own it” means you hold every one:</p>
      <Figure caption="The layers of a website, and what “yours” means for each.">
        <Layers
          rows={[
            { t: "Domain name", b: "Your address on the internet, renewed every year or few years.", yours: "Your business is the holder" },
            { t: "DNS and email", b: "The settings that point the domain at your website and your email.", yours: "An account you control" },
            { t: "Hosting", b: "The servers that send the site to visitors.", yours: "Billed to you, your login" },
            { t: "Code", b: "The website itself, ideally in a repository with its history.", yours: "Yours under the contract" },
            { t: "Content and editor", b: "Your pages and images, and the tool you edit them in.", yours: "Your top-level admin login" },
            { t: "Analytics and search", b: "Visitor statistics and Google Search Console.", yours: "Your business as owner" },
          ]}
        />
      </Figure>
      <p>
        The <Term id="domain-name">domain</Term> matters most, because everything else hangs from it, your email
        included. For .nz names, InternetNZ runs the register and the Domain Name Commission regulates it. Strictly, you
        don’t own the name: the holder has a licence from InternetNZ to use it while it stays registered.
        <Cite n={1} /> That’s why renewals matter.
      </p>
      <p>
        The holder should be your business. Under the .nz Rules, a <Term id="registrar">registrar</Term> or reseller,
        which includes anyone registering a name for someone else, must not hold a .nz name in its own name unless it
        means to use it.<Cite n={1} />
      </p>
      <p>
        If your developer or provider is the registrant, the Commission advises asking your registrar to transfer it to
        your business.<Cite n={2} />
      </p>
      <H3>Who owns the code and the words</H3>
      <p>
        Under New Zealand’s Copyright Act, a business that commissions, and pays or agrees to pay for, a computer
        program, a photograph and some other kinds of work is the first owner of the copyright. Written words aren’t on
        that list: the copyright in them belongs first to whoever wrote them, or to their employer.<Cite n={3} />
      </p>
      <p>
        The commissioning rule applies only “subject to any agreement to the contrary”, so the contract
        decides.<Cite n={3} /> Read its intellectual property clause, and look for:
      </p>
      <ul>
        <li>The copyright in work made for you, words included, passing to your business when you pay.</li>
        <li>A lasting licence to anything the developer reuses, and paid themes, plug-ins, fonts and photos in your name.</li>
        <li>A copy of the code and content whenever you ask, and the right to choose who looks after the site.</li>
      </ul>
      <p>This is general information, not legal advice: if the site matters to your business, have a lawyer read the clause.</p>

      <H2 id="handover">The handover checklist</H2>
      <p>At launch, you should be able to fill in every row of this table without asking anyone.</p>
      <Compare
        caption="What to have in hand at launch"
        head={["Item", "Where it lives", "In whose name"]}
        rows={[
          ["Domain name", "The registrar, or a reseller", "Your business, as holder"],
          ["DNS", "The registrar or a DNS service", "Your business"],
          ["Email", "Your email provider", "Your business"],
          ["Hosting", "The hosting provider", "Your business"],
          ["Code", "A code repository", "Your business"],
          ["Website editor", "The site’s admin", "You, as top-level admin"],
          ["Analytics", "Your analytics account", "Your business, as administrator"],
          ["Search Console", "Google Search Console", "Your business, as verified owner"],
          ["Paid themes, plug-ins, fonts, photos", "Each supplier", "Your business, on its card"],
        ]}
      />
      <p>
        Two rows need care. A <Term id="search-console">Google Search Console</Term> property needs at least one
        verified owner, and a former owner can regain access with a verification token left in place.<Cite n={4} /> In{" "}
        <Term id="analytics">Google Analytics</Term>, only an Administrator can add or change users.<Cite n={5} /> Make
        your business the owner and the administrator, and add the developer as a user.
      </p>
      <H3>The handover pack</H3>
      <p>Ask for these at launch, in writing.</p>
      <Check
        items={[
          <>
            Your own administrator login to every account, and separate logins for everyone else: a shared password
            can’t be taken back from one person.
          </>,
          <>
            <Term id="two-factor">Two-step sign-in</Term> on each, with the recovery codes in the business’s password
            manager,<Cite n={6} /> not on one person’s phone.
          </>,
          <>
            A copy of every <Term id="dns">DNS</Term> record, so the settings can be rebuilt anywhere.
          </>,
          <>
            SPF, DKIM and DMARC records, which help mail servers spot forged email in your name. Own Your Online, from
            the National Cyber Security Centre (NCSC), advises them even if you don’t use email with your domain.
            <Cite n={7} />
          </>,
          <>The code and content in a standard form (a repository, a content export, the media), and proof they open.</>,
          <>A page or two of plain notes: what each account is for, how to make the common changes, and who to call.</>,
        ]}
      />

      <H2 id="hosting">Hosting and DNS in plain words</H2>
      <p>
        <Term id="hosting">Hosting</Term> is the service that sends your website to every visitor. It should be fast,
        reliable, secure, backed up and billed to you separately, so you can see the cost and move it. Simple hosting
        suits a site that mostly shows information; one with accounts, bookings or payments needs an application and
        database behind it, with more to look after.
      </p>
      <p>
        DNS is separate. It tells browsers where your website is and other mail servers where to deliver your email, so
        whoever controls it controls both. A .nz name’s holder can run its DNS or choose who does.<Cite n={1} /> When
        you point records at a service, Own Your Online advises having your own account there, with your domain
        assigned to it.<Cite n={7} />
      </p>

      <H2 id="backups">Backups and updates</H2>
      <p>
        Own Your Online is clear that, as the business owner, you’re responsible for your data, including making sure
        it’s backed up properly.<Cite n={8} /> For a website, that means:
      </p>
      <ul>
        <li>
          <strong>Everything that changes, backed up.</strong> On WordPress, a <Term id="backup">backup</Term> has two
          parts, the database and the files, and you need both to restore the site fully.<Cite n={9} />
        </li>
        <li>
          <strong>Copies kept apart.</strong> Own Your Online suggests three copies: one offline, one in another place
          (preferably offsite) and one on different media.<Cite n={8} /> For a small site, the host’s backups plus a copy
          you keep yourself is a practical start.
        </li>
        <li>
          <strong>A restore that has been tried.</strong> Test by restoring the whole site, or the data from a single
          database, and set backups to email you if they fail.<Cite n={8} />
        </li>
        <li>
          <strong>Updates on a rhythm.</strong> Keeping the site’s software patched, including plug-ins on your{" "}
          <Term id="cms">content management system</Term> and the web server, is the owner’s responsibility.
          <Cite n={10} /> Patching is the first of the NCSC’s critical controls,<Cite n={11} /> and WordPress advises a
          database backup before every upgrade.<Cite n={9} /> Someone should apply updates and check the site
          afterwards.
        </li>
      </ul>

      <H2 id="security">Security basics</H2>
      <Check
        items={[
          <>
            <strong>Two-step sign-in on every account</strong>, starting with the registrar, hosting, email and the site’s
            admin. The NCSC’s critical controls call for it, especially on accounts with admin access.
            <Cite n={11} /> Own Your Online advises authenticator apps, tokens or physical key fobs, as codes sent by
            text or email can be intercepted.<Cite n={12} />
          </>,
          <>
            <strong>Least privilege.</strong> The NCSC’s principle: give people the minimum access they need to do their
            job.<Cite n={11} /> Editors don’t need to be administrators.
          </>,
          <>
            <strong>A password manager</strong> for the business, so every password is long and unique. It’s one of the
            NCSC’s critical controls.<Cite n={11} />
          </>,
          <>
            <strong>Renewals that can’t lapse.</strong> Turn on automatic renewal and keep the payment method current.
            <Cite n={7} /> A lapsed .nz name can be reinstated within 90 days, before anyone else can register it, but
            that can be expensive and take days or weeks, with your website and email down meanwhile. The Commission
            also advises against using an address at the domain on the registration record.<Cite n={2} />
          </>,
          <>
            <strong>Removing people promptly.</strong> Own Your Online advises a process for removing leavers’ logins and
            passwords.<Cite n={13} /> Do it the day they go, or the day a supplier’s work ends.
          </>,
        ]}
      />
      <p>
        If something has already gone wrong, start with{" "}
        <a href={PAGES.article("website-hacked")}>what to do if your website is hacked</a>.
      </p>

      <H2 id="support">Support: two ways to arrange it</H2>
      <p>Support after launch usually takes one of two forms. Either works if it’s written down.</p>
      <Compare
        caption="Ongoing care and help when needed, compared"
        head={["", "Ongoing care", "Help when needed"]}
        rows={[
          ["How it works", "Updates, backup checks and small changes on a schedule", "You ask, and the work is quoted or charged as it’s done"],
          ["Cost", "Predictable, every month or year", "Only when you use it"],
          ["When something breaks", "Response times agreed in advance", "As soon as they can"],
        ]}
      />
      <p>
        Paying monthly isn’t always worth it. A simple site that rarely changes, on hosting that updates itself, may only
        need help when you ask. One that takes bookings or payments, or runs plug-ins, needs updates on a schedule.
      </p>
      <H3>Questions to ask before you agree</H3>
      <p>Own Your Online’s guide to choosing an IT provider covers the first four.<Cite n={14} /></p>
      <Check
        items={[
          <>Who applies updates, and how soon after they’re released?</>,
          <>
            How often are backups made and how long are they kept, where are the offline copies, and does restoring one
            cost extra?<Cite n={8} />
          </>,
          <>Who sets up logging, and what will they tell you?</>,
          <>Will they help in a security incident, and how do you reach them?</>,
          <>How fast will they answer, how are changes priced, and what happens to your accounts and code when it ends?</>,
        ]}
      />

      <H2 id="today">If you’re not sure what you own today</H2>
      <p>
        Many businesses find out only when they try to leave, or when whoever set it up has moved on. You can do the
        first three checks in an afternoon, without telling anyone.
      </p>
      <Steps
        items={[
          {
            t: "Look up the domain",
            b: (
              <p>
                Search for the name with the WHOIS lookup on the Domain Name Commission’s website. The registrant should
                be your business.<Cite n={2} /> If the registrar shown isn’t the company you pay, your provider is a
                reseller: your rights are the same, and the registrar on record is responsible for the name.
                <Cite n={15} />
              </p>
            ),
          },
          {
            t: "List every bill",
            b: (
              <p>
                Go through a year of statements for anything web-related: domain, hosting, email, plug-ins, booking
                tools. Each is an account that should be in your name.
              </p>
            ),
          },
          {
            t: "Try to sign in",
            b: (
              <p>
                Check that someone in your business can sign in to each as an administrator, not through a supplier or
                with a former employee’s password.
              </p>
            ),
          },
          {
            t: "Ask for what’s missing, in writing",
            b: (
              <p>
                Email a polite list of exactly what you need: the domain in your name, your own logins, the DNS records,
                the code and content. Keep the replies.
              </p>
            ),
          },
        ]}
      />
      <p>
        If someone else holds a .nz name that should be yours, ask them to transfer it; if they agree, contact their
        registrar. If they won’t, the Commission has a dispute resolution service, and if the holder is a company that
        no longer exists, contact the Commission.<Cite n={16} />
      </p>
      <p>
        Take a complaint about a provider to the provider first, then to the Commission if it hasn’t responded, is too
        slow or didn’t resolve it.<Cite n={17} />
      </p>

      <H2 id="leaving">Leaving a provider without drama</H2>
      <p>
        If everything in the handover table is in your name, leaving mostly means moving access to someone new. If not,
        sort that out first, while you’re on good terms. Then, in order:
      </p>
      <Steps
        items={[
          {
            t: "Copy before you change anything",
            b: <p>Export every DNS record, take a full backup (database and files), and list every account and licence.</p>,
          },
          {
            t: "Move the domain, if you want to",
            b: (
              <>
                <p>
                  Ask your provider for the domain’s <Term id="udai">authorisation code</Term> (it used to be called the
                  UDAI). They must give it to you on request and free of charge, and must not delay the move by
                  withholding it.<Cite n={18} /> The code lasts 30 days and works once. If the lookup shows “client
                  transfer prohibited”, ask the registrar to remove that first.<Cite n={19} />
                </p>
                <p>
                  Neither registrar may charge you for the change, and if yours won’t provide a code, the Commission
                  can.<Cite n={1} /> Moving the domain may not end your hosting or email with the old provider, so check
                  those separately.
                </p>
              </>
            ),
          },
          {
            t: "Move the code",
            b: (
              <p>
                If it’s in the developer’s GitHub account, they can transfer the repository to one your business owns,
                history and all. Any webhooks and deploy keys go with it, so review them.<Cite n={20} />
              </p>
            ),
          },
          {
            t: "Switch at a quiet time",
            b: (
              <p>
                Keep the old hosting running until the new site works, then test the forms, the email and any payments.
              </p>
            ),
          },
          {
            t: "Close the old doors",
            b: (
              <p>
                Remove the old provider’s logins and its Search Console token,<Cite n={4} /> and delete DNS records for
                services you no longer use, so nobody else can use them.<Cite n={7} />
              </p>
            ),
          },
        ]}
      />

      <H2 id="example">An example: a clinic’s website</H2>
      <p>
        An illustration, not a real client. A physiotherapy clinic in Nelson finds its web company, which takes weeks
        to reply, listed as the holder of its domain, through a registrar it has never heard of. The hosting, DNS,
        analytics and Search Console are in the web company’s accounts too. The clinic’s email is its own, but depends
        on that DNS.
      </p>
      <p>
        The practice manager asks in writing for the domain, logins, DNS records and a backup, and after two silent
        weeks contacts the registrar on record, then the Commission. The Commission deals with the domain only, so the
        backup still has to come from the web company. Once the clinic holds the domain and a
        backup, it copies the DNS records, verifies Search Console itself and removes the old token, and only then
        moves the hosting. Nothing needs rebuilding.
      </p>

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
