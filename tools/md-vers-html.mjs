/* Markdown -> HTML, sous-ensemble suffisant pour nos documents clients.
   Sert à créer un Google Doc correctement formaté : Drive convertit le HTML
   en vrais titres, gras et citations, alors qu'un texte brut afficherait
   les dièses et les astérisques tels quels.
   Usage : node tools/md-vers-html.mjs RETOURS-AOUT-26.md > sortie.html   */
import { readFileSync } from 'fs';

const echappe = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// styles de ligne : liens, gras, italique, code — appliqués APRÈS l'échappement
function enLigne(s) {
  return s
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    // URL écrites en clair : Google Docs ne les rend pas cliquables à
    // l'import, on pose le lien nous-mêmes (jamais dans un href déjà posé).
    .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2">$2</a>');
}

export function mdVersHtml(md) {
  const out = [];
  let listeOuverte = false;
  const fermerListe = () => { if (listeOuverte) { out.push('</ul>'); listeOuverte = false; } };

  // les lignes d'un même paragraphe sont recollées avant traitement
  const blocs = md.replace(/\r\n/g, '\n').split(/\n{2,}/);

  for (const bloc of blocs) {
    const lignes = bloc.split('\n');
    const premier = lignes[0].trim();

    if (/^---+$/.test(premier)) { fermerListe(); out.push('<hr />'); continue; }

    if (premier.startsWith('#')) {
      fermerListe();
      const n = premier.match(/^#+/)[0].length;
      out.push(`<h${n}>${enLigne(echappe(premier.replace(/^#+\s*/, '')))}</h${n}>`);
      continue;
    }

    if (premier.startsWith('>')) {
      fermerListe();
      const txt = lignes.map((l) => l.replace(/^>\s?/, '')).join(' ').trim();
      out.push(`<blockquote><p><em>${enLigne(echappe(txt))}</em></p></blockquote>`);
      continue;
    }

    if (/^[-*]\s/.test(premier)) {
      if (!listeOuverte) { out.push('<ul>'); listeOuverte = true; }
      // une puce peut tenir sur plusieurs lignes : on recolle sur les puces
      let courant = null;
      for (const l of lignes) {
        if (/^[-*]\s/.test(l.trim())) {
          if (courant !== null) out.push(`<li>${enLigne(echappe(courant))}</li>`);
          courant = l.trim().replace(/^[-*]\s+/, '');
        } else if (courant !== null) {
          courant += ' ' + l.trim();
        }
      }
      if (courant !== null) out.push(`<li>${enLigne(echappe(courant))}</li>`);
      continue;
    }

    fermerListe();
    const txt = lignes.join(' ').trim();
    if (txt) out.push(`<p>${enLigne(echappe(txt))}</p>`);
  }
  fermerListe();

  return `<html><head><meta charset="utf-8" /></head><body>\n${out.join('\n')}\n</body></html>`;
}

if (process.argv[2]) process.stdout.write(mdVersHtml(readFileSync(process.argv[2], 'utf8')));
