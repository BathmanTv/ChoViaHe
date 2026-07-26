import { readFileSync } from 'fs';

const files = ['docs/index.html', 'docs/carte/index.html', 'docs/404.html', 'docs/mentions-legales/index.html'];
for (const f of files) {
  const h = readFileSync(f, 'utf8');
  const theme = (h.match(/theme-color" content="([^"]+)"/) || [])[1];
  const footers = (h.match(/<footer[^>]*>/g) || []);
  console.log(f);
  console.log('   theme-color :', theme);
  console.log('   footer      :', footers.length ? footers.map(x => x.slice(0, 60)).join(' | ') : 'AUCUN');
  console.log('   pencil-sep  :', (h.match(/pencil-sep/g) || []).length,
              '| section-num :', (h.match(/section-num/g) || []).length,
              '| footer-illus:', (h.match(/footer-illus/g) || []).length);
}
