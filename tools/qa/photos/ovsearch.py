"""Search Openverse for CC0 / public-domain photos and make a contact sheet of candidates.

usage: python ovsearch.py <slot> "<query1>|<query2>|..." [minWidth=3000] [sources=flickr,wikimedia,wordpress,stocksnap] [pages=2]
Writes cand/<slot>.json (metadata) and cand/<slot>.jpg (a numbered contact sheet, 4 across,
big enough to judge quality). Only CC0 and Public Domain Mark results are kept; confirm each
finalist's licence on its own page before using it (docs/BLOG-GUIDE.md, "Images")."""
import io
import json
import os
import sys
import time
import urllib.parse
import urllib.request

from PIL import Image, ImageDraw

slot = sys.argv[1]
queries = [q for q in sys.argv[2].split("|") if q.strip()]
minw = int(sys.argv[3]) if len(sys.argv) > 3 else 3000
sources = (sys.argv[4] if len(sys.argv) > 4 else "flickr,wikimedia,wordpress,stocksnap").split(",")
pages = int(sys.argv[5]) if len(sys.argv) > 5 else 2
UA = "NerodynSiteImages/1.0 (choosing CC0 photos for nerodyn.com; artin@nerodyn.com)"
os.makedirs("cand", exist_ok=True)


def get(url, binary=False, tries=2):
    err = None
    for _ in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=25) as r:
                data = r.read()
                return data if binary else json.loads(data.decode("utf-8"))
        except Exception as e:  # noqa: BLE001
            err = e
            time.sleep(1.5)
    raise err


seen, items = set(), []
for q in queries:
    for src in sources:
        for page in range(1, pages + 1):
            params = {"q": q, "license": "cc0,pdm", "source": src, "page_size": 20, "page": page, "mature": "false"}
            if src not in ("wikimedia",):
                params["category"] = "photograph"
            try:
                d = get("https://api.openverse.org/v1/images/?" + urllib.parse.urlencode(params))
            except Exception as e:  # noqa: BLE001
                print("search failed", q, src, e)
                break
            res = d.get("results", [])
            for r in res:
                w, h = r.get("width") or 0, r.get("height") or 1
                # Openverse records Flickr and WordPress photos at their preview size (1024 / 2048):
                # their originals are larger, and are checked for each finalist.
                need = {"flickr": 1000, "wordpress": 1300}.get(src, minw)
                if r["id"] in seen or w < need or w < h * 1.2:
                    continue
                seen.add(r["id"])
                items.append(
                    {k: r.get(k) for k in ("id", "title", "url", "thumbnail", "foreign_landing_url", "creator", "creator_url", "license", "license_version", "source", "width", "height")}
                    | {"q": q, "tags": [t["name"] for t in r.get("tags", [])][:15]}
                )
            time.sleep(0.35)
            if len(res) < 20:
                break

print(len(items), "candidates")
json.dump(items, open(f"cand/{slot}.json", "w", encoding="utf-8"), indent=1)

def preview(it):
    """A preview from the source itself (Openverse's own thumbnails fail for Wikimedia)."""
    u = it["url"] or ""
    if it["source"] == "wikimedia":
        name = urllib.parse.unquote(u.rsplit("/", 1)[-1])
        return "https://commons.wikimedia.org/wiki/Special:FilePath/" + urllib.parse.quote(name) + "?width=640"
    if it["source"] == "flickr":
        return u.replace("_b.jpg", "_z.jpg")
    if it["source"] == "wordpress":
        return u
    return it["thumbnail"]


tw, th, cols = 440, 293, 4
thumbs = []
for i, it in enumerate(items[:72]):
    try:
        im = Image.open(io.BytesIO(get(preview(it), binary=True))).convert("RGB")
        im.thumbnail((tw, th))
        thumbs.append((i, im))
    except Exception as e:  # noqa: BLE001
        print("thumb failed", i, e)
rows = (len(thumbs) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (tw + 10) + 10, max(1, rows) * (th + 34) + 10), (232, 232, 232))
dr = ImageDraw.Draw(sheet)
for k, (i, im) in enumerate(thumbs):
    x, y = 10 + (k % cols) * (tw + 10), 10 + (k // cols) * (th + 34)
    sheet.paste(im, (x, y + 28))
    it = items[i]
    dr.text((x, y + 2), f"#{i} {it['source']} {it['license']} {it['width']}x{it['height']}", fill=(0, 0, 0))
    dr.text((x, y + 14), (it["title"] or "")[:70], fill=(60, 60, 60))
sheet.save(f"cand/{slot}.jpg", quality=86)
print("sheet", f"cand/{slot}.jpg", sheet.size)
