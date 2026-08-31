/* Matière papier du site, extraite du carnet de référence (Fond Carte CHO.png).

   POURQUOI DEUX COUCHES.
   Le papier ancien se lit à deux échelles, et une seule ne suffit pas :

     · à l'échelle de la PAGE : de larges variations douces, des taches, des
       bords plus sombres. C'est ça qui dit « vieux carnet ». Une tuile qui se
       répète ne peut pas le porter — soit elle est trop plate, soit on voit
       la répétition.
     · à l'échelle du POUCE : le grain de la fibre. Là une tuile convient.

   La première version n'avait que la seconde couche, et pire : elle
   sélectionnait automatiquement la zone la PLUS UNIFORME du carnet. Elle
   jetait donc exactement ce qui faisait le caractère du papier. Résultat
   mesuré : écart-type 1,5 contre 8,2 pour la référence — invisible.

   Les deux sorties sont grises et centrées sur 128 : posées en
   mix-blend-mode: overlay, un pixel à 128 ne change rien, au-dessus
   éclaircit, en dessous assombrit.

   Usage : node tools/texture-carnet.mjs
*/
import sharp from 'sharp';

const SRC = 'img/Fond Carte CHO.png';
const FOND = 'docs/assets/papier-fond.webp';   // couche « page »
const GRAIN = 'docs/assets/papier-tile.webp';  // couche « fibre »

const hex = (v) => Math.round(v).toString(16).padStart(2, '0');

/* Recentre une couche sur `cible` en conservant `ampli` fois son amplitude.
   La valeur neutre dépend du mode de fusion :
     · multiply -> neutre = 255 (blanc). Une tuile centrée sur 128 diviserait
       la luminosité de la page par deux — c'est l'erreur qui a rendu le fond
       gris au premier essai.
     · overlay  -> neutre = 128, mais overlay écrase la modulation sur un
       fond clair : on ne l'utilise plus ici. */
async function centrer(buf, ampli, cible) {
  const moyenne = (await sharp(buf).stats()).channels[0].mean;
  return sharp(buf).linear(ampli, cible - ampli * moyenne).toColourspace('b-w').removeAlpha();
}

/* ---------------------------------------------------------------
   1. COUCHE PAGE — la vraie page, EN COULEUR, sans mode de fusion

   Première tentative : une couche grise en `mix-blend-mode: overlay`.
   Elle ne pouvait pas marcher, et c'est arithmétique. Sur un fond clair
   (#F1E3C9, canal rouge à 0,945) la formule overlay donne
       résultat = 1 − 2 × (1 − 0,945) × (1 − source) = 1 − 0,11 × (1 − source)
   soit une modulation divisée par ~10. Une texture d'écart-type 6 ressortait
   à 0,7 niveau sur 255 : invisible, quelle que soit l'amplitude injectée.

   On pose donc la page telle quelle, en couleur, opaque, en `cover`. C'est
   exactement la matière du carnet, sans arithmétique de fusion.
   --------------------------------------------------------------- */
/* Cadrage mesuré ligne par ligne sur le scan :
     y 0-20     bord noir du scan
     y 80       FILET ORNEMENTAL imprimé du carnet — c'est lui qui ressortait
                en travers du haut du site, il faut passer en dessous
     y 1008+    l'ombre du bord bas, puis le bord noir
   On prend donc 95 -> 1000, largeur 640 pour rester loin de la reliure. */
const PAGE = { left: 70, top: 95, width: 640, height: 905 };

const pageSrc = await sharp(SRC).extract(PAGE).png().toBuffer();
const stSrc = (await sharp(pageSrc).greyscale().stats()).channels[0];
console.log(`page source  : moyenne ${stSrc.mean.toFixed(1)}  écart-type ${stSrc.stdev.toFixed(2)}  min ${stSrc.min}`);

// Aucun adoucissement : mesuré, les 0,1 % de pixels les plus sombres du crop
// sont à 153/255, ce qui laisse au texte --encre un contraste de 6,1:1 —
// au-dessus du seuil AA de 4,5:1. La matière passe donc telle quelle.
/* PIXELLISATION EN GRAND FORMAT.
   Le scan source ne fait que 640 px de large. Étiré en `cover` sur un écran
   de 2560, chaque pixel d'origine couvre 4 pixels d'écran : le bruit fin du
   scan devient un damier visible.
   La parade n'est pas plus de résolution — il n'y en a pas dans la source —
   mais de RETIRER le détail fin avant d'agrandir. Cette couche ne doit
   porter que les basses fréquences : les taches et la dérive de ton. Le
   piqué vient de la couche de grain, elle rendue à 1:1.
   Le flou est appliqué à la résolution source, avant l'agrandissement.

   Corollaire : une fois floue, cette couche n'a plus rien à préserver. On
   la stocke PETITE et on laisse le navigateur l'agrandir — le rendu est le
   même qu'une image quatre fois plus lourde, pour un dixième du poids. */
const fond = await sharp(pageSrc)
  .blur(1.6)
  .resize(1100, 1560, { fit: 'fill', kernel: 'lanczos3' })
  .webp({ quality: 74 })
  .toBuffer();
await sharp(fond).toFile(FOND);

const stFond = (await sharp(fond).greyscale().stats()).channels[0];
console.log(`${FOND}`);
console.log(`  1100x1560, ${(fond.length / 1024).toFixed(1)} Ko — moyenne ${stFond.mean.toFixed(1)}, écart-type ${stFond.stdev.toFixed(2)}, min ${stFond.min}
`);

/* ---------------------------------------------------------------
   2. COUCHE GRAIN — la fibre, vue de près
   Ici une tuile convient : le grain n'a pas d'accident unique. On prend
   une zone propre, on miroite les 4 quadrants pour que les bords se
   raccordent, et on reste discret : c'est la couche page qui porte le
   caractère, celle-ci n'ajoute que du toucher.
   --------------------------------------------------------------- */
const COTE = 340;
const GRAIN_AMPLI = 1.6;
const GRAIN_CENTRE = 252;   // presque blanc : neutre pour `multiply`

const grainSrc = await sharp(SRC)
  .extract({ left: 900, top: 380, width: 340, height: 280 })
  .greyscale()
  .png()
  .toBuffer();

const patch = await (await centrer(grainSrc, GRAIN_AMPLI, GRAIN_CENTRE)).resize(COTE, COTE, { fit: 'fill' }).png().toBuffer();
const [q2, q3, q4] = await Promise.all([
  sharp(patch).flop().png().toBuffer(),
  sharp(patch).flip().png().toBuffer(),
  sharp(patch).flop().flip().png().toBuffer(),
]);

const tuile = await sharp({ create: { width: COTE * 2, height: COTE * 2, channels: 3, background: '#F9F9F9' } })
  .composite([
    { input: patch, left: 0, top: 0 },
    { input: q2, left: COTE, top: 0 },
    { input: q3, left: 0, top: COTE },
    { input: q4, left: COTE, top: COTE },
  ])
  .webp({ quality: 76 })
  .toBuffer();
await sharp(tuile).toFile(GRAIN);

const stGrain = (await sharp(tuile).stats()).channels[0];
console.log(`${GRAIN}`);
console.log(`  ${COTE * 2}x${COTE * 2}, ${(tuile.length / 1024).toFixed(1)} Ko — moyenne ${stGrain.mean.toFixed(1)}, écart-type ${stGrain.stdev.toFixed(2)}`);
console.log(`\nréférence à égaler : écart-type 8,21 sur une page entière.`);
