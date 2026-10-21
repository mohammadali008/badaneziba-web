"""Render the original GPU 3D wax sculpture to a seamless, silent H.264 loop.

Development only: pip install --target scripts/.render-deps moderngl
The deployed website needs no Python, WebGL, renderer, or external dependencies.
"""
from pathlib import Path
import argparse
import math
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts' / '.render-deps'))
import moderngl
import imageio_ffmpeg
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('--poster-only', action='store_true')
args = parser.parse_args()
width, height, fps, seconds = 1280, 960, 24, 16
context = moderngl.create_standalone_context(require=330)
print('Rendering with:', context.info['GL_RENDERER'], flush=True)
program = context.program(vertex_shader='''#version 330
in vec2 position;
void main(){gl_Position=vec4(position,0.0,1.0);}
''', fragment_shader=(ROOT / 'scripts' / 'wax-scene.frag').read_text())
import struct
buffer = context.buffer(struct.pack('8f', -1, -1, 1, -1, -1, 1, 1, 1))
mesh = context.simple_vertex_array(program, buffer, 'position')
framebuffer = context.simple_framebuffer((width, height), components=3)
framebuffer.use()
program['resolution'].value = (width, height)

def render(phase):
    program['phase'].value = phase
    mesh.render(moderngl.TRIANGLE_STRIP)
    raw = framebuffer.read(components=3, alignment=1)
    return Image.frombytes('RGB', (width,height),raw).transpose(Image.Transpose.FLIP_TOP_BOTTOM)

output = ROOT / 'assets' / 'media'
output.mkdir(exist_ok=True, parents=True)
render(0.0).save(output / 'wax-sculpture-poster.webp', quality=92)
if args.poster_only:
    print('Poster complete.', flush=True)
    sys.exit()
writer = imageio_ffmpeg.write_frames(str(output / 'wax-sculpture-3d.mp4'), (width,height), fps=fps,
    codec='libx264', quality=7, pix_fmt_in='rgb24', pix_fmt_out='yuv420p',
    output_params=['-movflags','+faststart','-an','-crf','22'])
writer.send(None)
start = time.monotonic()
for frame in range(fps*seconds):
    writer.send(render(2*math.pi*frame/(fps*seconds)).tobytes())
    if frame % (fps*2) == 0:
        print(f'{frame}/{fps*seconds} frames · {time.monotonic()-start:.1f}s',flush=True)
writer.close()
print('Saved:',output / 'wax-sculpture-3d.mp4', flush=True)
