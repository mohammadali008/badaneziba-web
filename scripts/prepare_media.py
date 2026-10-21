"""Prepare web assets and a silent motion reel from the supplied salon photos."""
from pathlib import Path
from PIL import Image, ImageOps
import imageio_ffmpeg
import math

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'media'
OUT.mkdir(parents=True, exist_ok=True)

images = {}
for name in ['avatar', 'room', 'room2', 'sample', 'logo']:
    image = ImageOps.exif_transpose(Image.open(ROOT / 'img' / f'{name}.jpg')).convert('RGB')
    image.thumbnail((1800, 1800), Image.Resampling.LANCZOS)
    image.save(OUT / f'{name}.webp', 'WEBP', quality=87, method=6)
    images[name] = image

width, height, fps = 1280, 720, 24
shots = [images['room'], images['avatar'], images['room2']]
shot_frames = fps * 5
transition_frames = fps

def frame_at(image, progress, index):
    zoom = 1.025 + 0.045 * progress
    ratio = width / height
    crop_width = min(image.width, image.height * ratio) / zoom
    crop_height = crop_width / ratio
    center_x = image.width * (0.50 + 0.015 * math.sin(progress * math.pi))
    center_y = image.height * (0.38 if index == 1 else 0.51)
    left = max(0, min(image.width - crop_width, center_x - crop_width / 2))
    top = max(0, min(image.height - crop_height, center_y - crop_height / 2))
    return image.crop((left, top, left + crop_width, top + crop_height)).resize((width, height), Image.Resampling.BICUBIC)

writer = imageio_ffmpeg.write_frames(str(OUT / 'salon-film.mp4'), (width, height), fps=fps,
    codec='libx264', pix_fmt_in='rgb24', pix_fmt_out='yuv420p', quality=7,
    output_params=['-movflags', '+faststart', '-an'])
writer.send(None)
for index, shot in enumerate(shots):
    for frame in range(shot_frames):
        result = frame_at(shot, frame / shot_frames, index)
        if frame >= shot_frames - transition_frames:
            blend = (frame - shot_frames + transition_frames) / transition_frames
            blend = blend * blend * (3 - 2 * blend)
            upcoming = frame_at(shots[(index + 1) % len(shots)], 0, (index + 1) % len(shots))
            result = Image.blend(result, upcoming, blend)
        writer.send(result.tobytes())
writer.close()
print('Prepared five WebP images and a 15-second photo motion reel.')
