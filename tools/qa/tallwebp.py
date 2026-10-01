"""Set a phone-frame capture on a soft 4:5 card: python tallwebp.py in.png out.webp"""
import sys
from PIL import Image, ImageFilter

src, dst = sys.argv[1], sys.argv[2]
phone = Image.open(src).convert("RGBA")
W, H = 1200, 1500
card = Image.new("RGBA", (W, H), (236, 233, 226, 255))
scale = (H * 0.84) / phone.height
phone = phone.resize((round(phone.width * scale), round(phone.height * scale)), Image.LANCZOS)
x, y = (W - phone.width) // 2, round(H * 0.1)
# a soft shadow under the device
sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
mask = phone.split()[3].point(lambda a: int(a * 0.28))
sh.paste((20, 22, 30, 255), (x, y + 40), mask)
sh = sh.filter(ImageFilter.GaussianBlur(42))
card.alpha_composite(sh)
card.alpha_composite(phone, (x, y))
card.convert("RGB").save(dst, "WEBP", quality=86, method=6)
print(dst, card.size)
