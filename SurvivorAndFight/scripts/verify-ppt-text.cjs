const fs = require('fs');
const path = require('path');

const badPatterns = [
  '你的标题',
  '输入一点内容',
  '请输入你的观点',
  '请在这里输入',
  '在这里输入',
  '输入你的标题',
  '输入你的正文',
  '内容关键词',
  '课题背景',
  'Research Process',
  'Background of Project',
  'ROGUELIKE',
];

const dir = path.join(__dirname, '../ppt-verify/ppt/slides');
const files = fs.readdirSync(dir).filter((f) => f.startsWith('slide') && f.endsWith('.xml'));
let issues = 0;

for (const file of files.sort()) {
  const xml = fs.readFileSync(path.join(dir, file), 'utf8');
  const texts = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]);
  const hits = texts.filter((t) => badPatterns.some((p) => t.includes(p)));
  if (hits.length) {
    console.log(`${file}: ${[...new Set(hits)].join(' | ')}`);
    issues += hits.length;
  }
}
console.log(issues ? `\nTotal leftover placeholders: ${issues}` : 'No template placeholders found.');
