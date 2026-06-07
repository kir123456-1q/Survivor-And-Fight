import Automizer from 'pptx-automizer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const templateFile = '中国石油大学汇报答辩通用ppt1.pptx';

const automizer = new Automizer({
  templateDir: root,
  outputDir: path.join(root, 'ppt-output'),
  removeExistingSlides: true,
  autoImportSlideMasters: true,
  verbosity: 0,
});

const pres = automizer.loadRoot(templateFile);
const info = await pres.getInfo();
console.log(JSON.stringify(info, null, 2));
