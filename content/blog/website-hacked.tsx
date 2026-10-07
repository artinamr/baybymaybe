import { H2, Callout, Check, Steps, Cite } from "@/components/blog/Prose";
import { Term } from "@/components/blog/Term";

export const toc = [
  { id: "first", title: "The first hour" },
  { id: "signs", title: "How you’ll know" },
  { id: "report", title: "Report it" },
  { id: "restore", title: "Clean up and restore" },
  { id: "tell", title: "Telling your customers" },
  { id: "how", title: "Find the way in" },
  { id: "next", title: "Stopping the next one" },
  { id: "yours", title: "How we’d look at yours" },
];

export default function Body() {
  return (
    <>
      <p>
        A hacked website is a shock, and it is also a situation with a known shape: contain it, report it, restore from
        a clean copy, tell the people affected, then close the way in. Business.govt.nz puts the timing plainly: “You’ll
        need to act quickly to protect your business.”
        <Cite n={1} /> This article walks through each step as it applies to a New Zealand business website, with the
        government guidance linked as it goes.
      </p>

      <H2 id="first">The first hour</H2>
      <p>
        Speed matters, and so does not making it worse. The steps below are the ones that hold up in practice; your
        hosting provider is your fastest source of help, because they deal with this every week.
      </p>
      <Steps
        items={[
          {
            t: "Write down what you’re seeing",
            b: (
              <p>
                Screenshot the strange pages, the alerts, the times. A short record helps your host diagnose it and
                feeds the report you’ll make later.
              </p>
            ),
          },
          {
            t: "Call your hosting provider",
            b: (
              <p>
                They can isolate the site, read the server logs and usually restore from their side. Ask them plainly:
                is this a hack, what is affected, and what do you recommend first?
              </p>
            ),
          },
          {
            t: "Change the important passwords, from another device",
            b: (
              <p>
                Hosting, the site’s admin, the database and email, from a computer you have no reason to doubt. Then
                turn on <Term id="two-factor">two-step sign-in</Term> for each account while you are in there.
              </p>
            ),
          },
          {
            t: "Take the site offline if it is putting visitors at risk",
            b: (
              <p>
                If browsers are warning people, or the site is serving things you didn’t publish, a plain maintenance
                page is the better day than another hour online. A closed shop loses less than one that harms its
                customers.
              </p>
            ),
          },
          {
            t: "Report it",
            b: (
              <p>
                New Zealand’s National Cyber Security Centre runs a reporting tool for exactly this; the next section
                explains what it does.
              </p>
            ),
          },
        ]}
      />

      <H2 id="signs">How you’ll know</H2>
      <p>
        Sometimes it is obvious (a defaced home page) and sometimes it whispers. Business.govt.nz lists the general
        signs of a cyber attack: “Slow computers, warning messages and password issues are all signs of a possible
        cyber attack.”
        <Cite n={1} /> On a website, the usual tells are:
      </p>
      <ul>
        <li>
          <strong>A warning you didn’t expect:</strong> your browser, a customer, or Google Search Console telling you
          the site serves malware or phishing.
        </li>
        <li>
          <strong>Changes nobody made:</strong> new pages, new admin users, files with recent dates, links you don’t
          recognise buried in the content.
        </li>
        <li>
          <strong>Behaviour that changed:</strong> the site suddenly slow, sending email that lands in spam, or
          logged-in users locked out.
        </li>
        <li>
          <strong>The host noticing first.</strong> Many providers scan for this and will email you; take those
          notices seriously, and check the sender is really your host before clicking anything.
        </li>
      </ul>
      <p>
        Leaving it doesn’t keep it quiet. Business.govt.nz warns that a hack “could even put your whole business on
        hold until it’s fixed”, and the longer it runs, the more customers it touches.
        <Cite n={1} />
      </p>

      <H2 id="report">Report it</H2>
      <p>
        New Zealand’s National Cyber Security Centre runs a reporting tool that is “for individuals and small businesses
        to report an online security issue in New Zealand”. It “will help you identify what’s happening and let you know
        what the next steps are to resolve it”.
        <Cite n={2} />
      </p>
      <p>
        Reporting is not compulsory: “You’re not legally required to report a problem, but doing so may be the best
        thing for your business,” says Business.govt.nz, which also notes the NCSC “can provide official support”.
        <Cite n={1} /> A report also helps the next business: what you describe is part of the picture the NCSC uses to
        warn others.
      </p>

      <H2 id="restore">Clean up and restore</H2>
      <p>
        The way back in is a copy of the site from before it happened. Own Your Online, the NCSC’s advice service, is
        blunt about backups: they “should be kept offline or disconnected from your computers so that an attacker can’t
        delete them”.
        <Cite n={3} />
      </p>
      <ul>
        <li>
          <strong>Restore from the most recent clean backup,</strong> not the newest one: if the break-in happened
          three weeks ago, last night’s backup may carry the intruder with it. Your host can help find the line.
        </li>
        <li>
          <strong>For ransomware, contain it first.</strong> Own Your Online says to “get your network offline
          immediately” (unplug the cable, switch off the router) so it cannot spread.
          <Cite n={3} />
        </li>
        <li>
          <strong>Update everything as it comes back:</strong> the content management system, its plug-ins, the server
          software. Old versions are the usual door.
        </li>
        <li>
          <strong>Don’t pay a ransom.</strong> “Do not pay the ransom, even if the amount seems small. There is no
          guarantee that you’ll get your data back,” says Own Your Online, which adds that paying funds the next attack
          and may even breach sanctions.
          <Cite n={3} />
        </li>
      </ul>

      <H2 id="tell">Telling your customers</H2>
      <p>
        If the hack reached personal information your business holds (customer names, emails, orders, anything from a
        breached email account), New Zealand’s Privacy Act has a duty for exactly this. A breach that has caused, or
        might cause, serious harm is notifiable, and the Privacy Commissioner calls it “a legal obligation under the
        Privacy Act”.
        <Cite n={4} />
      </p>
      <p>
        Two timings matter. Notify the Commissioner “ideally... within 72 hours after you’re aware that you have a
        notifiable breach, even if you’re still investigating it”, and tell the affected people “as soon as you can”.
        <Cite n={4} /> Say plainly what happened, what information was involved, what you have done, and what you would
        like them to do (usually: watch for odd messages and change a password). Customers forgive a bad day told
        honestly; they forgive silence much less.
      </p>

      <H2 id="how">Find the way in</H2>
      <p>
        Cleaning up without finding the door means cleaning up again next month. Own Your Online puts it in the
        recovery list: “work out how the malware got in so it doesn’t happen again.”
        <Cite n={3} /> For a website, the doors are usually one of these:
      </p>
      <ul>
        <li>
          <strong>An out-of-date plug-in or theme.</strong> The single most common way a small business site is broken
          into. Anything you don’t use should come out, not just be switched off.
        </li>
        <li>
          <strong>A reused or shared password.</strong> One leaked password from another service unlocks everything it
          was used on.
        </li>
        <li>
          <strong>Too much access, left too long.</strong> Old staff accounts, a developer’s login from three jobs ago,
          everyone as administrator.
        </li>
      </ul>
      <p>
        Your host’s logs answer most of this if you ask soon enough. Write down what you find; it becomes the checklist
        in the next section.
      </p>

      <H2 id="next">Stopping the next one</H2>
      <p>After the clean-up, this is the whole list:</p>
      <Check
        items={[
          <>
            <strong>Two-step sign-in on every account,</strong> using an authenticator app, token or key. Own Your
            Online warns that “codes sent via text message or email can be intercepted”, and recommends apps, tokens or
            keys instead.
            <Cite n={5} />
          </>,
          <>
            <strong>Backups on the government’s pattern:</strong> Business.govt.nz describes the 3-2-1-1 method, “3
            copies of back up data” on “2 types of storage media”, 1 off-site and 1 offline.
            <Cite n={1} /> A <Term id="backup">backup</Term> nobody has restored is a hope, not a backup.
          </>,
          <>
            <strong>Updates on a rhythm,</strong> with someone named to do them and check the site afterwards.
          </>,
          <>
            <strong>Fewer doors:</strong> remove the plug-ins, accounts and access you don’t use, and give each person
            the smallest role that does their job.
          </>,
          <>
            <strong>One page of notes:</strong> who hosts it, who to call, where the backups are, how sign-in works. On
            the bad day, that page is worth more than anything else here.
          </>,
        ]}
      />

      <H2 id="yours">How we’d look at yours</H2>
      <p>
        Looking after a website after launch is our everyday work: the updates on a rhythm, the backups that are
        actually restored and tested now and then, the accounts in your name, and a plan for the bad day. If your host
        already does all of that and it has been tested, you don’t need us, and it’s worth saying so. If you’re not
        sure, the free audit checks it: we’ll tell you what would happen today if your site were hit, and what it would
        take to make the answer boring.
      </p>
    </>
  );
}
