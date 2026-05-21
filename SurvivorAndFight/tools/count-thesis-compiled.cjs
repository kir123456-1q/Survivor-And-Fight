/**
 * 统计 main.tex 实际编入章节的汉字数（与 PDF 正文范围一致）
 */
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'thesis');
const compiled = [
  'frontmatter.tex',
  'chapter01.tex',
  'chapter01-extended.tex',
  'chapter01-background-extra.tex',
  'chapter02.tex',
  'chapter03.tex',
  'chapter04.tex',
  'chapter05.tex',
  'chapter06.tex',
  'chapter07.tex',
  'chapter08.tex',
  'acknowledgement.tex',
  'appendix.tex',
];
let total = 0;
for (const f of compiled) {
  const p = path.join(dir, f);
  if (!fs.existsSync(p)) continue;
  const text = fs.readFileSync(p, 'utf8');
  const cn = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  total += cn;
  console.log(`${f}: 汉字 ${cn}`);
}
console.log('---');
console.log('main.tex 编入合计:', total);
console.log('学院常见要求 ≥20000 时，缺口约:', Math.max(0, 20000 - total));
