import { readFileSync, writeFileSync } from 'fs';

const jobs = [
  ['docs/index.html', './analytics.js'],
  ['docs/carte/index.html', '../analytics.js'],
  ['docs/404.html', '/analytics.js'],
  ['docs/mentions-legales/index.html', '../analytics.js'],
];

for (const [f, src] of jobs) {
  let s = readFileSync(f, 'utf8');
  if (s.includes('analytics.js')) { console.log(f, 'déjà fait'); continue; }
  s = s.replace('</body>', `<script src="${src}" defer></script>\n</body>`);
  writeFileSync(f, s, 'utf8');
  console.log(f, 'ok');
}
