const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const ppt = fs.readdirSync(root).find((f) => f.includes('(1)') && f.endsWith('.pptx'));
const out = path.join(root, 'ppt-output', 'src-unzip');
const zip = path.join(root, 'ppt-output', 'src.zip');
if (!fs.existsSync(path.join(out, 'ppt', 'slides', 'slide21.xml'))) {
  fs.copyFileSync(path.join(root, ppt), zip);
  if (fs.existsSync(out)) fs.rmSync(out, { recursive: true });
  execSync(`powershell -NoProfile -Command "Expand-Archive -Path '${zip}' -DestinationPath '${out}' -Force"`, { stdio: 'pipe' });
}

for (const n of process.argv.slice(2).map(Number).filter(Boolean)) {
  const xml = fs.readFileSync(path.join(out, 'ppt', 'slides', `slide${n}.xml`), 'utf8');
  const texts = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]).filter((t) => t.trim());
  console.log(`slide${n}:`, texts.join(' || '));
}
