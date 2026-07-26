// Propage le pied de page jaune + le fond kraft aux pages secondaires,
// et retire les séparateurs crayon rouges de la carte (demande cliente).
import { readFileSync, writeFileSync } from 'fs';

const footer = (p) => `<footer class="footer">
  <div class="wrap">
    <div class="footer-grid">
      <div class="footer-col footer-infos">
        <a class="footer-wordmark viet" href="${p}" lang="vi">Chợ Vỉa Hè</a>
        <address>8 rue de Metz — 31000 Toulouse</address>
        <p>Mardi – Samedi · 12h–14h30 et 19h–22h30</p>
        <p><a href="tel:+33562858392">05 62 85 83 92</a></p>
        <p><a href="https://www.instagram.com/choviahe.toulouse" target="_blank" rel="noopener">@choviahe.toulouse</a></p>
        <p class="footer-cta">
          <a class="btn-cta btn-cta--ink" href="https://bookings.zenchef.com/results?rid=377642&amp;utm_source=site&amp;utm_medium=cta&amp;utm_campaign=resa" target="_blank" rel="noopener">Réserver une table</a>
        </p>
      </div>

      <div class="footer-illus" aria-hidden="true">
        <img loading="lazy" decoding="async" src="${p}assets/illus/velo-480.webp" width="480" height="488" alt=""
             srcset="${p}assets/illus/velo-480.webp 480w, ${p}assets/illus/velo-960.webp 960w" sizes="clamp(110px, 20vw, 200px)" />
      </div>

      <nav class="footer-col footer-nav" aria-label="Pied de page">
        <p class="footer-nav-title">Le carnet</p>
        <ul>
          <li><a href="${p}#histoire">L'histoire</a></li>
          <li><a href="${p}carte/">La carte</a></li>
          <li><a href="${p}#lieu">Le lieu</a></li>
          <li><a href="${p}#contact">Contact</a></li>
          <li><a href="${p}mentions-legales/">Mentions légales</a></li>
        </ul>
      </nav>
    </div>
    <p class="footer-sign handwritten">Chợ Vỉa Hè · 8 rue de Metz, Toulouse</p>
  </div>
</footer>`;

const jobs = [
  { f: 'docs/carte/index.html', prefix: '../' },
  { f: 'docs/mentions-legales/index.html', prefix: '../' },
];

for (const { f, prefix } of jobs) {
  let h = readFileSync(f, 'utf8');

  // fond kraft
  h = h.replace(/content="#ECEBD7"/g, 'content="#EADCBD"');

  // séparateurs crayon rouges : markup retiré (demande cliente)
  h = h.replace(/\s*<div class="pencil-sep"[\s\S]*?<\/div>\n?/g, '\n');

  // pied de page : remplace l'ancien bloc entier
  h = h.replace(/<footer class="footer">[\s\S]*?<\/footer>/, footer(prefix));

  writeFileSync(f, h, 'utf8');
  console.log(f, '— pencil-sep restants:', (h.match(/pencil-sep/g) || []).length,
              '| footer-illus:', (h.match(/footer-illus/g) || []).length);
}

// 404 : pas de footer, juste le fond
{
  const f = 'docs/404.html';
  let h = readFileSync(f, 'utf8');
  h = h.replace(/content="#ECEBD7"/g, 'content="#EADCBD"');
  writeFileSync(f, h, 'utf8');
  console.log(f, '— theme-color mis à jour');
}
