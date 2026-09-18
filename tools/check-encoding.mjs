import { readFileSync } from 'fs';
for (const f of ['docs/index.html','docs/carte/index.html','docs/mentions-legales/index.html','docs/404.html','docs/home.css','docs/home.js']) {
  const s = readFileSync(f, 'utf8');
  const bad = (s.match(/Ã[-¿]|â€/g) || []).length;
  const viet = s.includes('Chợ Vỉa Hè');
  console.log(f, 'mojibake:', bad, 'viet-ok:', viet);
}
