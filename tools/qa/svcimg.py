"""Service images from film stills: wide banners (as rendered) and 4:5 portraits cropped on the subject."""
import os, sys
from PIL import Image

S = sys.argv[1]  # the folder holding stills_wide/ and stills_svc/ (from still.mjs)
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join("public", "services")
os.makedirs(OUT, exist_ok=True)

JOBS = [("websites", "3.72"), ("platforms", "4.9"), ("ai-automation", "5.45")]


def subject_cx(im):
    """Horizontal centre of the dark subject (columns holding pixels darker than the paper)."""
    g = im.convert("L").resize((im.width // 8, im.height // 8))
    w, h = g.size
    px = g.load()
    cols = [sum(1 for y in range(h) if px[x, y] < 90) for x in range(w)]
    tot = sum(cols) or 1
    return sum(x * c for x, c in enumerate(cols)) / tot * 8


for slug, F in JOBS:
    wide = Image.open(os.path.join(S, "stills_wide", f"F{F}.png")).convert("RGB")
    wide = wide.resize((2400, 1100), Image.LANCZOS)
    wide.save(os.path.join(OUT, f"{slug}-wide.webp"), "WEBP", quality=82, method=6)

    tall = Image.open(os.path.join(S, "stills_svc", f"F{F}.png")).convert("RGB")
    cx = subject_cx(tall)
    cw = int(tall.height * 4 / 5)
    x0 = int(max(0, min(tall.width - cw, cx - cw / 2)))
    crop = tall.crop((x0, 0, x0 + cw, tall.height)).resize((1200, 1500), Image.LANCZOS)
    crop.save(os.path.join(OUT, f"{slug}.webp"), "WEBP", quality=82, method=6)
    print(slug, "cx", int(cx), "->", os.path.getsize(os.path.join(OUT, f"{slug}-wide.webp")) // 1024, "KB wide,", os.path.getsize(os.path.join(OUT, f"{slug}.webp")) // 1024, "KB tall")
