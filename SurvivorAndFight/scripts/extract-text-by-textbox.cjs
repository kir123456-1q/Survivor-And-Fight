const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Automizer } = require('pptx-automizer');

const root = path.resolve(__dirname, '..');
const ppt = fs.readdirSync(root).find((f) => f.includes('基于ECS') && !f.includes('已排版') && !f.includes('(1)'));
const tmp = path.join(root, 'ppt-output', 'shape-text');
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });
const zip = path.join(tmp, 'd.zip');
fs.copyFileSync(path.join(root, ppt), zip);
const uz = path.join(tmp, 'u');
execSync(`powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zip.replace(/'/g, "''")}' -DestinationPath '${uz.replace(/'/g, "''")}' -Force"`, { stdio: 'pipe' });

const SW = 12192000, SH = 6858000;

function shapeText(xml) {
  const parts = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]);
  return parts.join('').replace(/\s+/g, ' ').trim();
}

(async () => {
  const automizer = new Automizer({ templateDir: root, outputDir: path.join(root, 'ppt-output'), removeExistingSlides: true, verbosity: 0 });
  const pres = automizer.loadRoot(ppt).load(ppt, 'd');
  const info = await pres.getInfo();
  const deck = info.templateByName('d');

  for (const slide of deck.slides) {
    const n = slide.number;
    const slideXml = fs.readFileSync(path.join(uz, 'ppt', 'slides', `slide${n}.xml`), 'utf8');
    const shapes = [...slideXml.matchAll(/<p:sp>[\s\S]*?<\/p:sp>/g)].map((m) => m[0]);
    const cNvPr = (sp) => {
      const m = sp.match(/<p:cNvPr[^>]*name="([^"]+)"/);
      return m ? m[1] : null;
    };
    const boxes = (slide.elements || [])
      .filter((e) => e.hasTextBody && e.name?.startsWith('TextBox'))
      .map((e) => ({ name: e.name, t: (e.position.y / SH) * 100, l: (e.position.x / SW) * 100 }))
      .sort((a, b) => a.t - b.t || a.l - b.l);

    console.log(`=== Slide ${n} ===`);
    for (const b of boxes) {
      const sp = shapes.find((s) => cNvPr(s) === b.name);
      const text = sp ? shapeText(sp) : '(no xml)';
      console.log(`${b.name}: ${JSON.stringify(text)}`);
    }
    console.log('');
  }
})();
