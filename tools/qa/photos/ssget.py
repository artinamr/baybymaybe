"""Download a StockSnap original through its own download form (CC0, no login).
usage: python ssget.py <photo-page-url> <out.jpg>
Prints the page's licence line, the photographer and the saved size so the record can be kept."""
import http.cookiejar, re, sys, urllib.parse, urllib.request

page, out = sys.argv[1], sys.argv[2]
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36"
cj = http.cookiejar.CookieJar()
op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
op.addheaders = [("User-Agent", UA), ("Accept-Language", "en-NZ,en;q=0.9")]
html = op.open(page, timeout=60).read().decode("utf-8", "ignore")
if 'name="photoId"' not in html:
    print("NOT A PHOTO PAGE (removed or redirected):", page); sys.exit(2)
csrf = re.search(r'name="_csrf" value="([^"]+)"', html).group(1)
pid = re.search(r'name="photoId" value="([^"]+)"', html).group(1)
lic = "CC0" if "CC0 license" in html or "publicdomain/zero" in html else "UNKNOWN"
author = re.search(r'"author"\s*:\s*"([^"]+)"', html)
author = author.group(1) if author else "?"
aurl = re.search(r'href="(/author/[^"]+)"', html)
author = f"{author} (https://stocksnap.io{aurl.group(1)})" if aurl else author
title = re.search(r"<title>([^<]+)</title>", html).group(1).strip()
data = urllib.parse.urlencode({"_csrf": csrf, "photoId": pid}).encode()
req = urllib.request.Request("https://stocksnap.io/photo/download", data=data, headers={"Referer": page, "Content-Type": "application/x-www-form-urlencoded"})
r = op.open(req, timeout=120)
final = r.geturl()
body = r.read()
ctype = r.headers.get("Content-Type", "")
if not ctype.startswith("image/"):
    print("NOT AN IMAGE", ctype, final, body[:300]); sys.exit(1)
open(out, "wb").write(body)
print(f"OK {out} {len(body)//1024} KB | licence {lic} | author {author} | {title} | {final}")
