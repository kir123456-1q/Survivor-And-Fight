const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const root = path.resolve(__dirname, '..');
const ppt = fs.readdirSync(root).find((f) => f.includes('基于ECS') && !f.includes('已排版') && !f.includes('(1)'));

(async () => {
  const z = await JSZip.loadAsync(fs.readFileSync(path.join(root, ppt)));
  const keys = new Set(Object.keys(z.files).filter((k) => !k.endsWith('/')));
  const broken = [];
  for (const k of keys) {
    if (!k.endsWith('.rels')) continue;
    const xml = await z.file(k).async('string');
    const base = k.replace(/_rels\/[^/]+$/, '').replace(/\/[^/]+$/, '');
    for (const m of xml.matchAll(/Target="([^"]+)"/g)) {
      const t = m[1];
      if (t.startsWith('file:')) continue;
      const resolved = path.posix.normalize(path.posix.join(base, t));
      if (!keys.has(resolved)) broken.push({ from: k, target: t, resolved });
    }
  }
  console.log('PPT:', ppt);
  console.log('broken rels:', broken.length);
  broken.slice(0, 20).forEach((b) => console.log(`${b.from} -> ${b.resolved}`));
})();
