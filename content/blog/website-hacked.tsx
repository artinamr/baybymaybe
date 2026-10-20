import { PAGES } from "@/lib/content";
import { H2, H3, Callout, Check, Compare, Figure, Steps, Cite } from "@/components/blog/Prose";
import { DecisionTree } from "@/components/blog/Diagrams";
import { Term } from "@/components/blog/Term";

export const toc = [
  { id: "first", title: "The first hour, day and week" },
  { id: "signs", title: "Is it a hack? What you’re seeing" },
  { id: "report", title: "Report it, and who else to tell" },
  { id: "tell", title: "Customers’ information: the privacy test" },
  { id: "how", title: "Find the way in" },
  { id: "restore", title: "Clean up and restore" },
  { id: "example", title: "An example: a café’s website" },
  { id: "next", title: "Stopping the next one" },
  { id: "yours", title: "How we’d look at yours" },
];

export default function Body() {
  return (
    <>
      <p>
        If you think your website has been broken into, call your <Term id="hosting">host</Term> first, write down
        what you see, and don’t delete anything yet. Business.govt.nz says to act quickly, find and fix the problem,
        then take steps to stop it happening again.
        <Cite n={1} /> Not sure it’s a hack? Start with <a href="#signs">what you’re seeing</a>.
      </p>

      <H2 id="first">The first hour, day and week</H2>
      <p>Work through this plan with your host or IT provider.</p>

      <H3>The first hour: contain it</H3>
      <Steps
        items={[
          {
            t: "Call your host",
            b: (
              <p>
                Or whoever runs the site, and your payment provider if you take payments. Ask the host to back up the
                site and its database before any clean-up, as Google advises.
                <Cite n={2} /> Ask them to keep the logs too. Don’t wipe anything or turn the server off: Own Your
                Online says to disconnect a breached system, as turning it off could lose evidence.
                <Cite n={3} />
              </p>
            ),
          },
          {
            t: "Start a log",
            b: (
              <p>
                Times, what you saw, who you told, what anyone changed, and screenshots. Own Your Online says a record
                like this helps with lessons learned, insurance claims and investigations.
                <Cite n={4} />
              </p>
            ),
          },
          {
            t: "Take the site offline if it’s harming visitors",
            b: (
              <p>
                Ask the host for a holding page served from outside the hacked server.
                <Cite n={5} />
              </p>
            ),
          },
          {
            t: "Change passwords from a device you trust",
            b: (
              <p>
                Google’s advice is to change the passwords for all site users and accounts.
                <Cite n={5} /> Include hosting, the site’s admin, the database, FTP, email, your domain{" "}
                <Term id="registrar">registrar</Term> and the Google account behind the site. Turn on{" "}
                <Term id="two-factor">two-step sign-in</Term> as you go.
              </p>
            ),
          },
          {
            t: "Remove access you don’t recognise",
            b: (
              <p>
                Note the names of admin users nobody created, then delete them.
                <Cite n={5} /> Remove unknown owners from <Term id="search-console">Google Search Console</Term> too:
                in one kind of hack, Google says, the attacker adds themselves as an owner there.
                <Cite n={2} />
              </p>
            ),
          },
        ]}
      />

      <H3>The first day: assess and report</H3>
      <Steps
        items={[
          {
            t: "Find out what was touched",
            b: <p>Pages, files, accounts and, above all, any personal information.</p>,
          },
          {
            t: "Report it to the NCSC",
            b: (
              <p>
                The National Cyber Security Centre (NCSC) takes reports online or by phone.
                <Cite n={6} /> Call 0800 114 115, free within New Zealand, 7am to 7pm, Monday to Friday, except public
                holidays.
                <Cite n={7} />
              </p>
            ),
          },
          {
            t: "Decide whether it’s a notifiable breach",
            b: (
              <p>
                If it’s a <Term id="privacy-breach">notifiable privacy breach</Term> (
                <a href="#tell">the test is below</a>), the Privacy Commissioner asks to hear ideally within 72 hours
                of you knowing, even if you’re still investigating.
                <Cite n={8} />
              </p>
            ),
          },
          {
            t: "Tell your insurer, and the Police if there’s a crime",
            b: (
              <p>
                The Privacy Commissioner suggests assessing whether your insurer needs to know, and telling the Police
                about theft or other criminal activity.
                <Cite n={9} />
              </p>
            ),
          },
          {
            t: "Check what Google sees",
            b: (
              <p>
                Look in Search Console’s Security issues report or, if the site isn’t in Search Console, Google’s Safe
                Browsing transparency report.
                <Cite n={10} />
              </p>
            ),
          },
        ]}
      />

      <H3>The first week: clean up and tell people</H3>
      <Steps
        items={[
          {
            t: "Close the way in, then restore",
            b: (
              <p>
                Find how they got in and close it, then restore from the last clean <Term id="backup">backup</Term>,
                updating everything as it comes back. Google says to secure the site before it goes back online.
                <Cite n={10} />
              </p>
            ),
          },
          {
            t: "Ask Google to review the site",
            b: (
              <p>
                Once every issue is fixed on every page. A review can take from a few days to a few weeks.
                <Cite n={11} />
              </p>
            ),
          },
          {
            t: "Tell the people affected",
            b: (
              <p>
                If the breach is notifiable, as soon as practicable, not once the clean-up is done. The Act allows a
                delay only while telling them would risk the security of the information more than it helps them.
                <Cite n={12} />
              </p>
            ),
          },
          {
            t: "Hold a short debrief",
            b: (
              <p>
                The Privacy Commissioner says to always include a root cause analysis.
                <Cite n={9} /> Then write <a href="#next">a one-page plan</a>.
              </p>
            ),
          },
        ]}
      />

      <H2 id="signs">Is it a hack? What you’re seeing</H2>
      <p>
        When Google finds a site hacked, serving <Term id="malware">malware</Term> or tricking visitors, it can label
        the site in search results or show a warning page in the browser.
        <Cite n={11} /> But not every warning means a break-in. Match what you see:
      </p>
      <Compare
        caption="What you’re seeing, and who to call first"
        head={["What you’re seeing", "What it usually means", "Call first"]}
        rows={[
          [
            "“This site may be hacked” in Google, or a browser warning page",
            <>
              Google suspects a hack or harm to visitors
              <Cite n={10} />
            </>,
            "Your host, then Search Console",
          ],
          [
            <>
              Pages, links or admin users nobody created; pages in another language when you search Google for site:
              and your address
              <Cite n={2} />
            </>,
            <>
              Content put on the site without your permission, such as spam
              <Cite n={11} />
            </>,
            "Your host",
          ],
          [
            "Your website or email suddenly goes somewhere else",
            "Your domain’s settings may have been changed",
            "Your domain registrar",
          ],
          [
            "A demand for money, or files you can’t open",
            "Ransomware, or a threat to release stolen data",
            <>
              Your IT provider and the NCSC. Don’t pay.
              <Cite n={13} />
            </>,
          ],
          [
            "A certificate warning, or the site is simply down",
            "Often a lapsed certificate or a hosting fault (our experience)",
            "Your host",
          ],
        ]}
      />
      <p>If your host emails about a problem, check it really comes from them before you click anything.</p>

      <H2 id="report">Report it, and who else to tell</H2>
      <p>
        CERT NZ is now part of the NCSC, and everyone reports incidents on the NCSC’s website.
        <Cite n={14} /> The NCSC can explain what happened, advise how to limit the damage and use your report to warn
        others. Reports are confidential; with your consent it can pass yours to partner agencies such as the Police.
        <Cite n={6} />
      </p>
      <p>
        Reporting to the NCSC isn’t a legal requirement, but Business.govt.nz says it may be the best thing for your
        business.
        <Cite n={1} /> Nor is it a notification under the <Term id="privacy-act">Privacy Act</Term>: if customers’
        information is involved, telling the Privacy Commissioner is a separate step.
      </p>
      <p>Others to tell:</p>
      <ul>
        <li>
          <strong>The Police,</strong> if there’s theft or other criminal activity.
          <Cite n={9} /> If someone is in immediate danger or a crime is being committed, call 111 now.
          <Cite n={7} />
        </li>
        <li>
          <strong>Your insurer and lawyer.</strong> The Privacy Commissioner suggests assessing whether they need to
          know.
          <Cite n={9} />
        </li>
        <li>
          <strong>Your payment provider,</strong> if the site takes payments.
        </li>
        <li>
          <strong>Your domain registrar,</strong> if your domain or email settings changed. For a .nz name you can
          complain about a provider to the Domain Name Commission, which asks whether you’ve contacted the provider
          first.
          <Cite n={15} />
        </li>
        <li>
          <strong>Your staff, then your customers.</strong> The NCSC advises telling people early and from the inside
          out (staff and board first, then customers, then the public), sharing what you know and being upfront about
          what you’re still working to understand.
          <Cite n={16} />
        </li>
      </ul>

      <H2 id="tell">Customers’ information: the privacy test</H2>
      <p>
        Under the Privacy Act, a break-in is a privacy breach if personal information you hold was accessed,
        disclosed, altered, lost or destroyed without authority, or if the attack stops you getting at it, even for a
        while.
        <Cite n={12} /> On a website it usually sits in enquiries, bookings, orders and customer accounts. If none was
        involved, the Act’s breach rules don’t apply.
      </p>
      <p>
        A breach is notifiable if it’s reasonable to believe it has caused, or is likely to cause, serious harm.
        <Cite n={12} /> To decide, the Act says to consider what you’ve done to reduce the risk, how sensitive the
        information is, the harm it could cause, who has it or may get it, and whether a security measure protects it.
        <Cite n={12} />
      </p>
      <p>
        Record your assessment, your decision and your reasons. If you’re not sure, notify: that’s the Commissioner’s
        advice.
        <Cite n={9} />
      </p>
      <Figure caption="The test: the first “no” is your answer.">
        <DecisionTree
          steps={[
            {
              q: "Was any personal information accessed, disclosed, changed, lost or locked away?",
              no: { t: "Not a privacy breach", b: "Note in your log how you know." },
            },
            {
              q: "Is it reasonable to believe it has caused or is likely to cause serious harm, or are you unsure?",
              no: { t: "Not notifiable", b: "Keep your reasons on file." },
            },
          ]}
          end={{ t: "Notify", b: "Tell the Privacy Commissioner as soon as practicable, and the people affected." }}
        />
      </Figure>
      <p>If it’s notifiable:</p>
      <ul>
        <li>
          <strong>Tell the Privacy Commissioner as soon as practicable.</strong>
          <Cite n={12} /> The Commissioner’s guidance: “Ideally you’ll do that within 72 hours after you’re aware that
          you have a notifiable breach, even if you’re still investigating it.”
          <Cite n={8} /> You can send details as you learn them.
          <Cite n={12} /> The Commissioner’s website has a self-assessment tool (a guide, not a final ruling) and
          NotifyUs, the reporting form.
          <Cite n={8} />
        </li>
        <li>
          <strong>Tell the people affected as soon as practicable,</strong> or give public notice if telling each of
          them isn’t reasonably practicable, unless one of the Act’s exceptions applies.
          <Cite n={12} /> Say what happened, what you’ve done and will do, what they can do to protect themselves, that
          the Commissioner has been told, that they can complain to the Commissioner, and who to contact.
          <Cite n={12} />
        </li>
        <li>
          <strong>Don’t skip it.</strong> Failing to notify the Commissioner without a reasonable excuse is an offence,
          with a fine of up to $10,000, and having fixed the problem is no defence.
          <Cite n={12} />
        </li>
      </ul>

      <H2 id="how">Find the way in</H2>
      <p>
        Before the site goes back up, find out how they got in, or they can come back the same way. Google’s list of
        the usual ways in is the place to start.
        <Cite n={17} />
      </p>
      <ul>
        <li>
          <strong>Guessed or reused passwords:</strong> attackers try a working login on as many services as they can.
        </li>
        <li>
          <strong>Missed updates:</strong> older software, including the{" "}
          <Term id="cms">content management system</Term>, can have high-risk security holes.
        </li>
        <li>
          <strong>Outdated or unpatched themes and plug-ins:</strong> Google calls them a major source of
          vulnerabilities.
        </li>
        <li>
          <strong>Social engineering:</strong> someone tricked into handing over a password.
        </li>
        <li>
          <strong>Too much access:</strong> administrator rights for people who don’t need them.
        </li>
      </ul>
      <p>
        To Google’s list we’d add old staff and contractor accounts, and shared logins. Ask your host what its logs
        show (when it started, which account or file was used) and write down what you find: it’s your list of what to
        fix.
      </p>

      <H2 id="restore">Clean up and restore</H2>
      <p>
        The way back is a clean copy of the site, put back once the way in is closed. Restore first and the same
        weakness can be used again.
      </p>
      <ul>
        <li>
          <strong>Use the last clean backup, not the newest.</strong> If the break-in was three weeks ago, last night’s
          backup carries it too: you want what Google calls the last good backup.
          <Cite n={11} />
        </li>
        <li>
          <strong>Reinstall rather than repair</strong> where you can: fresh copies of the content management system’s
          own files, its themes and its plug-ins.
          <Cite n={2} />
        </li>
        <li>
          <strong>Update everything as it comes back,</strong> and delete what you don’t use. Removing a plug-in means
          deleting its files from the server, not just switching it off.
          <Cite n={17} />
        </li>
        <li>
          <strong>Then ask Google to look again.</strong> Fix every issue on every page, choose Request Review in the
          Security issues report and describe your fixes.
          <Cite n={11} /> Once Google finds the site clean, warnings go within a few days, though browsers can lag a
          day or two. Asking too early only prolongs the warning.
          <Cite n={10} />
        </li>
        <li>
          <strong>Ransomware on your office computers is a different job.</strong> Own Your Online says to get the
          network offline immediately, restore from your most recent backup and not pay, even a small amount: there’s
          no guarantee you’ll get your data back, paying could put you at risk of further attacks, and it may breach
          sanctions.
          <Cite n={13} />
        </li>
      </ul>
      <Callout title="When cleaning isn’t worth it">
        <p>
          If the site is old, small and rarely updated, ask whether rebuilding it on maintained software would cost
          less than cleaning it. In our experience it sometimes does, and our guide to{" "}
          <a href={PAGES.article("redesign-or-improve")}>rebuilding or improving</a> helps you decide.
        </p>
      </Callout>

      <H2 id="example">An example: a café’s website</H2>
      <p>
        An illustration, not a real case. A café in Napier takes pickup orders on its WordPress site. At 7:40am one
        Monday a regular messages the owner: Chrome is showing a red warning page.
      </p>
      <ul>
        <li>
          <strong>First hour.</strong> The owner screenshots the warning and starts a log. The host copies the site and
          its logs and puts up a holding page elsewhere. The owner changes the passwords and turns on two-step sign-in.
          The host notes, then deletes, an administrator account nobody created.
        </li>
        <li>
          <strong>First day.</strong> The way in was an ordering plug-in two versions out of date, and the new account
          opened the orders: names, phone numbers, pickup times. Unable to rule out serious harm (scam texts naming the
          café, say), the owner notifies the Commissioner that afternoon, then emails the affected customers everything
          the Act requires, including a warning about scam messages. The owner also reports to the NCSC and calls the
          insurer.
        </li>
        <li>
          <strong>First week.</strong> The host restores a backup from before the account appeared, updates it and
          removes three unused plug-ins. The owner asks Google for a review.
        </li>
      </ul>

      <H2 id="next">Stopping the next one</H2>
      <p>Once the site is back, check these with whoever looks after it.</p>
      <Check
        items={[
          <>
            <strong>Two-step sign-in on every account behind the site,</strong> with an authenticator app, token or
            physical key: Own Your Online warns that codes sent by text or email can be intercepted.
            <Cite n={18} />
          </>,
          <>
            <strong>Updates on a rhythm,</strong> with someone named to do them. Own Your Online says patching the
            site’s software, plug-ins and web server included, is the owner’s responsibility, and suggests automating
            it.
            <Cite n={19} />
          </>,
          <>
            <strong>Fewer doors:</strong> delete unused plug-ins, themes and accounts, and give each person the smallest
            role that does their job.
          </>,
          <>
            <strong>Long, unique logins.</strong> Own Your Online suggests a passphrase of four or more words, not based
            on personal information.
            <Cite n={19} />
          </>,
          <>
            <strong>Backups you’ve tested.</strong> Keep three copies (one offline, one off-site, one on different
            media), check them by actually restoring, and ask your host who backs up the site and whether restoring
            costs extra.
            <Cite n={20} />
          </>,
          <>
            <strong>The domain on auto-renew,</strong> with your contact details current: if the registration expires,
            someone else could register it and start using it.
            <Cite n={21} />
          </>,
          <>
            <strong>Search Console owned by the business,</strong> so Google can email you when it suspects a hack.
            <Cite n={10} />
          </>,
          <>
            <strong>A one-page plan, printed:</strong> who hosts the site, who to call (IT provider, host, bank,
            lawyer) and where the backups are. Own Your Online has a template, and suggests a practice run every six
            months.
            <Cite n={4} />
          </>,
        ]}
      />
      <p>
        More in our guide to <a href={`${PAGES.article("after-launch-ownership")}#security`}>security after launch</a>.
      </p>

      <H2 id="yours">How we’d look at yours</H2>
      <p>
        If an incident is happening now, call your host or IT provider first. Once it’s contained, our free audit can
        review who looks after the site, its accounts and backups, and what still needs a closer look. It doesn’t
        replace a security assessment. If a rebuild turns out cheaper, our{" "}
        <a href={PAGES.service("websites")}>websites service</a> covers it.
      </p>
    </>
  );
}
