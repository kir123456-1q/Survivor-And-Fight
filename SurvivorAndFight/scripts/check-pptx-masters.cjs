const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const root = path.resolve(__dirname, '..');
const ppt = fs.readdirSync(root).find((f) => f.includes('基于ECS') && !f.includes('已排版') && !f.includes('(1)'));

(async () => {
  const z = await JSZip.loadAsync(fs.readFileSync(path.join(root, ppt)));
  const pres = await z.file('ppt/presentation.xml').async('string');
  const rels = await z.file('ppt/_rels/presentation.xml.rels').async('string');
  const masterIds = [...pres.matchAll(/<p:sldMasterId[^>]*r:id="(rId\d+)"/g)].map((m) => m[1]);
  const relMap = Object.fromEntries(
    [...rels.matchAll(/Id="(rId\d+)"[^>]*Target="([^"]+)"/g)].map((m) => [m[1], m[2]]),
  );
  console.log('sldMasterIdLst rIds:', masterIds.join(', '));
  for (const id of masterIds) {
    const target = relMap[id];
    const ok = target && (await z.file(`ppt/${target}`)) != null;
    console.log(id, '->', target, ok ? 'OK' : 'MISSING');
  }
})();
