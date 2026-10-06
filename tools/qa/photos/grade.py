"""The site's photo grade.

v2 (round 20): clean and modern, not matte. The first grade (v1: saturation 0.62, every
tone squeezed between the ink and the paper) made photos look faded and old. v2 keeps the
photo's full range, takes a little colour out (0.86) so different sources sit together,
leans the white point a touch toward the paper (only the brightest tones move), adds a
gentle contrast curve and, after resizing, a fine sharpen (mkimages.py) so detail stays
crisp at the size it is shown.
PIL only (no numpy on this machine).
usage (preview): python grade.py <in.jpg> <out.jpg> [sat=0.86] [mode=grade|mono|v1]"""
import sys

from PIL import Image, ImageEnhance

PAPER = (246, 245, 242)
INK = (14, 15, 21)


def _lut_v1(contrast: float):
    """v1, kept for comparison: every tone mapped between the ink and the paper."""
    tables = []
    for c in range(3):
        t = []
        for v in range(256):
            x = v / 255.0
            x = x + contrast * (x - 0.5) * (1 - abs(2 * x - 1))
            x = min(1.0, max(0.0, x))
            t.append(int(round(INK[c] + (PAPER[c] - INK[c]) * x)))
        tables += t
    return tables


def _lut(contrast: float, warm: float):
    """v2: full range, a gentle S-curve, and only the top tones leaning toward the paper."""
    tables = []
    for c in range(3):
        t = []
        for v in range(256):
            x = v / 255.0
            x = x + contrast * (x - 0.5) * (1 - abs(2 * x - 1))
            x = min(1.0, max(0.0, x))
            y = x * 255.0
            hi = max(0.0, (x - 0.78) / 0.22)  # 0 below 78%, 1 at white
            y = y + (PAPER[c] - 255.0) * warm * hi * hi
            t.append(int(round(min(255.0, max(0.0, y)))))
        tables += t
    return tables


def grade(im: Image.Image, sat: float = 0.86, mode: str = "grade", contrast: float = 0.1, warm: float = 0.8) -> Image.Image:
    im = im.convert("RGB")
    if mode == "v1":
        return ImageEnhance.Color(im).enhance(0.62).point(_lut_v1(0.12))
    im = ImageEnhance.Color(im).enhance(0.0 if mode == "mono" else sat)
    return im.point(_lut(contrast, warm))


if __name__ == "__main__":
    src, out = sys.argv[1], sys.argv[2]
    sat = float(sys.argv[3]) if len(sys.argv) > 3 else 0.86
    mode = sys.argv[4] if len(sys.argv) > 4 else "grade"
    im = Image.open(src)
    im.thumbnail((1200, 1200))
    grade(im, sat, mode).save(out, quality=88)
    print(out)
