const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const pptFile = process.argv[2] || '基于ECS架构的类吸血鬼幸存者游戏开发及优化.pptx';
const tmp = path.join(root, 'ppt-output', 'extract-tmp');
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });
const zip = path.join(tmp, 'deck.zip');
fs.copyFileSync(path.join(root, pptFile), zip);
const uz = path.join(tmp, 'unzipped');
execSync(
  `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zip.replace(/'/g, "''")}' -DestinationPath '${uz.replace(/'/g, "''")}' -Force"`,
  { stdio: 'pipe' },
);

const slideDir = path.join(uz, 'ppt', 'slides');
const files = fs.readdirSync(slideDir).filter((f) => /^slide\d+\.xml$/.test(f));
const nums = files.map((f) => parseInt(f.match(/\d+/)[0], 10)).sort((a, b) => a - b);

for (const n of nums) {
  const xml = fs.readFileSync(path.join(slideDir, `slide${n}.xml`), 'utf8');
  const texts = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]).filter((t) => t.trim());
  console.log(`=== Slide ${n} (${texts.length} segments) ===`);
  texts.forEach((t, j) => console.log(`${String(j + 1).padStart(2, '0')}. ${t}`));
  console.log('');
}
