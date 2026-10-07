import type { ComponentType } from "react";
import * as redesign from "./redesign-or-improve";
import * as quote from "./website-quote-checklist";
import * as portal from "./when-you-need-a-client-portal";
import * as connect from "./connect-website-crm-booking";
import * as ai from "./ai-automation-workflows";
import * as ownership from "./after-launch-ownership";
import * as seo from "./what-is-seo";
import * as gbp from "./google-business-profile";
import * as diy from "./diy-website-or-hire";

export type TocItem = { id: string; title: string };

/** Each article's words and its contents list, by slug (the registry in ./index.ts holds the rest). */
export const BODIES: Record<string, { toc: TocItem[]; Body: ComponentType }> = {
  "redesign-or-improve": { toc: redesign.toc, Body: redesign.default },
  "website-quote-checklist": { toc: quote.toc, Body: quote.default },
  "when-you-need-a-client-portal": { toc: portal.toc, Body: portal.default },
  "connect-website-crm-booking": { toc: connect.toc, Body: connect.default },
  "ai-automation-workflows": { toc: ai.toc, Body: ai.default },
  "after-launch-ownership": { toc: ownership.toc, Body: ownership.default },
  "what-is-seo": { toc: seo.toc, Body: seo.default },
  "google-business-profile": { toc: gbp.toc, Body: gbp.default },
  "diy-website-or-hire": { toc: diy.toc, Body: diy.default },
};
