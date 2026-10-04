"""Search Openverse for CC0 / public-domain photos and make a contact sheet of candidates.
usage: python ovsearch.py <slot> "<query1>|<query2>|..." [minWidth=2400] [sources=stocksnap,wikimedia,flickr]
Writes cand/<slot>.json (metadata) and cand/<slot>.jpg (numbered contact sheet)."""
import json, os, sys, urllib.parse, urllib.request, io, time
from PIL import Image, ImageDraw

slot = sys.argv[1]
queries = sys.argv[2].split("|")
minw = int(sys.argv[3]) if len(sys.argv) > 3 else 2400
sources = (sys.argv[4] if len(sys.argv) > 4 else "stocksnap,wikimedia,flickr").split(",")
UA = "NerodynSiteImages/1.0 (site build; contact artin@nerodyn.com)"
os.makedirs("cand", exist_ok=True)

def get(url, binary=False, tries=3):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=40) as r:
                data = r.read()
                return data if binary else json.loads(data.decode("utf-8"))
        except Exception as e:
            err = e
            time.sleep(1.5)
    raise err

seen, items = set(), []
for q in queries:
    for src in sources:
        u = "https://api.openverse.org/v1/images/?" + urllib.parse.urlencode(
            {"q": q, "license": "cc0,pdm", "source": src, "page_size": 20, "mature": "false", "category": "photograph"})
        try:
            d = get(u)
        except Exception as e:
            print("search failed", q, src, e); continue
        for r in d.get("results", []):
            if r["id"] in seen: continue
            if (r.get("width") or 0) < minw: continue
            seen.add(r["id"])
            items.append({k: r.get(k) for k in ("id", "title", "url", "thumbnail", "foreign_landing_url", "creator", "creator_url",
                                                "license", "license_version", "source", "width", "height")} | {"q": q,
                         "tags": [t["name"] for t in r.get("tags", [])][:15]})
        time.sleep(0.4)

print(len(items), "candidates")
json.dump(items, open(f"cand/{slot}.json", "w", encoding="utf-8"), indent=1)

# contact sheet: thumbnails 300 px wide, numbered
tw, th, cols = 300, 200, 6
thumbs = []
for i, it in enumerate(items[:48]):
    try:
        b = get(it["thumbnail"], binary=True)
        im = Image.open(io.BytesIO(b)).convert("RGB")
        im.thumbnail((tw, th))
        thumbs.append((i, im))
    except Exception as e:
        print("thumb failed", i, e)
rows = (len(thumbs) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (tw + 8) + 8, rows * (th + 26) + 8), (235, 235, 235))
dr = ImageDraw.Draw(sheet)
for k, (i, im) in enumerate(thumbs):
    x, y = 8 + (k % cols) * (tw + 8), 8 + (k // cols) * (th + 26)
    sheet.paste(im, (x, y + 20))
    it = items[i]
    dr.text((x, y + 4), f"#{i} {it['source'][:5]} {it['width']}x{it['height']} {it['title'][:22]}", fill=(0, 0, 0))
sheet.save(f"cand/{slot}.jpg", quality=85)
print("sheet", f"cand/{slot}.jpg", sheet.size)
