"""The site's photo grade: muted colour mapped into paper and ink, so photos from
different sources sit together on the page (whites become the paper, blacks the ink).
PIL only (no numpy on this machine).
usage (prototype): python grade.py <in.jpg> <out.jpg> [sat=0.55] [mode=grade|mono]"""
import sys
from PIL import Image, ImageEnhance

PAPER = (246, 245, 242)
INK = (14, 15, 21)  # a hair lifted from #0A0B10 so shadows keep their detail


def _lut(contrast: float):
    tables = []
    for c in range(3):
        t = []
        for v in range(256):
            x = v / 255.0
            x = x + contrast * (x - 0.5) * (1 - abs(2 * x - 1))  # gentle S-curve about mid-grey
            x = min(1.0, max(0.0, x))
            t.append(int(round(INK[c] + (PAPER[c] - INK[c]) * x)))
        tables += t
    return tables


def grade(im: Image.Image, sat: float = 0.55, mode: str = "grade", contrast: float = 0.12) -> Image.Image:
    im = im.convert("RGB")
    im = ImageEnhance.Color(im).enhance(0.0 if mode == "mono" else sat)
    return im.point(_lut(contrast))


if __name__ == "__main__":
    src, out = sys.argv[1], sys.argv[2]
    sat = float(sys.argv[3]) if len(sys.argv) > 3 else 0.55
    mode = sys.argv[4] if len(sys.argv) > 4 else "grade"
    im = Image.open(src)
    im.thumbnail((1200, 1200))
    grade(im, sat, mode).save(out, quality=88)
    print(out)
