"""Contact sheet: python sheet.py out.png cols thumbW img1 img2 ... (labels = file names)."""
import sys
from PIL import Image, ImageDraw

out, cols, tw = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
ims = [Image.open(p).convert("RGB") for p in sys.argv[4:]]
th = int(tw * ims[0].height / ims[0].width)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (tw + 10) + 10, rows * (th + 34) + 10), (200, 200, 200))
d = ImageDraw.Draw(sheet)
for i, (im, p) in enumerate(zip(ims, sys.argv[4:])):
    x, y = 10 + (i % cols) * (tw + 10), 10 + (i // cols) * (th + 34)
    sheet.paste(im.resize((tw, th), Image.LANCZOS), (x, y + 24))
    d.text((x, y + 4), p.replace("\\", "/").split("/")[-1], fill=(0, 0, 0))
sheet.save(out)
print(out, sheet.size)
