# tools/qa/photos: finding, checking and preparing the site's photographs

Read `docs/BLOG-GUIDE.md` section 6 first. In short: outside photographs only,
CC0 or public domain only, with a live licence page; modern, premium,
obviously related, and clean at 100% zoom (no watermark, logo, brand, web
address, legible screen or recognisable person). Never the site's own imagery.

Work in a scratch folder (never in the repo: originals are large). Python 3 with
Pillow; no other packages. Every search writes `cand/<slot>.json` and a numbered
contact sheet `cand/<slot>.jpg`, four across, big enough to judge quality.

| Script | What it does | Usage |
|---|---|---|
| `isosearch.py` | Searches ISO Republic (all CC0) through its WordPress media API | `python isosearch.py <slot> "query one\|query two" [minWidth=3000]` |
| `cmsearch.py` | Searches Wikimedia Commons, by default the photographs first published on Unsplash while it used CC0; keeps only files whose licence record is CC0 or public domain. Prove each Unsplash photo's date (the guide, section 6) | `python cmsearch.py <slot> "intitle:bridge\|intitle:keys" [minWidth=3000] [unsplash\|all]` |
| `ovsearch.py` | Searches Openverse (CC0 and Public Domain Mark only) across Flickr, Commons, WordPress and StockSnap | `python ovsearch.py <slot> "query one\|query two" [minWidth=3000] [sources=flickr,wikimedia,wordpress,stocksnap] [pages=2]` |
| `wpsearch.py` | Searches the WordPress Photo Directory (CC0, moderated) through its REST API | `python wpsearch.py <slot> "query" [minLongSide=3000] [landscape\|any]` |
| `ssget.py` | Downloads a StockSnap original through StockSnap's own download form. Refuses a removed photo | `python ssget.py <photo-page-url> orig/<name>.jpg` |
| `credits.py` | Re-reads StockSnap licence pages (the round-18 set) | `python credits.py credits.json` |
| `grade.py` | The site's photo grade, v2 (and v1 for comparison) | imported by `mkimages.py`; `python grade.py in.jpg out.jpg [sat] [grade\|mono\|v1]` to preview |
| `mkimages.py` | Crops (aspect, focal point, zoom), grades, sharpens and encodes each photo at its two sizes as WebP within a size budget (edit `SPECS`) | `python mkimages.py <outRoot> [name,...]` (reads `orig/<source>.jpg`) |

Originals: ISO Republic and Commons give the file directly (the search JSON has
it); a Flickr original is on the photo's `/sizes/o/` page.

Then copy the WebP files into `public/…`, add the photo to `content/images.ts`
(source, licence, photographer, page, `via` for an Unsplash photo, the date you
checked, a `position` if the subject isn't central), view every crop at 100%,
and rebuild. Redraw the share cards that use the photo:
`ONLY=blog-<slug>,… node tools/qa/ogcards.mjs http://127.0.0.1:3100`.
