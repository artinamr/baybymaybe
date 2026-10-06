"""Search Wikimedia Commons for CC0 / public-domain photographs and make a contact sheet.

usage: python cmsearch.py <slot> "<query1>|<query2>|..." [minWidth=3000] [scope=unsplash|all]
scope "unsplash" (default) searches the photographs imported from Unsplash while its licence
was CC0 (before June 2017): many of the best-known premium photographs on the web, and for
timeless subjects (architecture, keys, paper, tools) their age doesn't show. "all" searches
every bitmap on Commons. Only files whose licence record (extmetadata) is CC0 or public
domain are kept. Writes cand/<slot>.json (title, page, original, size, licence, artist) and
cand/<slot>.jpg (numbered, 4 across). Confirm each finalist's page before using it."""
import io
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

from PIL import Image, ImageDraw

slot = sys.argv[1]
queries = [q for q in sys.argv[2].split("|") if q.strip()]
minw = int(sys.argv[3]) if len(sys.argv) > 3 else 3000
scope = sys.argv[4] if len(sys.argv) > 4 else "unsplash"
API = "https://commons.wikimedia.org/w/api.php"
UA = "NerodynSiteImages/1.0 (choosing CC0 photos for nerodyn.com; artin@nerodyn.com)"
os.makedirs("cand", exist_ok=True)


def get(params=None, url=None, binary=False):
    u = url or API + "?" + urllib.parse.urlencode(params)
    err = None
    for _ in range(3):
        try:
            req = urllib.request.Request(u, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=40) as r:
                data = r.read()
                return data if binary else json.loads(data.decode("utf-8"))
        except Exception as e:  # noqa: BLE001
            err = e
            time.sleep(2)
    raise err


def strip(s):
    return re.sub(r"<[^>]+>", "", s or "").strip()


seen, items = set(), []
for q in queries:
    search = f"{q} filetype:bitmap" + (' incategory:"Images_from_Unsplash"' if scope == "unsplash" else "")
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": search,
        "gsrnamespace": 6,
        "gsrlimit": 50,
        "prop": "imageinfo",
        "iiprop": "url|size|extmetadata",
        "iiurlwidth": 640,
        "iiextmetadatafilter": "LicenseShortName|Artist|ImageDescription|DateTimeOriginal",
    }
    try:
        d = get(params)
    except Exception as e:  # noqa: BLE001
        print("search failed", q, e)
        continue
    pages = sorted((d.get("query") or {}).get("pages", {}).values(), key=lambda p: p.get("index", 0))
    for p in pages:
        if p["title"] in seen or not p.get("imageinfo"):
            continue
        seen.add(p["title"])
        ii = p["imageinfo"][0]
        md = ii.get("extmetadata") or {}
        lic = strip((md.get("LicenseShortName") or {}).get("value"))
        if not re.search(r"CC0|Public domain|PD", lic, re.I):
            continue
        w, h = ii.get("width") or 0, ii.get("height") or 1
        if w < minw or w < h * 1.15:
            continue
        items.append(
            {
                "title": p["title"],
                "page": ii.get("descriptionurl"),
                "original": ii.get("url"),
                "preview": ii.get("thumburl"),
                "width": w,
                "height": h,
                "licence": lic,
                "artist": strip((md.get("Artist") or {}).get("value"))[:80],
                "desc": strip((md.get("ImageDescription") or {}).get("value"))[:160],
                "date": strip((md.get("DateTimeOriginal") or {}).get("value"))[:10],
                "q": q,
            }
        )
    time.sleep(0.5)
print(len(items), "candidates")
json.dump(items, open(f"cand/{slot}.json", "w", encoding="utf-8"), indent=1)

tw, th, cols = 440, 293, 4
thumbs = []
for i, it in enumerate(items[:72]):
    try:
        im = Image.open(io.BytesIO(get(url=it["preview"], binary=True))).convert("RGB")
        im.thumbnail((tw, th))
        thumbs.append((i, im))
    except Exception as e:  # noqa: BLE001
        print("preview failed", i, e)
    time.sleep(0.1)
rows = (len(thumbs) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (tw + 10) + 10, max(1, rows) * (th + 34) + 10), (232, 232, 232))
dr = ImageDraw.Draw(sheet)
for k, (i, im) in enumerate(thumbs):
    x, y = 10 + (k % cols) * (tw + 10), 10 + (k // cols) * (th + 34)
    sheet.paste(im, (x, y + 28))
    it = items[i]
    dr.text((x, y + 2), f"#{i} {it['licence'][:10]} {it['width']}x{it['height']} {it['date']}", fill=(0, 0, 0))
    dr.text((x, y + 14), it["title"][5:75], fill=(60, 60, 60))
sheet.save(f"cand/{slot}.jpg", quality=86)
print("sheet", f"cand/{slot}.jpg", sheet.size)
