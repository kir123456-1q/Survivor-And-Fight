const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
function findPpt(pred) {
  return fs.readdirSync(root).find((f) => f.endsWith('.pptx') && pred(f));
}
function unzip(ppt, dest) {
  const z = `${dest}.zip`;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.rmSync(dest, { recursive: true, force: true });
  fs.copyFileSync(ppt, z);
  execSync(
    `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${z.replace(/'/g, "''")}' -DestinationPath '${dest.replace(/'/g, "''")}' -Force"`,
    { stdio: 'pipe' },
  );
}

const t = path.join(root, 'ppt-output', 'bg-compare');
fs.rmSync(t, { recursive: true, force: true });
unzip(path.join(root, findPpt((f) => f.includes('通用ppt1'))), path.join(t, 'tpl'));
unzip(path.join(root, findPpt((f) => f.includes('基于ECS') && !f.includes('已排版') && !f.includes('(1)'))), path.join(t, 'gen'));

function inspect(dir, n) {
  const xml = fs.readFileSync(path.join(dir, 'ppt', 'slides', `slide${n}.xml`), 'utf8');
  const bg = xml.match(/<p:bg[\s\S]*?<\/p:bg>/);
  const layout = xml.match(/<p:sldLayoutId[^/]*\/>/);
  const rels = fs.existsSync(path.join(dir, 'ppt', 'slides', '_rels', `slide${n}.xml.rels`))
    ? fs.readFileSync(path.join(dir, 'ppt', 'slides', '_rels', `slide${n}.xml.rels`), 'utf8')
    : '';
  const layoutId = layout ? layout[0] : 'none';
  const bgKind = bg ? (bg[0].includes('blip') ? 'image' : bg[0].includes('solidFill') ? 'solid' : 'other') : 'from-layout';
  console.log(`  slide ${n}: layoutRef ${layoutId.slice(0, 60)} | bg=${bgKind}`);
  if (bg) console.log(`    ${bg[0].slice(0, 200).replace(/\s+/g, ' ')}`);
}

console.log('TEMPLATE:');
[1, 2, 4, 9, 33].forEach((n) => inspect(path.join(t, 'tpl'), n));
console.log('\nTARGET:');
[1, 2, 3, 5, 18, 19].forEach((n) => inspect(path.join(t, 'gen'), n));

// layout names
const tplLayouts = fs.readFileSync(path.join(t, 'tpl', 'ppt', 'presentation.xml'), 'utf8');
const layoutList = [...tplLayouts.matchAll(/<p:sldLayoutId id="(\d+)" r:id="(rId\d+)"/g)];
console.log('\nTemplate layout ids:', layoutList.length);
