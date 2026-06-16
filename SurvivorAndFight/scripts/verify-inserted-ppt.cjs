const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const root = path.resolve(__dirname, '..');
const ppt = fs.readdirSync(root).find((f) => f.includes('(1)-含插图') && f.endsWith('.pptx'));

function texts(xml) {
  return [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]).filter((t) => t.trim());
}

(async () => {
  const z = await JSZip.loadAsync(fs.readFileSync(path.join(root, ppt)));
  const slideNums = Object.keys(z.files)
    .filter((k) => /ppt\/slides\/slide\d+\.xml$/.test(k))
    .map((k) => parseInt(k.match(/slide(\d+)/)[1], 10))
    .sort((a, b) => a - b);
  console.log('文件:', ppt);
  console.log('XML 文件数:', slideNums.length, '| 范围:', slideNums[0], '-', slideNums[slideNums.length - 1]);
  console.log('实际文件:', slideNums.join(', '));

  const pres = await z.file('ppt/presentation.xml').async('string');
  const rels = await z.file('ppt/_rels/presentation.xml.rels').async('string');
  const relMap = {};
  for (const m of rels.matchAll(/Id="([^"]+)"[^>]*Target="slides\/(slide\d+\.xml)"/g)) {
    relMap[m[1]] = m[2];
  }
  const slideRelCount = Object.keys(relMap).length;
  console.log('presentation 中 slide 关系数:', slideRelCount);
  const order = [...pres.matchAll(/<p:sldId[^>]*r:id="([^"]+)"/g)]
    .map((m) => relMap[m[1]])
    .filter(Boolean);
  const slidePath = (f) => (f.startsWith('slides/') ? `ppt/${f}` : `ppt/slides/${f}`);
  const missing = order.filter((f) => !z.file(slidePath(f)));
  console.log('放映顺序页数:', order.length, '| 缺失文件:', missing.length);
  if (missing.length) console.log('缺失:', missing.slice(0, 5).join(', '));

  const titles = [];
  for (const f of order) {
    const file = z.file(slidePath(f));
    if (!file) {
      titles.push(`[缺失 ${f}]`);
      continue;
    }
    const xml = await file.async('string');
    titles.push(texts(xml)[0] || f);
  }
  console.log('前 8 页:', titles.slice(0, 8).join(' | '));
  console.log('第 7-9 页:', titles.slice(6, 9).join(' | '));
  console.log('第 10-13 页:', titles.slice(9, 13).join(' | '));
  console.log('末页:', titles[titles.length - 1]);
})();
