"""Crop, grade and encode the site's photographs (CC0 originals in orig/).
usage: python mkimages.py <outRoot> [only-name,...]
Each spec: output path (under outRoot), source, aspect, sizes (widths), focal point (fx, fy in 0..1),
zoom (>= 1) and saturation. Writes <path>.webp at the first width and <path>-<w>.webp for the others."""
import os, sys
from PIL import Image
from grade import grade

S = 0.62  # the site's grade: muted colour
SPECS = [
    # blog covers, 24:11 (2400 and 1200 wide)
    ("blog/redesign-or-improve", "laptop-notebook-white", (24, 11), (2400, 1200), (0.5, 0.36), 1.0, S),
    ("blog/website-quote-checklist", "notepad-glass", (24, 11), (2400, 1200), (0.5, 0.38), 1.0, S),
    ("blog/when-you-need-a-client-portal", "analytics-dark", (24, 11), (2400, 1200), (0.5, 1.0), 1.0, S),
    ("blog/connect-website-crm-booking", "ipad-calendar", (24, 11), (2400, 1200), (0.5, 0.5), 1.0, S),
    ("blog/ai-automation-workflows", "desk-lamp-dark", (24, 11), (2400, 1200), (0.42, 0.55), 1.0, S),
    ("blog/after-launch-ownership", "key-door", (24, 11), (2400, 1200), (0.5, 0.64), 1.0, S),
    # methodology: the banner (24:11) and five stages (4:5)
    ("method/hero", "laptop-notes", (24, 11), (2400, 1200), (0.5, 0.42), 1.0, S),
    ("method/discover", "writing-planner", (4, 5), (1296, 648), (0.5, 0.5), 1.0, S),
    ("method/define", "chair-notebook", (4, 5), (1296, 648), (0.5, 0.5), 1.0, S),
    ("method/design", "whiteboard-webdesign", (4, 5), (1296, 648), (0.62, 0.5), 1.0, 0.42),
    ("method/build", "laptop-white-code", (4, 5), (1296, 648), (0.6, 0.5), 1.0, S),
    ("method/live", "phone-hands-white", (4, 5), (1296, 648), (0.33, 0.5), 1.0, S),
    # services: banners (24:11) and cards (4:5)
    ("services/websites-wide", "wireframe-mockups", (24, 11), (2400, 1200), (0.5, 0.45), 1.0, S),
    ("services/websites", "wireframe-mockups", (4, 5), (1200, 600), (0.45, 0.5), 1.0, S),
    ("services/platforms-wide", "charts-laptop-bright", (24, 11), (2400, 1200), (0.5, 0.45), 1.0, S),
    ("services/platforms", "charts-laptop-bright", (4, 5), (1200, 600), (0.32, 0.5), 1.0, S),
    ("services/ai-automation-wide", "laptop-shadow", (24, 11), (2400, 1200), (0.55, 0.37), 1.12, S),
    ("services/ai-automation", "laptop-shadow", (4, 5), (1200, 600), (0.74, 0.34), 1.45, S),
]


def crop(im, aspect, focal, zoom):
    W, H = im.size
    a = aspect[0] / aspect[1]
    if W / H > a:  # source wider: full height
        h = H / zoom
        w = h * a
    else:
        w = W / zoom
        h = w / a
    cx, cy = focal[0] * W, focal[1] * H
    x0 = min(max(cx - w / 2, 0), W - w)
    y0 = min(max(cy - h / 2, 0), H - h)
    return im.crop((round(x0), round(y0), round(x0 + w), round(y0 + h)))


def main():
    root = sys.argv[1]
    only = set(sys.argv[2].split(",")) if len(sys.argv) > 2 else None
    for path, src, aspect, widths, focal, zoom, sat in SPECS:
        if only and path not in only and path.split("/")[-1] not in only:
            continue
        im = Image.open(f"orig/{src}.jpg").convert("RGB")
        c = crop(im, aspect, focal, zoom)
        for i, w in enumerate(widths):
            h = round(w * aspect[1] / aspect[0])
            out = grade(c.resize((w, h), Image.LANCZOS), sat)
            name = f"{root}/{path}.webp" if i == 0 else f"{root}/{path}-{w}.webp"
            os.makedirs(os.path.dirname(name), exist_ok=True)
            # Pillow writes no EXIF/XMP unless asked: the files carry no camera or location data.
            out.save(name, "WEBP", quality=78 if w >= 2000 else 80, method=6)
            print(f"{name}  {w}x{h}  {os.path.getsize(name)//1024} KB")


if __name__ == "__main__":
    main()
