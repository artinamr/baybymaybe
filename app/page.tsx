import { Experience } from "@/components/experience/Experience";
import { Chrome } from "@/components/chrome/Chrome";
import { Hero } from "@/components/chapters/Hero";
import { Statement } from "@/components/chapters/Statement";
import { Build } from "@/components/chapters/Build";
import { Work } from "@/components/chapters/Work";
import { Why } from "@/components/chapters/Why";
import { Process } from "@/components/chapters/Process";
import { Audit } from "@/components/chapters/Audit";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PageReveal } from "@/components/chapters/PageReveal";
import { StoryMode } from "@/components/story/StoryMode";
import { OrgLd } from "@/components/site/JsonLd";

// The home page's own canonical address (the layout's title and card are its).
export const metadata = { alternates: { canonical: "./" } };

/**
 * The home page: the film's scenes (hero, statement, what we build, why,
 * let's talk) with the page's plain sections (work, how we work)
 * sliding over it between them — lib/chapters.ts.
 */
export default function Home() {
  return (
    <Experience>
      <Chrome />
      <main id="main">
        <Hero />
        <Statement />
        <Build />
        <Work />
        <Why />
        <Process />
        <Audit />
      </main>
      <SiteFooter home />
      <PageReveal />
      <StoryMode />
      <OrgLd />
    </Experience>
  );
}
