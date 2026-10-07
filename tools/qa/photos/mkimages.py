"""Crop, grade and encode the site's photographs (CC0 / public-domain originals in orig/).
usage: python mkimages.py <outRoot> [only-name,...]
Each spec: output path (under outRoot), source, aspect, sizes (widths), focal point (fx, fy in 0..1),
zoom (>= 1) and saturation. Writes <path>.webp at the first width and <path>-<w>.webp for the others.
The set below is round 20's (the sources and licences are in content/images.ts)."""
import os, sys
from PIL import Image, ImageFilter
from grade import grade

S = 0.86  # the site's grade (v2): a little colour taken out, full tonal range
SPECS = [
    # blog covers, 24:11 (2400 and 1200 wide)
    # cropped left of the second crane's jib (a company's web address) and above the scaffold banners (its name)
    ("blog/redesign-or-improve", "cranes-building", (24, 11), (2400, 1200), (0.48, 0.406), 1.667, 0.72),
    ("blog/website-quote-checklist", "checklist", (24, 11), (2400, 1200), (0.55, 0.5), 1.0, S),
    ("blog/when-you-need-a-client-portal", "muriwai-mailboxes", (24, 11), (2400, 1200), (0.5, 0.56), 1.0, S),
    ("blog/connect-website-crm-booking", "bridge-mist", (24, 11), (2400, 1200), (0.5, 0.5), 1.0, S),
    ("blog/ai-automation-workflows", "robot-arm", (24, 11), (2400, 1200), (0.5, 0.3), 1.0, S),
    ("blog/after-launch-ownership", "keys-hand", (24, 11), (2400, 1200), (0.45, 0.58), 1.0, 0.72),
    # October 2026: what-is-seo (signpost), google-business-profile (wayfinding), diy-website-or-hire (workshop)
    ("blog/what-is-seo", "signpost-peaks", (24, 11), (2400, 1200), (0.5, 0.5), 1.0, S),
    ("blog/google-business-profile", "map-pins", (24, 11), (2400, 1200), (0.5, 0.45), 1.0, S),
    ("blog/diy-website-or-hire", "woodworker", (24, 11), (2400, 1200), (0.5, 0.5), 1.0, 0.8),
    # methodology: the banner (24:11) and five stages (4:5)
    ("method/hero", "stairs-white", (24, 11), (2400, 1200), (0.5, 0.5), 1.0, S),
    ("method/discover", "telescope", (4, 5), (1296, 648), (0.6, 0.5), 1.0, S),
    ("method/define", "compass-hand", (4, 5), (1296, 648), (0.48, 0.5), 1.0, S),
    ("method/design", "wireframe-notebook", (4, 5), (1296, 648), (0.62, 0.5), 1.0, 0.7),
    ("method/build", "spiral-stairs", (4, 5), (1296, 648), (0.53, 0.5), 1.0, S),
    ("method/live", "lighthouse-ca", (4, 5), (1296, 648), (0.8, 0.5), 1.0, S),
    # services: banners (24:11) and cards (4:5)
    ("services/websites-wide", "laptop-open", (24, 11), (2400, 1200), (0.5, 0.45), 1.0, S),
    ("services/websites", "laptop-open", (4, 5), (1200, 600), (0.55, 0.5), 1.0, S),
    ("services/platforms-wide", "oculus", (24, 11), (2400, 1200), (0.5, 0.55), 1.0, S),
    ("services/platforms", "oculus", (4, 5), (1200, 600), (0.5, 0.5), 1.0, S),
    ("services/ai-automation-wide", "robot-cleanroom", (24, 11), (2400, 1200), (0.5, 0.45), 1.0, S),
    ("services/ai-automation", "robot-cleanroom", (4, 5), (1200, 600), (0.74, 0.5), 1.0, S),
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
            # Downscaled photos go a little soft: a fine sharpen at the size it is shown.
            out = grade(c.resize((w, h), Image.LANCZOS), sat).filter(ImageFilter.UnsharpMask(radius=0.7, percent=45, threshold=3))
            name = f"{root}/{path}.webp" if i == 0 else f"{root}/{path}-{w}.webp"
            os.makedirs(os.path.dirname(name), exist_ok=True)
            # Pillow writes no EXIF/XMP unless asked: the files carry no camera or location data.
            # Detailed photos (foliage, scaffolding, surf) come out large: step the quality down until
            # the large size is under about 220 KB and the half size under about 90 KB.
            limit = 225_000 if w >= 2000 else 92_000
            for q in (78, 74, 70, 66):
                out.save(name, "WEBP", quality=q if w >= 2000 else q + 2, method=6)
                if os.path.getsize(name) <= limit:
                    break
            print(f"{name}  {w}x{h}  {os.path.getsize(name)//1024} KB")


if __name__ == "__main__":
    main()
