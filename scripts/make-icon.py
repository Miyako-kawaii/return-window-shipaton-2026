"""Original geometric artwork, no third-party images or fonts."""
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
target = root / 'assets'
target.mkdir(exist_ok=True)
scale = 3
im = Image.new('RGB', (1024*scale, 1024*scale), '#164c40')
d = ImageDraw.Draw(im)
def box(coords):
    return tuple(round(v*scale) for v in coords)
def line(points, color, width):
    d.line([box(p) for p in points], fill=color, width=width*scale, joint='curve')
cream = '#f5f4e9'
green = '#164c40'
d.rounded_rectangle(box((200,228,824,814)), radius=76*scale, fill=cream)
d.rounded_rectangle(box((283,159,327,291)), radius=22*scale, fill=cream)
d.rounded_rectangle(box((697,159,741,291)), radius=22*scale, fill=cream)
line([(247,354),(777,354)],green,16)
d.arc(box((359,437,683,731)),start=208,end=510,fill=green,width=46*scale)
d.polygon([box(p) for p in [(356,460),(356,585),(479,567)]],fill=green)
im.resize((1024,1024),Image.Resampling.LANCZOS).save(target/'return-window-icon-1024.png')
with Image.open(target/'return-window-icon-1024.png') as check:
    assert check.size == (1024,1024) and check.mode == 'RGB'
print(str(target/'return-window-icon-1024.png'))
