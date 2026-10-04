# tools/qa/photos: finding, checking and preparing the site's photographs

Read `docs/BLOG-GUIDE.md` section 6 first. In short: outside photographs only,
CC0 or public domain only, with a live licence page, no watermark, logo or
legible product screen, relevant and premium. Never the site's own imagery.

Work in a scratch folder (never in the repo: originals are large). Python 3 with
Pillow; no other packages.

| Script | What it does | Usage |
|---|---|---|
| `ovsearch.py` | Searches Openverse for CC0 / public-domain photos and makes a numbered contact sheet of candidates (`cand/<slot>.jpg`, metadata in `cand/<slot>.json`) | `python ovsearch.py <slot> "query one|query two" [minWidth=2400] [sources=stocksnap,wikimedia,flickr]` |
| `ssget.py` | Downloads a StockSnap original through StockSnap's own download form, and prints the licence line and the photographer. Refuses a removed photo (its page redirects home) | `python ssget.py <photo-page-url> orig/<name>.jpg` |
| `credits.py` | Re-reads each chosen photo's licence page and records title, photographer, photographer page and licence (edit its `PAGES` list) | `python credits.py credits.json` |
| `grade.py` | The site's photo grade: saturation 0.62, a mild S-curve, black to RGB 14,15,21, white to the paper (#F6F5F2) | imported by `mkimages.py`; `python grade.py in.jpg out.jpg` to preview |
| `mkimages.py` | Crops (aspect, focal point, zoom), grades and encodes each photo at its two sizes as WebP into `<outRoot>/<dir>/` (edit `SPECS`) | `python mkimages.py <outRoot> [name,...]` (reads `orig/<source>.jpg`) |

Then copy the WebP files into `public/…`, add the photo to `content/images.ts`
(with its credit record and the date you checked the licence), view every crop
at full size, and rebuild. The article's credit line, the structured data's
licence fields and the image sitemap all come from `content/images.ts`.
