// Rend les pages 1-2 du PDF de la carte et échantillonne la couleur de fond
// dominante — c'est elle qui doit servir de référence pour --papier.
// Usage : node tools/pdf-bg-color.mjs [chemin.pdf]
import { pdf } from 'pdf-to-img';
import sharp from 'sharp';
import { writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const arg = process.argv[2];
const src = arg || join('img', readdirSync('img').find((f) => /rentr.*\.pdf$/i.test(f)));
console.log('source :', src, '\n');

const doc = await pdf(src, { scale: 1.5 });
const pages = [];
for await (const p of doc) {
  pages.push(p);
  if (pages.length >= 2) break;
}

const hex = (r, g, b) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();

for (let n = 0; n < pages.length; n++) {
  const out = `_pdf-page${n + 1}.png`;
  writeFileSync(out, pages[n]);
  const img = sharp(out);
  const { width, height } = await img.metadata();
  const raw = await img.raw().toBuffer();
  const ch = raw.length / (width * height);

  // Couleur la plus fréquente sur toute la page : le fond domine en surface.
  const compte = new Map();
  for (let y = 0; y < height; y += 3) {
    for (let x = 0; x < width; x += 3) {
      const i = (y * width + x) * ch;
      const k = `${raw[i]},${raw[i + 1]},${raw[i + 2]}`;
      compte.set(k, (compte.get(k) || 0) + 1);
    }
  }
  const total = [...compte.values()].reduce((a, b) => a + b, 0);
  const top = [...compte.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);

  console.log(`page ${n + 1} (${width}x${height}) — couleurs dominantes :`);
  for (const [k, c] of top) {
    const [r, g, b] = k.split(',').map(Number);
    console.log(`   ${hex(r, g, b)}  ${((c / total) * 100).toFixed(1)} %`);
  }
  console.log('');
}
