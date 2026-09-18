/* =========================================================
   Chợ Vỉa Hè — fabrique le dossier de production pour OVH
       node tools/pre-prod.mjs

   docs/      = aperçu GitHub Pages, reste en noindex (jamais modifié ici)
   dist-ovh/  = copie de docs/ prête pour la production, à envoyer en FTP
                (tout son contenu, .htaccess compris, à la racine www/ d'OVH)

   Sur la copie seulement :
     1. retire le <meta name="robots" content="noindex"> des pages publiques
     2. met la date du jour dans sitemap.xml et en jeton ?v= sur CSS/JS/logo
     3. vérifie ce qui bloque encore (PDF, liens morts, .htaccess)

   Node lit et écrit en UTF-8 strict : jamais PowerShell, sinon les
   diacritiques vietnamiens partent en mojibake.
   ========================================================= */
import { readFileSync, writeFileSync, existsSync, statSync, rmSync, cpSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(RACINE, 'docs');
const OUT = join(RACINE, 'dist-ovh');

// on vide le dossier sans le supprimer : sous Windows, un Explorateur ou FileZilla
// ouvert dessus verrouille le dossier lui-même
if (existsSync(OUT)) for (const f of readdirSync(OUT)) rmSync(join(OUT, f), { recursive: true, force: true });
// fichiers propres à git / GitHub Pages : inutiles chez OVH
// + icon-512.png : 278 Ko, référencé nulle part (pas de manifest)
const HORS_PROD = ['.gitignore', '.ignore', '.nojekyll', 'icon-512.png'];
cpSync(SRC, OUT, { recursive: true, filter: (f) => !HORS_PROD.some((n) => f.endsWith(n)) });
console.log(`copie       docs/ -> dist-ovh/`);

// assets/ contient aussi des photos et tailles de réserve jamais affichées (~25 Mo).
// ponytail: un fichier est gardé si son nom apparaît dans un HTML/CSS/JS (srcset compris) ;
// si un jour home.js construit un nom d'image dynamiquement, l'ajouter à GARDER.
const GARDER = [];
const textes = readdirSync(OUT, { recursive: true })
  .filter((f) => /\.(html|css|js|xml|webmanifest)$/.test(f))
  .map((f) => readFileSync(join(OUT, f), 'utf8')).join('\n');
let retires = 0;
for (const f of readdirSync(join(OUT, 'assets'), { recursive: true })) {
  const p = join(OUT, 'assets', f);
  if (statSync(p).isFile() && !textes.includes(basename(f)) && !GARDER.includes(basename(f))) { rmSync(p); retires++; }
}
console.log(`tri         ${retires} fichier(s) d'assets jamais affichés retirés`);

// Pages publiques : indexées en prod. 404 et mentions légales restent en noindex.
const PUBLIQUES = ['index.html', 'carte/index.html'];
const PAGES = [...PUBLIQUES, 'mentions-legales/index.html', '404.html'];
const BALISE = '<meta name="robots" content="noindex" />\n';
const lire = (rel) => readFileSync(join(OUT, rel), 'utf8');
const ecrire = (rel, s) => writeFileSync(join(OUT, rel), s, 'utf8');

for (const rel of PUBLIQUES) {
  const html = lire(rel);
  if (!html.includes(BALISE)) throw new Error(`${rel} : balise noindex introuvable, rien retiré`);
  ecrire(rel, html.replace(BALISE, ''));
  console.log(`indexable   ${rel}`);
}

// Le .htaccess met CSS/JS/SVG en cache 1 an : le jeton force le rechargement.
const jour = new Date().toISOString().slice(0, 10);
const jeton = jour.replace(/-/g, '');
for (const rel of PAGES) ecrire(rel, lire(rel).replace(/\.(css|js|svg)\?v=\d{8}/g, `.$1?v=${jeton}`));
console.log(`jeton       ?v=${jeton}`);

ecrire('sitemap.xml', lire('sitemap.xml').replace(/<lastmod>[\d-]+<\/lastmod>/g, `<lastmod>${jour}</lastmod>`));
console.log(`sitemap     lastmod -> ${jour}`);

/* --- CONTRÔLES : n'écrivent rien, alertent seulement --- */
const alertes = [];
const pdf = join(OUT, 'assets/carte-cho-via-he.pdf');
if (!existsSync(pdf)) alertes.push('PDF de la carte absent.');
else console.log(`PDF carte   ${Math.round(statSync(pdf).size / 1024)} Ko, du ${statSync(pdf).mtime.toISOString().slice(0, 10)}`);
for (const rel of PAGES) {
  const html = lire(rel);
  const morts = (html.match(/href="#"/g) || []).length;
  if (morts) alertes.push(`${rel} : ${morts} lien(s) mort(s) href="#".`);
  if (/(href|src|content)="[^"]*(github\.io|localhost)/.test(html)) alertes.push(`${rel} : adresse d'aperçu (github.io/localhost) restée dans la page.`);
}
for (const rel of PUBLIQUES) if (lire(rel).includes('noindex')) alertes.push(`${rel} : encore en noindex.`);
if (!existsSync(join(OUT, '.htaccess'))) alertes.push('.htaccess absent : redirections Wix et https inactifs.');

if (alertes.length) {
  console.log('\nA REGLER AVANT DE PUBLIER :');
  for (const a of alertes) console.log('  - ' + a);
  process.exitCode = 1;
} else {
  console.log('\nAucun bloquant. Envoyer TOUT le contenu de dist-ovh/ (.htaccess compris) dans www/ chez OVH.');
}
