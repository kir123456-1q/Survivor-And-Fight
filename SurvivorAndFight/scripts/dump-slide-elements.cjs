const { Automizer } = require('pptx-automizer');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const templateFile = '中国石油大学汇报答辩通用ppt1.pptx';

const automizer = new Automizer({
  templateDir: root,
  outputDir: path.join(root, 'ppt-output'),
  removeExistingSlides: true,
  verbosity: 0,
});

(async () => {
  const pres = automizer.loadRoot(templateFile).load(templateFile, 'tpl');
  const info = await pres.getInfo();
  const tpl = info.templateByName('tpl');
  for (const n of [6, 7, 8, 10, 33, 39]) {
    const slide = tpl.slides.find((s) => s.number === n);
    if (!slide) continue;
    console.log(`\n=== Slide ${n} ===`);
    for (const el of slide.elements || []) {
      console.log(`  ${el.name} [${el.type || '?'}]`);
    }
  }
})();
