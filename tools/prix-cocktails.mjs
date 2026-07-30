// Renseigne les 3 cocktails à 11 € (prix confirmé par la cliente le 27/07).
import { readFileSync, writeFileSync } from 'fs';

const f = 'docs/carte/index.html';
let h = readFileSync(f, 'utf8');

const LEAD = '<span class="menu-item-lead" aria-hidden="true"></span><span class="menu-item-prix">11&nbsp;€</span>';

for (const nom of ['Em Ơi', 'Dragon', 'Phở Mojito']) {
  // HTML : ajoute le filet de liaison + le prix dans la ligne de titre
  const re = new RegExp(`(<span class="menu-item-nom"[^>]*>${nom}</span>)(</p>)`);
  if (!re.test(h)) { console.log('NON TROUVÉ (html) :', nom); continue; }
  h = h.replace(re, `$1${LEAD}$2`);

  // JSON-LD : ajoute l'offre
  const reLd = new RegExp(`("name": "${nom}", "description": "[^"]*")\\s*\\}`);
  if (!reLd.test(h)) { console.log('NON TROUVÉ (json-ld) :', nom); continue; }
  h = h.replace(reLd, `$1, "offers": { "@type": "Offer", "price": "11.00", "priceCurrency": "EUR" } }`);
  console.log('prix posé :', nom);
}

writeFileSync(f, h, 'utf8');
console.log('occurrences de 11 € :', (h.match(/11&nbsp;€/g) || []).length,
            '| offres 11.00 :', (h.match(/"price": "11\.00"/g) || []).length);
