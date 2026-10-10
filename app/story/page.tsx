import type { Metadata } from "next";
import { CrumbsLd, PageLd, SiteLd } from "@/components/site/JsonLd";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SubReveal } from "@/components/site/SubReveal";
import { StoryBar } from "@/components/story/StoryBar";
import { StoryFilm } from "@/components/story/StoryFilm";
import { Transcript } from "@/components/story/Transcript";
import { STORY_TITLE } from "@/content/story";
import { PAGES, ogCard } from "@/lib/content";
import { pageMeta } from "@/lib/meta";

const DESCRIPTION =
  "A four-minute film about the customers a business loses without seeing them go: a slow website, an unanswered inbox, retyping, no follow-up.";

export const metadata: Metadata = pageMeta({
  title: `${STORY_TITLE}: a short film`,
  description: DESCRIPTION,
  path: "story/",
  image: ogCard("story", "The quiet leak: a machine the size of a cathedral, losing customers as rivers of light."),
});

/**
 * THE STORY (/story/, docs/STORY.md): a film about where customers leak out
 * of a business, the turn, and the rebuild, ending on the free audit. The
 * film is its own lazily loaded chunk behind the door; the words are in the
 * page as the transcript; the footer carries the audit form.
 */
export default function StoryPage() {
  return (
    <div className="st">
      <SiteLd />
      <PageLd href={PAGES.story} name={`${STORY_TITLE}: a short film by Nerodyn`} description={DESCRIPTION} />
      <CrumbsLd crumbs={[{ name: "Home", href: PAGES.home }, { name: "The story", href: PAGES.story }]} />
      <SubReveal />
      <StoryBar />
      <main id="main" className="st-main">
        <StoryFilm />
        <Transcript />
      </main>
      <SiteFooter />
      <noscript>
        <style>{`.st-door-go,.st-door-how,.st-hud,.st-count,.st-track,.st-cards,.st-again{display:none!important}.st-door{position:relative!important;min-height:80vh}html{overflow:auto!important}`}</style>
      </noscript>
    </div>
  );
}
