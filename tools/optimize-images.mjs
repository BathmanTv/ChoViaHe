// Pipeline images ChoViaHe: PNG crayonnés + JPG photos -> AVIF + WebP responsive
// Usage: node tools/optimize-images.mjs
import sharp from 'sharp';
import { readdirSync, mkdirSync, statSync } from 'fs';
import { join, parse } from 'path';

const JOBS = [
  { src: 'img/Illus Oriane', out: 'site/assets/illus', widths: [480, 960, 1440], avifQ: 60, webpQ: 78 },
  { src: 'img/Photo Jean',   out: 'site/assets/photos', widths: [480, 960, 1600], avifQ: 50, webpQ: 72 },
];

const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

for (const job of JOBS) {
  mkdirSync(job.out, { recursive: true });
  const files = readdirSync(job.src).filter(f => /\.(png|jpe?g)$/i.test(f));
  for (const f of files) {
    const inPath = join(job.src, f);
    const base = slug(parse(f).name);
    const meta = await sharp(inPath).metadata();
    for (const w of job.widths) {
      if (meta.width < w && w !== job.widths[0]) continue; // pas d'upscale
      const width = Math.min(w, meta.width);
      const pipe = sharp(inPath).resize({ width });
      await pipe.clone().avif({ quality: job.avifQ }).toFile(join(job.out, `${base}-${w}.avif`));
      await pipe.clone().webp({ quality: job.webpQ }).toFile(join(job.out, `${base}-${w}.webp`));
    }
    const kb = Math.round(statSync(inPath).size / 1024);
    console.log(`${f} (${kb} KB, ${meta.width}px) -> ${base}-*.{avif,webp}`);
  }
}
console.log('Done.');
