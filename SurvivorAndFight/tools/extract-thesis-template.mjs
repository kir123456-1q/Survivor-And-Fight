import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pdf from 'pdf-parse/lib/pdf-parse.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PDF = path.join(ROOT, '本科毕业设计(论文)参考模板-计算机学院.pdf');
const OUT = path.join(ROOT, 'docs', 'thesis-template-requirements.txt');

const dataBuffer = fs.readFileSync(PDF);
const data = await pdf(dataBuffer);
const lines = [
  `PAGES: ${data.numpages}`,
  '---INFO---',
  `Title: ${data.info?.Title ?? ''}`,
  `Author: ${data.info?.Author ?? ''}`,
  '---FULL TEXT---',
  data.text,
];
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, lines.join('\n'), 'utf8');
console.log(`Wrote ${OUT} (${data.text.length} chars)`);
console.log(data.text.slice(0, 4000));
