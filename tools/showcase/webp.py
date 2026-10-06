"""
THE SHOWCASE PICTURES, PART TWO: the PNGs from tools/showcase/shots.mjs into
the WebPs the case studies use, in public/work/:

  <slug>.webp            the cover, 2400x1500: the first screen in a browser frame
                         (the same frame as the other work covers)
  <slug>-tall.webp       a 4:5 cover, 1200x1500: the phone view in a phone frame
  <slug>/home.webp       the first screen, 2400x1500 (+ home-1200.webp), the case
                         study's poster before the live site loads
  <slug>/page-*.webp     every main page's first screen, 1200x750
  <slug>/phone-*.webp    phone views, 780 wide
  <slug>/f-*.webp        the features in use, at most 2000 wide (+ -1000.webp)

usage: python tools/showcase/webp.py <shots dir> [slug ...]
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "public", "work")
DOMAIN = {"butter-days": "butterdays.example", "blackridge": "blackridge.example", "outbound": "outbound.example"}
TALL = {"butter-days": "phone-home", "blackridge": "phone-home", "outbound": "phone-home"}
FONT = "C:/Windows/Fonts/segoeui.ttf"

PAPER = (246, 245, 242)
BAR = (238, 237, 234)
DOT = (214, 212, 207)
PILL = (247, 246, 243)
INK_SOFT = (96, 97, 102)


def save(im, path, q=80):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.convert("RGB").save(path, "WEBP", quality=q, method=6)


def fit_w(im, w):
    return im if im.width == w else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)


def browser_cover(shot, domain):
    """The first screen in the site's browser frame, 2400x1500 (the frame's bar 80 px)."""
    W, H, bar = 2400, 1500, 80
    im = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, W, bar), fill=BAR)
    for i in range(3):
        cx = 40 + i * 30
        d.ellipse((cx - 10, bar / 2 - 10, cx + 10, bar / 2 + 10), fill=DOT)
    pw, ph = 840, 50
    x0 = (W - pw) / 2
    d.rounded_rectangle((x0, bar / 2 - ph / 2, x0 + pw, bar / 2 + ph / 2), radius=ph / 2, fill=PILL)
    f = ImageFont.truetype(FONT, 25)
    tw = d.textlength(domain, font=f)
    d.text(((W - tw) / 2, bar / 2 - 16), domain, font=f, fill=INK_SOFT)
    d.line((0, bar, W, bar), fill=(225, 223, 219), width=2)
    s = fit_w(shot, W).crop((0, 0, W, H - bar))
    im.paste(s, (0, bar))
    return im


def phone_cover(shot):
    """The phone view in a phone frame on paper, 1200x1500."""
    W, H = 1200, 1500
    bg = Image.new("RGB", (W, H), (234, 231, 225))
    pw, ph = 600, 1260
    x0, y0 = (W - pw) // 2, 130
    # a soft shadow under the phone
    sh = Image.new("L", (W, H), 0)
    ImageDraw.Draw(sh).rounded_rectangle((x0 + 10, y0 + 40, x0 + pw - 10, y0 + ph + 30), radius=96, fill=90)
    sh = sh.filter(ImageFilter.GaussianBlur(40))
    bg.paste((200, 196, 188), (0, 0), sh)
    d = ImageDraw.Draw(bg)
    d.rounded_rectangle((x0, y0, x0 + pw, y0 + ph), radius=92, fill=(14, 15, 18))
    inset = 18
    sw, shh = pw - 2 * inset, ph - 2 * inset
    s = fit_w(shot, sw).crop((0, 0, sw, shh))
    mask = Image.new("L", (sw, shh), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, sw - 1, shh - 1), radius=76, fill=255)
    bg.paste(s, (x0 + inset, y0 + inset), mask)
    return bg


def sheet(im):
    """A printed page: the print-stylesheet capture with A4 margins, on paper, with a soft shadow."""
    m = round(im.width * 0.07)
    pw, ph = im.width + 2 * m, round((im.width + 2 * m) * 297 / 210)
    page = Image.new("RGB", (pw, ph), (255, 255, 255))
    page.paste(im.crop((0, 0, im.width, ph - 2 * m)), (m, m))
    pad = round(pw * 0.08)
    bg = Image.new("RGB", (pw + 2 * pad, ph + 2 * pad), (234, 231, 225))
    sh = Image.new("L", bg.size, 0)
    ImageDraw.Draw(sh).rectangle((pad + 10, pad + 30, pad + pw - 10, pad + ph + 20), fill=80)
    bg.paste((196, 192, 184), (0, 0), sh.filter(ImageFilter.GaussianBlur(36)))
    bg.paste(page, (pad, pad))
    return bg


def run(shots, slug):
    src = os.path.join(shots, slug)
    dst = os.path.join(OUT, slug)
    os.makedirs(dst, exist_ok=True)
    n = 0
    for f in sorted(os.listdir(src)):
        if not f.endswith(".png"):
            continue
        name = f[:-4]
        im = Image.open(os.path.join(src, f)).convert("RGB")
        if name == "home":
            home = fit_w(im, 2400)
            save(home, os.path.join(dst, "home.webp"), 80)
            save(fit_w(im, 1200), os.path.join(dst, "home-1200.webp"), 80)
            save(browser_cover(im, DOMAIN[slug]), os.path.join(OUT, f"{slug}.webp"), 82)
        elif name.startswith("page-"):
            save(fit_w(im, 1200), os.path.join(dst, f"{name}.webp"), 78)
        elif name.startswith("phone-"):
            ph = fit_w(im, 780)
            save(ph.crop((0, 0, 780, min(ph.height, 1688))), os.path.join(dst, f"{name}.webp"), 80)
            if name == TALL.get(slug):
                save(phone_cover(im), os.path.join(OUT, f"{slug}-tall.webp"), 82)
        elif name.startswith("f-"):
            if name == "f-print":
                im = sheet(im)
            big = fit_w(im, min(2000, im.width))
            save(big, os.path.join(dst, f"{name}.webp"), 80)
            save(fit_w(im, min(1000, im.width)), os.path.join(dst, f"{name}-1000.webp"), 80)
        n += 1
    total = sum(os.path.getsize(os.path.join(dst, x)) for x in os.listdir(dst))
    print(f"{slug}: {n} pictures, {total / 1e6:.2f} MB in public/work/{slug}/")


if __name__ == "__main__":
    shots = sys.argv[1]
    for slug in sys.argv[2:] or list(DOMAIN):
        run(shots, slug)
