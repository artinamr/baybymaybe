"""Fetch the licence page of every chosen photo and record its provenance as JSON.
usage: python credits.py out.json"""
import json, re, sys, urllib.request

PAGES = {
    "laptop-notebook-white": "https://stocksnap.io/photo/man-work-DZ7DC58DSV",
    "notepad-glass": "https://stocksnap.io/photo/notepad-pen-A4GPO5BBZD",
    "analytics-dark": "https://stocksnap.io/photo/computer-analytics-39LQYJSLI0",
    "ipad-calendar": "https://stocksnap.io/photo/ipad-tablet-4SGERWWL1U",
    "desk-lamp-dark": "https://stocksnap.io/photo/macbook-computer-JPZDGEMDH3",
    "key-door": "https://stocksnap.io/photo/keys-door-Z1TKDI29FZ",
    "laptop-notes": "https://stocksnap.io/photo/laptop-desk-2BJQISGWND",
    "writing-planner": "https://stocksnap.io/photo/woman-writing-FFSUL8TZD3",
    "chair-notebook": "https://stocksnap.io/photo/chair-notebook-7ZPSYLVQNC",
    "whiteboard-webdesign": "https://stocksnap.io/photo/whiteboard-webdesign-NUEH6AWK1X",
    "laptop-white-code": "https://stocksnap.io/photo/macbook-laptop-7ULJ7GRFDB",
    "phone-hands-white": "https://stocksnap.io/photo/browsing-smartphone-LNKN1UZWY3",
    "wireframe-mockups": "https://stocksnap.io/photo/design-mockups-P6HXICOTZ5",
    "charts-laptop-bright": "https://stocksnap.io/photo/analytics-charts-JVSII4KCCK",
    "laptop-shadow": "https://stocksnap.io/photo/laptop-computer-W0RUS6FWBJ",
}
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36"
out = {}
for key, url in PAGES.items():
    html = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=60).read().decode("utf-8", "ignore")
    ok = 'name="photoId"' in html
    author = re.search(r'"author"\s*:\s*"([^"]+)"', html)
    aurl = re.search(r'href="(/author/[^"]+)"', html)
    title = re.search(r"<title>([^<]+)</title>", html)
    lic = "CC0 1.0" if ("CC0 license" in html or "publicdomain/zero" in html) else "UNKNOWN"
    out[key] = {
        "page": url,
        "live": ok,
        "title": title.group(1).replace(" Free Stock Photo - StockSnap.io", "").strip() if title else "",
        "author": author.group(1).strip() if author else "",
        "authorUrl": f"https://stocksnap.io{aurl.group(1)}" if aurl else "",
        "licence": lic,
    }
    print(key, out[key]["live"], out[key]["licence"], out[key]["author"], "|", out[key]["title"])
json.dump(out, open(sys.argv[1], "w", encoding="utf-8"), indent=1, ensure_ascii=False)
