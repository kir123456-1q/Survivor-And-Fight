const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const ROOT = path.resolve(__dirname, '..');
const PDF = path.join(ROOT, '本科毕业设计(论文)参考模板-计算机学院.pdf');
const OUT = path.join(ROOT, 'docs', 'thesis-template-requirements.txt');

(async () => {
  const dataBuffer = fs.readFileSync(PDF);
  const parser = new PDFParse({ data: dataBuffer });
  const data = await parser.getText();
  const lines = [
    `PAGES: ${data.pages?.length ?? 'unknown'}`,
    '---FULL TEXT---',
    data.text ?? '',
  ];
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, lines.join('\n'), 'utf8');
  console.log(`Wrote ${OUT} (${data.text.length} chars)`);
  console.log(data.text.slice(0, 5000));
})();
