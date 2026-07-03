import { readFileSync, writeFileSync } from 'fs';

const jobs = [
  ['docs/404.html', '/fonts/fonts.css', '/'],
  ['docs/mentions-legales/index.html', '../fonts/fonts.css', '../'],
];

for (const [f, fontsHref, prefix] of jobs) {
  let s = readFileSync(f, 'utf8');
  s = s.replace(
    /<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com" \/>\s*\n<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin \/>\s*\n<link href="https:\/\/fonts\.googleapis\.com[^"]+" rel="stylesheet" \/>/,
    `<link rel="stylesheet" href="${fontsHref}" />`
  );
  if (f.includes('mentions')) s = s.replace('href="/home.css"', 'href="../home.css"');
  s = s.replace(
    '</title>',
    `</title>\n<link rel="icon" href="${prefix}favicon-32.png" type="image/png" sizes="32x32" />\n<link rel="icon" href="${prefix}favicon-16.png" type="image/png" sizes="16x16" />\n<link rel="apple-touch-icon" href="${prefix}apple-touch-icon.png" />`
  );
  writeFileSync(f, s, 'utf8');
  console.log(f, '— googleapis restant:', (s.match(/googleapis/g) || []).length);
}
