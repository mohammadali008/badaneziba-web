"""Animate ImageGen's four original cel keyframes into the salon's silent hero film."""
from pathlib import Path
import math
import numpy as np
from PIL import Image, ImageDraw
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'media'
sheet = Image.open(OUT / 'anime-wax-sprites.png').convert('RGBA')
cell_w, cell_h = sheet.width // 2, sheet.height // 2
sprites = []
for row, col in [(0,0),(0,1),(1,0),(1,1)]:
    cell = sheet.crop((col*cell_w, row*cell_h, (col+1)*cell_w, (row+1)*cell_h))
    # Sprite-cell extraction only; all character drawing comes from ImageGen.
    sprites.append(cell.crop((75,0,610,cell_h)).resize((674,790),Image.Resampling.LANCZOS))

W,H,FPS,SECONDS = 1280,960,24,12
yy,xx = np.mgrid[0:H,0:W]
glow = np.exp(-(((xx-W*.5)/(W*.40))**2+((yy-H*.56)/(H*.56))**2)*2)
rgb = np.stack([16+glow*20,16+glow*3,15+glow],axis=-1).astype('uint8')
base = Image.fromarray(rgb).convert('RGBA')
draw=ImageDraw.Draw(base)
draw.ellipse((240,130,1040,930),outline=(86,41,29,255),width=2)
draw.arc((265,155,1015,905),205,290,fill=(204,70,39,255),width=3)

# Explicit cel timing: held drawings, short blinks, and a gentle wax-strip gesture.
# The loop begins and ends with the same drawing and breathing phase.
timeline=[(0.0,0),(.90,0),(1.02,1),(1.13,2),(1.28,1),(1.42,3),
          (2.45,3),(2.57,1),(2.68,2),(2.82,1),(3.0,0),(4.0,0)]
def drawing_at(time):
    for i in range(len(timeline)-1):
        start,a=timeline[i]; end,b=timeline[i+1]
        if start<=time<end:
            # Held anime cels keep the hand and wax strip crisp, without double contours.
            return sprites[a]
    return sprites[0]

def render(index):
    time=index/FPS
    breathing=math.sin(time/4*math.tau)
    cel=drawing_at(time%4)
    scale=1+0.004*breathing
    cel=cel.resize((round(674*scale),round(790*scale)),Image.Resampling.BICUBIC)
    frame=base.copy()
    frame.alpha_composite(cel,((W-cel.width)//2,round(92-3*breathing)))
    # Small clean-side highlights communicate the waxing result without altering anatomy.
    sparkle=Image.new('RGBA',(W,H))
    pen=ImageDraw.Draw(sparkle)
    for x,y,offset in [(793,462,0),(837,520,1.5),(765,565,3)]:
        strength=max(0,math.sin(time*math.pi/2+offset))**8
        r=round(3+5*strength)
        alpha=round(200*strength)
        pen.polygon([(x,y-r),(x+2,y-2),(x+r,y),(x+2,y+2),(x,y+r),(x-2,y+2),(x-r,y),(x-2,y-2)],fill=(255,236,192,alpha))
    return Image.alpha_composite(frame,sparkle).convert('RGB')

render(0).save(OUT/'anime-wax-poster.webp',quality=92)
writer=imageio_ffmpeg.write_frames(str(OUT/'anime-wax-film.mp4'),(W,H),fps=FPS,codec='libx264',
    quality=7,pix_fmt_in='rgb24',pix_fmt_out='yuv420p',output_params=['-movflags','+faststart','-an','-crf','22'])
writer.send(None)
for index in range(FPS*SECONDS):
    writer.send(render(index).tobytes())
writer.close()
print('Created 12-second anime cel film and poster from four original ImageGen drawings.')
