import os, sys
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
for f in sorted(os.listdir(src)):
    if not f.endswith(".png"):
        continue
    im = Image.open(os.path.join(src, f)).convert("RGB")
    # exact 16:10, 2400 wide
    h = round(im.width / 1.6)
    im = im.crop((0, 0, im.width, min(h, im.height))).resize((2400, 1500), Image.LANCZOS)
    out = os.path.join(dst, f.replace(".png", ".webp"))
    im.save(out, "WEBP", quality=84, method=6)
    print(out, os.path.getsize(out) // 1024, "KB")
