const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const ROOT = path.resolve(__dirname, '..');
const files = [
  'SyDRA：一种理解游戏引擎架构的方法原文.pdf',
  'Unity游戏引擎中基于物理的人群疏散建模原文.pdf',
];

(async () => {
  for (const name of files) {
    const buf = fs.readFileSync(path.join(ROOT, name));
    const parser = new PDFParse({ data: buf });
    const data = await parser.getText();
    const t = data.text || '';
    const m = t.match(/参考文献[\s\S]{0,12000}/) || t.match(/References[\s\S]{0,12000}/i);
    console.log('\n==========', name, '==========\n');
    console.log(m ? m[0] : t.slice(-5000));
  }
})();
