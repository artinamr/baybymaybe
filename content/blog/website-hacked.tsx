import { H2, Check, Steps, Cite } from "@/components/blog/Prose";
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
        Contact your hosting provider as soon as you suspect a break-in. Record what you’re seeing, contain the
        problem, then work through recovery and reporting. Business.govt.nz advises acting quickly and taking steps
        to prevent a repeat.
        <Cite n={1} /> This guide gives you a sequence to discuss with your provider.
      </p>

      <H2 id="first">The first hour</H2>
      <p>
        Your host can investigate the site and help contain the problem. Contact them before making major changes,
        and keep a record of the advice and actions.
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
                page can prevent further exposure while your host investigates.
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
        Some signs are obvious, such as a defaced home page. Others need investigation. Business.govt.nz lists the general
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
        Business.govt.nz warns that a hack can disrupt the business until it is fixed. Treat unexpected changes as
        a reason to investigate promptly.
        <Cite n={1} />
      </p>

      <H2 id="report">Report it</H2>
      <p>
        The National Cyber Security Centre has a reporting route for individuals and small businesses. It can help
        identify the issue and explain the next steps.
        <Cite n={2} />
      </p>
      <p>
        Business.govt.nz recommends reporting cyber incidents to the NCSC, even though reporting to the NCSC is not
        generally compulsory.
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
        If personal information was affected, assess whether the breach has caused or might cause serious harm.
        The Privacy Commissioner says a breach at that threshold must be notified. Its NotifyUs self-assessment
        tool can help you work through the decision.
        <Cite n={4} />
      </p>
      <p>
        The Commissioner asks for notification ideally within 72 hours of becoming aware of a notifiable breach,
        even while the investigation continues. Tell affected people as soon as you can, unless an exception applies.
        <Cite n={4} /> Explain what happened, what information was involved, what you have done and what the affected
        people should do next. Get specialist help if you are unsure about the assessment or an exception.
      </p>

      <H2 id="how">Find the way in</H2>
      <p>
        Recovery should include investigating how the attacker got in. Own Your Online puts it in the
        recovery list: “work out how the malware got in so it doesn’t happen again.”
        <Cite n={3} /> Ask your provider to investigate:
      </p>
      <ul>
        <li>
          <strong>An out-of-date plug-in or theme.</strong> Check for known weaknesses in the software the site uses.
          Remove anything you no longer need.
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
        Your host’s logs can help with the investigation. Write down what you find; it becomes the checklist
        in the next section.
      </p>

      <H2 id="next">Stopping the next one</H2>
      <p>After recovery, check these basics with the person responsible for the site:</p>
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
            <Cite n={1} /> Test that you can restore from a <Term id="backup">backup</Term> before relying on it.
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
            an incident, your team needs those details readily available.
          </>,
        ]}
      />

      <H2 id="yours">How we’d look at yours</H2>
      <p>
        If an incident is happening now, contact your host or IT provider first. Once it is contained, the free audit
        can help review who looks after the site, the handover records and the questions still unanswered. We’ll
        point out what needs further investigation. A site review is a starting point; it does not replace a
        security assessment.
      </p>
    </>
  );
}
