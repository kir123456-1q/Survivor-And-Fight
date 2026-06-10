const { Automizer } = require('pptx-automizer');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const ppt = fs.readdirSync(root).find((f) => f.includes('基于ECS') && !f.includes('已排版') && !f.includes('(1)'));
const SW = 12192000, SH = 6858000;

(async () => {
  const automizer = new Automizer({ templateDir: root, outputDir: path.join(root, 'ppt-output'), removeExistingSlides: true, verbosity: 0 });
  const pres = automizer.loadRoot(ppt).load(ppt, 'd');
  const info = await pres.getInfo();
  const deck = info.templateByName('d');
  for (const slide of deck.slides) {
    const n = slide.number;
    const boxes = (slide.elements || [])
      .filter((e) => e.hasTextBody && e.name?.startsWith('TextBox'))
      .map((e) => ({
        name: e.name,
        t: e.position ? (e.position.y / SH) * 100 : 0,
        l: e.position ? (e.position.x / SW) * 100 : 0,
        text: (e.getText && e.getText()) || '',
      }))
      .sort((a, b) => a.t - b.t || a.l - b.l);
    console.log(`=== Slide ${n} ===`);
    for (const b of boxes) {
      console.log(`${b.name} @${b.t.toFixed(1)},${b.l.toFixed(1)}`);
    }
    console.log('');
  }
})();
