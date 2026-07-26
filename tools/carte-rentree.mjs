// Rend le PDF "Carte rentrée 26" en images + extrait le texte (vérif changements carte)
import { pdf } from 'pdf-to-img';
import { PDFParse } from 'pdf-parse';
import { readdirSync, writeFileSync, readFileSync } from 'fs';

const dir = 'docs/carte';
const name = readdirSync(dir).find(f => f.endsWith('.pdf'));
const path = `${dir}/${name}`;
console.log('PDF:', name);

const doc = await pdf(path, { scale: 2 });
let n = 0;
for await (const page of doc) {
  n++;
  writeFileSync(`_carte-p${n}.png`, page);
}
console.log('pages rendues:', n);

const parser = new PDFParse({ data: readFileSync(path) });
const res = await parser.getText();
writeFileSync('_carte-texte.txt', res.text, 'utf8');
console.log('texte extrait:', res.text.length, 'caractères');
