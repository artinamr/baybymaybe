# Secondary page refinement

Copy and source review took place on 12 October 2026. Final verification and publication preparation finished on 13 October, New Zealand time.

Scope: methodology, services and their detail pages, the blog and its eleven articles, work and its studies, and the story transcript. Homepage source, shared stage copy, global styles and the film renderer were left unchanged. Existing untracked client files were preserved.

## Changes

- Methodology has clearer deliverables and approvals, page-specific copy, a realistic example timetable, visible approval days on phones and photograph credits. Its existing scroll behaviour stays in place.
- Services have alternating image and text rows, labelled interface examples, section navigation and expandable scope groups. Work appears earlier in the detail pages.
- Blog writing is plainer and more specific. All 33 distinct article sources were rechecked, with corrections to privacy, Google Business Profile, Squarespace version differences, SEO descriptions and enquiry data handling.
- Work has clearer concept and demonstration groups, an announced filter count and study navigation. Scripted demonstrations are described accurately.
- The written story has chapter links and optional scene descriptions.
- Twelve photographs were replaced, prepared at two responsive sizes and recorded in `content/images.ts`. Thirteen affected share cards were regenerated.

## Photograph checks

Originals exceed 3000 pixels in width. Originals and final crops were inspected for brands, private writing, recognisable people and legible screens. New photographs have live CC0 records. The notebook crop removes the branded spectacles. No photograph is shared between unrelated page subjects.

The three new photographs sourced through Wikimedia Commons have publication evidence in their source pages' archived Unsplash image URLs:

| Photograph | Timestamp in image URL | First publication, UTC |
|---|---|---|
| Folder stack | `photo-1468779036391` | 17 July 2016 |
| Open | `photo-1481622254766` | 13 December 2016 |
| Boston Public Library catalogue | `photo-1463527882365` | 17 May 2016 |

All precede Unsplash's licence change on 5 June 2017. Source pages, authors, licences and dates checked are in the image registry. New large files are below 225,000 bytes; their half-size files are below 92,000 bytes.

## Verification

- Scoped ESLint and `git diff --check` pass.
- Plain production build and the GitHub Pages build with `/baybymaybe` pass. Copy guard checks 137 exported files.
- Desktop and phone route checks cover the five main pages, all service details and representative blog articles and work studies. No broken images, asset failures, browser errors or horizontal overflow were found.
- Methodology stage selection, service scope keyboard controls and story chapter links and disclosures work at 1440 and 390 pixels. Reduced motion removes visible photograph transitions.
- Blog interaction checks pass: search, topics, situation previews, glossary definitions and filters, reading progress and phone contents controls.
- Work interaction checks pass 10 of 10: all demonstrations, desktop and phone filters and counts, touch scrolling and reduced motion. Tests block external mutations; no email, booking or payment is sent.
- Article print styles hide the cover, navigation and contents controls; the print layout was inspected.
- Final social cards and responsive photograph crops were inspected.

Three pre-existing metadata length warnings remain inside the independent Blackridge and Outbound concept sites. They do not fail the copy guard or build.

The work interaction script's old three-project expectation was updated to the current six-project collection, including its visual order and the announced filter count.
