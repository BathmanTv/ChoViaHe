/* Extrait la matière papier de « Fond Carte CHO.png » — le carnet ancien qui
   sert de référence à la cliente — et en fait une tuile répétable.

   Principe : la tuile est posée en mix-blend-mode: overlay par-dessus la
   couleur --papier. Elle doit donc être GRISE et centrée sur 128 : un pixel
   à 128 ne change rien, au-dessus éclaircit, en dessous assombrit. Si elle
   n'est pas recentrée, elle assombrit ou délave toute la page.

   Le grain réel du carnet a un écart-type de ~2,5 : c'est très subtil. On ne
   garde qu'une fraction de l'amplitude, sinon la matière se voit au lieu de
   se sentir.

   Usage : node tools/texture-carnet.mjs
*/
import sharp from 'sharp';

const SRC = 'img/Fond Carte CHO.png';
const SORTIE = 'docs/assets/papier-tile.webp';

// Zones de page propre, loin de la reliure, des bords et des grosses taches.
const CANDIDATS = [
  { left: 200, top: 150, width: 300, height: 220 },
  { left: 180, top: 400, width: 340, height: 260 },
  { left: 900, top: 380, width: 340, height: 280 },
  { left: 880, top: 150, width: 300, height: 200 },
];

// On retient la zone la plus uniforme : la matière, pas une tache.
let meilleure = null;
for (const z of CANDIDATS) {
  const buf = await sharp(SRC).extract(z).png().toBuffer();
  const st = await sharp(buf).greyscale().stats();
  const sd = st.channels[0].stdev;
  console.log(`zone ${z.left},${z.top}  écart-type ${sd.toFixed(2)}`);
  if (!meilleure || sd < meilleure.sd) meilleure = { z, sd };
}
console.log('→ retenue :', JSON.stringify(meilleure.z), 'écart-type', meilleure.sd.toFixed(2), '\n');

const COTE = 340;

// Amplitude : calée pour retrouver exactement la force perçue de l'ancienne
// tuile (écart-type mesuré 2,14). Seule la SOURCE change — on prend enfin la
// matière du vrai carnet de référence, plus celle de la couverture imprimée.
// En dessous la matière disparaît, au-dessus elle devient un bruit visible.
// Le recentrage se fait sur la moyenne RÉELLE de la zone (~230 : du papier
// clair), et non sur 128 : sinon la tuile ressort trop claire et délave la
// page au lieu de la texturer.
const AMPLI = 1.1;
const zoneBuf = await sharp(SRC).extract(meilleure.z).greyscale().png().toBuffer();
const moyenneSrc = (await sharp(zoneBuf).stats()).channels[0].mean;
console.log(`moyenne de la zone source : ${moyenneSrc.toFixed(1)} → recentrée sur 128`);

const patch = await sharp(zoneBuf)
  .resize(COTE, COTE, { fit: 'fill' })
  .linear(AMPLI, 128 - AMPLI * moyenneSrc)
  .removeAlpha()
  .toColourspace('b-w')
  .png()
  .toBuffer();

// Miroir sur les 4 quadrants : les bords se raccordent, plus de couture
// visible quand la tuile se répète.
const [q2, q3, q4] = await Promise.all([
  sharp(patch).flop().png().toBuffer(),
  sharp(patch).flip().png().toBuffer(),
  sharp(patch).flop().flip().png().toBuffer(),
]);

const tuile = await sharp({
  create: { width: COTE * 2, height: COTE * 2, channels: 3, background: '#808080' },
})
  .composite([
    { input: patch, left: 0, top: 0 },
    { input: q2, left: COTE, top: 0 },
    { input: q3, left: 0, top: COTE },
    { input: q4, left: COTE, top: COTE },
  ])
  .webp({ quality: 72 })
  .toBuffer();

await sharp(tuile).toFile(SORTIE);

const ctrl = await sharp(tuile).stats();
console.log(`${SORTIE} — ${COTE * 2}x${COTE * 2}, ${(tuile.length / 1024).toFixed(1)} Ko`);
console.log(`moyenne ${ctrl.channels[0].mean.toFixed(1)} (doit être proche de 128),`,
  `écart-type ${ctrl.channels[0].stdev.toFixed(2)}`);
