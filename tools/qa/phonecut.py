"""The concept sites' phone views cut out of their tall covers (transparent
around the phone), for the /work/ hero: public/work/<slug>-phone.webp.
Run from the repo root after the tall covers change:
    python tools/qa/phonecut.py
"""
from collections import deque
from PIL import Image

SLUGS = ["butter-days", "blackridge", "outbound"]
BG = (235, 231, 226)  # the tall covers' backdrop
TOL = 18  # how far from the backdrop a pixel may be and still count as backdrop
WIDTH = 520  # output width (shown at about 220 px, sharp on a 2x screen)


def dist(c):
    return max(abs(c[0] - BG[0]), abs(c[1] - BG[1]), abs(c[2] - BG[2]))


for slug in SLUGS:
    im = Image.open(f"public/work/{slug}-tall.webp").convert("RGB")
    w, h = im.size
    px = im.load()
    alpha = Image.new("L", (w, h), 255)
    a = alpha.load()
    # Flood fill the backdrop from the edges, so light pixels inside the
    # phone's screen stay opaque.
    seen = bytearray(w * h)
    q = deque()
    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))
    while q:
        x, y = q.popleft()
        i = y * w + x
        if seen[i]:
            continue
        seen[i] = 1
        d = dist(px[x, y])
        if d > TOL:
            # The phone's edge: keep it, softened by how close it is to the backdrop.
            a[x, y] = min(255, int(255 * (d - TOL) / 40) + 120) if d < TOL + 40 else 255
            continue
        a[x, y] = 0
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx]:
                q.append((nx, ny))
    rgba = im.copy()
    rgba.putalpha(alpha)
    box = alpha.point(lambda v: 255 if v > 0 else 0).getbbox()
    rgba = rgba.crop(box)
    out = rgba.resize((WIDTH, round(rgba.height * WIDTH / rgba.width)), Image.LANCZOS)
    out.save(f"public/work/{slug}-phone.webp", "WEBP", quality=84, method=6)
    print(slug, box, out.size)
