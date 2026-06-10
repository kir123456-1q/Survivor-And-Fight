const fs = require('fs');
const path = require('path');
const t = path.join(__dirname, '..', 'ppt-output', 'bg-compare');

function layoutId(dir, n) {
  const x = fs.readFileSync(path.join(dir, 'ppt', 'slides', `slide${n}.xml`), 'utf8');
  const m = x.match(/<p:sldLayoutId[^/]*\/>/);
  const bg = x.match(/<p:bg[\s\S]*?<\/p:bg>/);
  return { layout: m ? m[0] : 'none', hasBg: !!bg };
}

for (const n of [1, 2, 3, 9, 19]) {
  console.log(`slide ${n}:`);
  console.log('  tpl', layoutId(path.join(t, 'tpl'), n));
  console.log('  gen', layoutId(path.join(t, 'gen'), n));
}
