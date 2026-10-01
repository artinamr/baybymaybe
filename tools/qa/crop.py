import sys
from PIL import Image
im = Image.open(sys.argv[1]); y0, y1 = int(sys.argv[3]), int(sys.argv[4])
im.crop((0, y0, im.width, min(y1, im.height))).save(sys.argv[2]); print(sys.argv[2])
