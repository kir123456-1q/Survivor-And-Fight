const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'thesis');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.tex'));
let total = 0;
for (const f of files) {
  const text = fs.readFileSync(path.join(dir, f), 'utf8');
  const cn = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const en = (text.match(/[a-zA-Z]/g) || []).length;
  total += cn;
  console.log(`${f}: 汉字 ${cn}, 字母 ${en}`);
}
console.log('---');
console.log('汉字合计:', total);
