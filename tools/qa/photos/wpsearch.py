"""Search the WordPress Photo Directory (CC0, moderated: no faces, no branding,
no overlays, 2000 px or more) and make a contact sheet of candidates.

usage: python wpsearch.py <slot> "<query1>|<query2>|..." [minLongSide=3000] [orientation=landscape|any]
Writes cand/<slot>.json (id, page, description, photographer, original URL and size)
and cand/<slot>.jpg (a numbered contact sheet, 4 across, big enough to judge).

The directory is a WordPress site: its public REST API (wordpress.org/photos/wp-json/wp/v2)
lists photos with their description, and each photo's media record gives the original.
Keep the request rate gentle (a short pause between calls)."""
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
min_long = int(sys.argv[3]) if len(sys.argv) > 3 else 3000
orient = sys.argv[4] if len(sys.argv) > 4 else "landscape"
API = "https://wordpress.org/photos/wp-json/wp/v2"
UA = "NerodynSiteImages/1.0 (choosing CC0 photos for nerodyn.com; artin@nerodyn.com)"
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


seen, photos = set(), []
for q in queries:
    for page in (1, 2):
        u = f"{API}/photos?" + urllib.parse.urlencode({"search": q, "per_page": 100, "page": page, "_fields": "id,link,content,author,featured_media,class_list"})
        try:
            res = get(u)
        except Exception as e:  # noqa: BLE001
            if page == 1:
                print("search failed", q, e)
            break
        for p in res:
            if p["id"] in seen:
                continue
            seen.add(p["id"])
            p["q"] = q
            photos.append(p)
        if len(res) < 100:
            break
        time.sleep(0.6)
    time.sleep(0.6)
print(len(photos), "photos found")

# The originals: one media request per 100 photos.
media = {}
ids = [p["featured_media"] for p in photos if p.get("featured_media")]
for i in range(0, len(ids), 100):
    chunk = ids[i : i + 100]
    u = f"{API}/media?" + urllib.parse.urlencode({"include": ",".join(map(str, chunk)), "per_page": 100, "_fields": "id,source_url,media_details"})
    for m in get(u):
        media[m["id"]] = m
    time.sleep(0.6)

items = []
for p in photos:
    m = media.get(p.get("featured_media"))
    if not m:
        continue
    md = m.get("media_details") or {}
    w, h = md.get("width") or 0, md.get("height") or 0
    if max(w, h) < min_long:
        continue
    if orient == "landscape" and w < h * 1.15:
        continue
    sizes = md.get("sizes") or {}
    preview = (sizes.get("1536x1536") or sizes.get("large") or sizes.get("medium_large") or {}).get("source_url") or m["source_url"]
    desc = p["content"]["rendered"].replace("<p>", "").replace("</p>", "").strip()
    items.append(
        {
            "id": p["id"],
            "page": p["link"],
            "desc": desc,
            "author": p.get("author"),
            "original": m["source_url"],
            "width": w,
            "height": h,
            "preview": preview,
            "q": p["q"],
            "classes": [c for c in p.get("class_list", []) if c.startswith(("photo_category", "photo_tag"))][:12],
        }
    )
print(len(items), "candidates after size/orientation filter")
json.dump(items, open(f"cand/{slot}.json", "w", encoding="utf-8"), indent=1)

# Contact sheet: 4 across, 440 px wide previews, numbered, with the description's start.
tw, th, cols = 440, 293, 4
thumbs = []
for i, it in enumerate(items[:64]):
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
    dr.text((x, y + 2), f"#{i}  {it['width']}x{it['height']}", fill=(0, 0, 0))
    dr.text((x, y + 14), it["desc"][:70], fill=(60, 60, 60))
sheet.save(f"cand/{slot}.jpg", quality=86)
print("sheet", f"cand/{slot}.jpg", sheet.size)
