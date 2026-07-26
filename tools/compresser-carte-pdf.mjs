// Reconstruit le PDF de la carte en version légère pour le téléchargement web :
// chaque page est rendue en image, compressée en JPEG, puis réassemblée.
import { pdf } from 'pdf-to-img';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { readdirSync, writeFileSync, statSync } from 'fs';

const dir = 'docs/carte';
const src = `${dir}/${readdirSync(dir).find(f => f.endsWith('.pdf'))}`;
const OUT = 'docs/assets/carte-cho-via-he.pdf';

const doc = await pdf(src, { scale: 2 });          // ~1680px de large, net à l'écran
const out = await PDFDocument.create();
let n = 0;

for await (const page of doc) {
  n++;
  const jpg = await sharp(page).jpeg({ quality: 78, mozjpeg: true }).toBuffer();
  const img = await out.embedJpg(jpg);
  const p = out.addPage([img.width / 2, img.height / 2]);   // A4 à l'échelle
  p.drawImage(img, { x: 0, y: 0, width: img.width / 2, height: img.height / 2 });
}

out.setTitle('Chợ Vỉa Hè — La carte');
out.setSubject('Carte du restaurant Chợ Vỉa Hè, 8 rue de Metz, Toulouse');
writeFileSync(OUT, await out.save());

const avant = statSync(src).size / 1024 / 1024;
const apres = statSync(OUT).size / 1024 / 1024;
console.log(`${n} pages — ${avant.toFixed(1)} Mo → ${apres.toFixed(1)} Mo (${Math.round((1 - apres / avant) * 100)}% de moins)`);
