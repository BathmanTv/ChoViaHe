// Self-host Google Fonts: télécharge les woff2 subsets latin + vietnamese
// et génère docs/fonts/fonts.css avec les @font-face + unicode-range.
import { mkdirSync, writeFileSync } from 'fs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const CSS_URL = 'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Be+Vietnam+Pro:wght@400;500;600&family=Dancing+Script:wght@600&display=swap';
const KEEP = ['latin', 'vietnamese']; // pas de latin-ext ni cyrillic

mkdirSync('docs/fonts', { recursive: true });
const css = await (await fetch(CSS_URL, { headers: { 'User-Agent': UA } })).text();

// blocs: /* subset */ @font-face { ... }
const blocks = [...css.matchAll(/\/\*\s*([a-z-]+)\s*\*\/\s*(@font-face\s*\{[^}]+\})/g)];
let out = '/* Fonts auto-hébergées (subsets latin + vietnamese) — générées par tools/selfhost-fonts.mjs */\n';
let count = 0;

for (const [, subset, block] of blocks) {
  if (!KEEP.includes(subset)) continue;
  const url = block.match(/url\((https:[^)]+\.woff2)\)/)?.[1];
  if (!url) continue;
  const fam = block.match(/font-family:\s*'([^']+)'/)[1];
  const weight = block.match(/font-weight:\s*(\d+)/)[1];
  const style = block.match(/font-style:\s*(\w+)/)[1];
  const fname = `${fam.toLowerCase().replace(/ /g, '-')}-${weight}${style === 'italic' ? 'i' : ''}-${subset}.woff2`;
  const buf = Buffer.from(await (await fetch(url, { headers: { 'User-Agent': UA } })).arrayBuffer());
  writeFileSync(`docs/fonts/${fname}`, buf);
  out += block.replace(/src:[^;]+;/, `src: url('./${fname}') format('woff2');`).replace('@font-face {', `/* ${subset} */\n@font-face {\n  font-display: swap;`) + '\n';
  count++;
  console.log(fname, Math.round(buf.length / 1024) + ' KB');
}
writeFileSync('docs/fonts/fonts.css', out, 'utf8');
console.log('fonts.css écrit,', count, 'fichiers');
