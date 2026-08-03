/* =========================================================
   Chợ Vỉa Hè — bascule staging -> production
   Une seule commande à lancer le jour de la mise en ligne :
       node tools/pre-prod.mjs

   Ce qu'il fait :
     1. retire le <meta name="robots" content="noindex"> des pages publiques
     2. remet la date du jour dans sitemap.xml
     3. vérifie ce qui bloque encore (PDF brouillon, liens morts, poids)

   Rien n'est réécrit via PowerShell : Node lit et écrit en UTF-8 strict,
   sinon les accents et les diacritiques vietnamiens partent en mojibake.
   Repasser en staging :  node tools/pre-prod.mjs --revert
   ========================================================= */
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(RACINE, 'docs');
const revert = process.argv.includes('--revert');

// Pages publiques : elles doivent être indexées en prod.
// 404.html et da/ restent en noindex dans TOUS les cas.
const PUBLIQUES = ['index.html', 'carte/index.html'];
const BALISE = '<meta name="robots" content="noindex" />\n';

let modifs = 0;

for (const rel of PUBLIQUES) {
  const chemin = join(DOCS, rel);
  let html = readFileSync(chemin, 'utf8');
  const present = html.includes(BALISE.trim());

  if (!revert && present) {
    html = html.replace(BALISE, '');
    writeFileSync(chemin, html, 'utf8');
    console.log(`  indexable   ${rel}`);
    modifs++;
  } else if (revert && !present) {
    // on la repose juste avant le canonical, comme à l'origine
    html = html.replace('<link rel="canonical"', BALISE + '<link rel="canonical"');
    writeFileSync(chemin, html, 'utf8');
    console.log(`  noindex     ${rel}`);
    modifs++;
  } else {
    console.log(`  deja bon    ${rel}`);
  }
}

// --- sitemap : date du jour ---
const jour = new Date().toISOString().slice(0, 10);
const sm = join(DOCS, 'sitemap.xml');
const avant = readFileSync(sm, 'utf8');
const apres = avant.replace(/<lastmod>[\d-]+<\/lastmod>/g, `<lastmod>${jour}</lastmod>`);
if (avant !== apres) {
  writeFileSync(sm, apres, 'utf8');
  console.log(`  sitemap     lastmod -> ${jour}`);
  modifs++;
}

console.log(`\n${modifs} modification(s).${revert ? ' (retour staging)' : ''}\n`);

/* ---------------------------------------------------------
   CONTRÔLES — n'écrivent rien, alertent seulement
   --------------------------------------------------------- */
if (revert) process.exit(0);

const alertes = [];

// 1. PDF de la carte — le contenu d'un PDF est compressé, on ne peut pas
//    détecter "BLA BLA" de façon fiable : on affiche la date pour contrôle à l'oeil.
const pdf = join(DOCS, 'assets/carte-cho-via-he.pdf');
if (existsSync(pdf)) {
  const st = statSync(pdf);
  alertes.push(
    `PDF de la carte : ${Math.round(st.size / 1024)} Ko, modifie le ` +
    `${st.mtime.toISOString().slice(0, 10)} — OUVRIR ET VERIFIER que ce n'est plus le brouillon.`
  );
}

// 2. liens morts href="#"
for (const rel of [...PUBLIQUES, 'mentions-legales/index.html', '404.html']) {
  const html = readFileSync(join(DOCS, rel), 'utf8');
  const morts = (html.match(/href="#"/g) || []).length;
  if (morts) alertes.push(`${rel} : ${morts} lien(s) mort(s) href="#".`);
}

// 3. le lien "direction artistique" ne doit plus être atteignable
const home = readFileSync(join(DOCS, 'index.html'), 'utf8');
if (/href="\.?\/?da\//.test(home)) {
  alertes.push('La home pointe encore vers /da/ (page interne, à retirer avant la prod).');
}

// 4. .htaccess présent
if (!existsSync(join(DOCS, '.htaccess'))) {
  alertes.push('.htaccess absent : les redirections Wix et le forçage www/https ne seront pas actifs.');
}

if (alertes.length) {
  console.log('A REGLER AVANT DE PUBLIER :');
  for (const a of alertes) console.log('  - ' + a);
  process.exitCode = 1;
} else {
  console.log('Aucun bloquant detecte.');
}
