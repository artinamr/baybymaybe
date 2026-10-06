"""Search ISO Republic (isorepublic.com: every photo CC0) through its WordPress media API
and make a contact sheet of candidates.

usage: python isosearch.py <slot> "<query1>|<query2>|..." [minWidth=3000]
Writes cand/<slot>.json and cand/<slot>.jpg (numbered, 4 across). Confirm each finalist's
page and licence before using it (docs/BLOG-GUIDE.md, "Images"). Keep requests gentle."""
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
API = "https://isorepublic.com/wp-json/wp/v2/media"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NerodynSiteImages/1.0 (artin@nerodyn.com)"
os.makedirs("cand", exist_ok=True)


def get(url, binary=False):
    err = None
    for _ in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
                return data if binary else json.loads(data.decode("utf-8"))
        except Exception as e:  # noqa: BLE001
            err = e
            time.sleep(2)
    raise err


seen, items = set(), []
for q in queries:
    u = f"{API}?" + urllib.parse.urlencode({"search": q, "per_page": 60, "media_type": "image"})
    try:
        res = get(u)
    except Exception as e:  # noqa: BLE001
        print("search failed", q, e)
        continue
    for m in res:
        if m["id"] in seen:
            continue
        seen.add(m["id"])
        md = m.get("media_details") or {}
        w, h = md.get("width") or 0, md.get("height") or 0
        if w < minw or w < h * 1.2:
            continue
        sizes = md.get("sizes") or {}
        prev = (sizes.get("large") or sizes.get("medium_large") or sizes.get("medium") or {}).get("source_url") or m["source_url"]
        items.append(
            {
                "id": m["id"],
                "title": (m.get("title") or {}).get("rendered", ""),
                "page": m.get("link"),
                "post": m.get("post"),
                "date": m.get("date"),
                "original": m["source_url"],
                "width": w,
                "height": h,
                "preview": prev,
                "q": q,
            }
        )
    time.sleep(0.6)
print(len(items), "candidates")
json.dump(items, open(f"cand/{slot}.json", "w", encoding="utf-8"), indent=1)

tw, th, cols = 440, 293, 4
thumbs = []
for i, it in enumerate(items[:96]):
    try:
        im = Image.open(io.BytesIO(get(it["preview"], binary=True))).convert("RGB")
        im.thumbnail((tw, th))
        thumbs.append((i, im))
    except Exception as e:  # noqa: BLE001
        print("preview failed", i, e)
    time.sleep(0.15)
rows = (len(thumbs) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (tw + 10) + 10, max(1, rows) * (th + 34) + 10), (232, 232, 232))
dr = ImageDraw.Draw(sheet)
for k, (i, im) in enumerate(thumbs):
    x, y = 10 + (k % cols) * (tw + 10), 10 + (k // cols) * (th + 34)
    sheet.paste(im, (x, y + 28))
    it = items[i]
    dr.text((x, y + 2), f"#{i} iso {it['width']}x{it['height']} {(it['date'] or '')[:7]}", fill=(0, 0, 0))
    dr.text((x, y + 14), it["title"][:70], fill=(60, 60, 60))
sheet.save(f"cand/{slot}.jpg", quality=86)
print("sheet", f"cand/{slot}.jpg", sheet.size)
