const { Automizer } = require('pptx-automizer');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const templateFile = '中国石油大学汇报答辩通用ppt1.pptx';
const outputDir = path.join(root, 'ppt-output');
fs.mkdirSync(outputDir, { recursive: true });

const automizer = new Automizer({
  templateDir: root,
  outputDir,
  removeExistingSlides: true,
  autoImportSlideMasters: true,
  verbosity: 1,
});

(async () => {
  const pres = automizer.loadRoot(templateFile).load(templateFile, 'tpl');
  const info = await pres.getInfo();
  const tpl = info.templateByName('tpl');
  console.log('Template slides count:', tpl?.slides?.length);
  for (const slide of tpl?.slides || []) {
    const names = (slide.elements || []).map((e) => e.name).filter(Boolean);
    if ([1, 2, 3, 4, 31, 32, 33, 39].includes(slide.number)) {
      console.log(`Slide ${slide.number}: ${names.join(' | ')}`);
    }
  }
})().catch(console.error);
