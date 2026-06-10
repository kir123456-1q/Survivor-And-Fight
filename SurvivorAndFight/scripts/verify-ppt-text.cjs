const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Automizer } = require('pptx-automizer');

const root = path.resolve(__dirname, '..');
const ppt = fs.readdirSync(root).find((f) => f.includes('基于ECS') && !f.includes('已排版') && !f.includes('(1)'));
const tmp = path.join(root, 'ppt-output', 'verify-tmp');
const z = path.join(tmp, 'd.zip');
fs.mkdirSync(tmp, { recursive: true });
fs.copyFileSync(path.join(root, ppt), z);
const uz = path.join(tmp, 'u');
fs.rmSync(uz, { recursive: true, force: true });
execSync(`powershell -NoProfile -Command "Expand-Archive -LiteralPath '${z.replace(/'/g, "''")}' -DestinationPath '${uz.replace(/'/g, "''")}' -Force"`, { stdio: 'pipe' });

function shapeText(xml) {
  return [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]).join('').trim();
}

(async () => {
  const automizer = new Automizer({ templateDir: root, outputDir: path.join(root, 'ppt-output'), removeExistingSlides: true, verbosity: 0 });
  const pres = automizer.loadRoot(ppt).load(ppt, 'd');
  const info = await pres.getInfo();
  const deck = info.templateByName('d');

  const checks = [
    [1, 'TextBox 3', '基于 ECS'],
    [1, 'TextBox 4', 'Vampire-Survivor'],
    [4, 'TextBox 14', '国内外研究现状'],
    [15, 'TextBox 6', '46.84'],
    [18, 'TextBox 2', '谢谢聆听'],
  ];

  for (const [n, box, expect] of checks) {
    const slideXml = fs.readFileSync(path.join(uz, 'ppt', 'slides', `slide${n}.xml`), 'utf8');
    const rel = fs.readFileSync(path.join(uz, 'ppt', 'slides', '_rels', `slide${n}.xml.rels`), 'utf8');
    const layout = rel.match(/slideLayouts\/[^"]+/)?.[0] || '?';
    const chunks = slideXml.split(/(?=<p:sp>)/);
    const sp = chunks.find((c) => c.match(new RegExp(`name="${box.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`)));
    const text = sp ? shapeText(sp) : '(missing)';
    const ok = text.includes(expect);
    console.log(`${ok ? 'OK' : 'FAIL'} slide${n} ${box} [${layout}] ${text.slice(0, 50)}`);
  }
})();
