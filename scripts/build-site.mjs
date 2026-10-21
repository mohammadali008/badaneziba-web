import { mkdir, copyFile, cp, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'dist');
await mkdir(path.join(out, 'assets/media'), { recursive: true });
for (const name of ['index.html', '404.html', 'styles.css', 'art-direction.css', 'app.js', 'site-config.js', 'robots.txt', 'sitemap.xml']) {
  await copyFile(path.join(root, name), path.join(out, name));
}
await cp(path.join(root, 'assets/fonts'), path.join(out, 'assets/fonts'), { recursive: true });
for (const name of ['logo.webp', 'avatar.webp', 'avatar-face.webp', 'sample.webp', 'room.webp', 'room2.webp', 'salon-film.mp4', 'anime-wax-film.mp4', 'anime-wax-poster.webp']) {
  await copyFile(path.join(root, 'assets/media', name), path.join(out, 'assets/media', name));
}
let files = 0, bytes = 0;
async function inspect(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const filename = path.join(dir, item.name);
    if (item.isDirectory()) await inspect(filename);
    else { files++; bytes += (await stat(filename)).size; }
  }
}
await inspect(out);
console.log(`Static site ready: dist (${files} files, ${(bytes / 1024 / 1024).toFixed(2)} MiB)`);
