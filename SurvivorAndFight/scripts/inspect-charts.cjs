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
  verbosity: 0,
});

(async () => {
  const pres = automizer.loadRoot(templateFile).load(templateFile, 'tpl');
  const info = await pres.getInfo();
  const tpl = info.templateByName('tpl');
  for (const slide of tpl?.slides || []) {
    const names = (slide.elements || []).map((e) => e.name).filter(Boolean);
    const hasChart = names.some((n) => /chart|图表|Chart/i.test(n));
    const titleEl = names.find((n) => n.includes('标题'));
    if (hasChart || [5, 6, 7, 8, 23, 24, 25, 26, 27, 28].includes(slide.number)) {
      console.log(`Slide ${slide.number}: ${names.slice(0, 8).join(' | ')}${names.length > 8 ? ' ...' : ''}`);
    }
  }
})().catch(console.error);
