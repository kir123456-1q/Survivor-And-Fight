const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const root = path.resolve(__dirname, '..');
const ppt = fs.readdirSync(root).find((f) => f.includes('基于ECS') && !f.includes('已排版') && !f.includes('(1)'));

(async () => {
  const z = await JSZip.loadAsync(fs.readFileSync(path.join(root, ppt)));
  const keys = Object.keys(z.files).filter((k) => !k.endsWith('/'));
  const layouts = keys.filter((k) => /ppt\/slideLayouts\/slideLayout\d+\.xml$/.test(k));
  const ct = await z.file('[Content_Types].xml').async('string');
  const overrides = [...ct.matchAll(/PartName="([^"]+)"/g)].map((m) => m[1]);
  const layoutOverrides = overrides.filter((p) => p.includes('slideLayout'));
  const missing = layouts.filter((k) => !overrides.includes(`/${k}`));
  console.log('PPT:', ppt);
  console.log('layout files in zip:', layouts.length);
  console.log('layout in Content_Types:', layoutOverrides.length);
  console.log('missing from Content_Types:', missing.length);
  if (missing.length) console.log(missing.slice(0, 8).join('\n'));

  const rels = await z.file('ppt/_rels/presentation.xml.rels').async('string');
  const ids = [...rels.matchAll(/Id="(rId\d+)"/g)].map((m) => m[1]);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  const masterRels = [...rels.matchAll(/slideMaster/g)].length;
  const slideRels = [...rels.matchAll(/relationships\/slide"/g)].length;
  console.log('slide rels:', slideRels, '| slideMaster rels:', masterRels);
  console.log('duplicate rIds:', dup.length ? dup.join(', ') : 'none');
})();
