// Rend la page 1 du PDF carte et échantillonne la couleur de fond dominante
import { pdf } from 'pdf-to-img';
import sharp from 'sharp';
import { writeFileSync } from 'fs';

const doc = await pdf('docs/carte/Copie de MAJ 01.26 CHO FR.pdf', { scale: 1.5 });
let n = 0;
for await (const page of doc) {
  n++;
  writeFileSync(`docs/carte/_pdf-page${n}.png`, page);
  if (n >= 2) break;
}

const img = sharp('docs/carte/_pdf-page1.png');
const { width, height } = await img.metadata();
const raw = await img.raw().toBuffer();
const ch = raw.length / (width * height); // 3 ou 4 canaux
// échantillonne des zones de bord (fond) : 4 coins + bords médians
const pts = [[20, 20], [width - 20, 20], [20, height - 20], [width - 20, height - 20], [width >> 1, 15], [15, height >> 1]];
const hex = (r, g, b) => '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
for (const [x, y] of pts) {
  const i = (y * width + x) * ch;
  console.log(`(${x},${y})`, hex(raw[i], raw[i + 1], raw[i + 2]));
}
// couleur moyenne d'une bande de bord haut (fond probable)
let r = 0, g = 0, b = 0, c = 0;
for (let y = 5; y < 40; y++) for (let x = 5; x < width - 5; x += 7) {
  const i = (y * width + x) * ch; r += raw[i]; g += raw[i + 1]; b += raw[i + 2]; c++;
}
console.log('moyenne bande haute:', hex(Math.round(r / c), Math.round(g / c), Math.round(b / c)), `(${width}x${height})`);
