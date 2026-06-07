const { Automizer } = require('pptx-automizer');
const path = require('path');

const root = path.resolve(__dirname, '..');
const templateFile = '中国石油大学汇报答辩通用ppt1.pptx';

const automizer = new Automizer({
  templateDir: root,
  outputDir: path.join(root, 'ppt-output'),
  verbosity: 0,
});

(async () => {
  const pres = automizer.loadRoot(templateFile).load(templateFile, 'tpl');
  const info = await pres.getInfo();
  const tpl = info.templateByName('tpl');
  for (const slide of tpl.slides) {
    const pics = (slide.elements || []).filter((e) => e.type === 'pic');
    const texts = (slide.elements || []).filter((e) => e.type === 'sp');
    if (pics.length >= 1 && pics.length <= 2 && texts.length <= 8) {
      console.log(
        `Slide ${slide.number}: pics=[${pics.map((p) => p.name).join(', ')}] texts=${texts.length}`,
      );
    }
  }
})();
