import { readFileSync } from 'fs';
for (const f of ['docs/da/index.html','docs/da/styles.css','docs/da/app.js','docs/index.html','docs/home.css','docs/home.js']) {
  const s = readFileSync(f, 'utf8');
  const bad = (s.match(/Ã[-¿]|â€/g) || []).length;
  const viet = s.includes('Chợ Vỉa Hè');
  console.log(f, 'mojibake:', bad, 'viet-ok:', viet);
}
