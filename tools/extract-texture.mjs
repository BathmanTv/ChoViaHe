// Extrait une matière papier SUBTILE depuis la couverture de la carte (zone sans texte).
// Choisit automatiquement la zone la plus uniforme (écart-type le plus faible),
// puis écrase le contraste : la texture doit se sentir, pas se voir.
import sharp from 'sharp';

const SRC = '_carte-p1.png';
const CANDIDATS = [
  { left: 150, top: 800, width: 420, height: 260 },
  { left: 420, top: 830, width: 420, height: 260 },
  { left: 560, top: 90,  width: 260, height: 180 },
  { left: 150, top: 120, width: 260, height: 150 },
  { left: 430, top: 950, width: 380, height: 220 },
];

let best = null;
for (const z of CANDIDATS) {
  const st = await sharp(SRC).extract(z).greyscale().stats();
  const sd = st.channels[0].stdev;
  console.log(`zone ${z.left},${z.top}  écart-type ${sd.toFixed(1)}`);
  if (!best || sd < best.sd) best = { z, sd };
}
console.log('→ retenue:', JSON.stringify(best.z), 'écart-type', best.sd.toFixed(1));

// patch adouci : flou léger + contraste écrasé autour du gris moyen
const patch = await sharp(SRC)
  .extract(best.z)
  .greyscale()
  .blur(0.8)
  .linear(0.30, 128 * 0.70)   // ne garde que 30% de l'amplitude, recentré sur 128
  .resize(560, 340, { fit: 'fill' })
  .removeAlpha()
  .toColourspace('srgb')
  .png()
  .toBuffer();

const w = 560, h = 340;
const q2 = await sharp(patch).flop().png().toBuffer();
const q3 = await sharp(patch).flip().png().toBuffer();
const q4 = await sharp(patch).flop().flip().png().toBuffer();

await sharp({ create: { width: w * 2, height: h * 2, channels: 3, background: '#808080' } })
  .composite([
    { input: patch, left: 0, top: 0 },
    { input: q2, left: w, top: 0 },
    { input: q3, left: 0, top: h },
    { input: q4, left: w, top: h },
  ])
  .blur(0.6)                    // fond les raccords de miroir
  .resize(700, 425)
  .webp({ quality: 78 })
  .toFile('docs/assets/papier-tile.webp');

const st = await sharp('docs/assets/papier-tile.webp').stats();
const { size } = await sharp('docs/assets/papier-tile.webp').metadata();
console.log('tuile finale: 700x425 —', Math.round((size || 0) / 1024), 'KB — écart-type final',
  st.channels[0].stdev.toFixed(1), '(cible < 8 = subtil)');
