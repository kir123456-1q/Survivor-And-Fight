const fs = require('fs');
const path = require('path');

function walkShapes(xml, depth = 0) {
  const results = [];
  // match sp and grpSp blocks with names
  const re = /<p:(sp|grpSp|pic)[^>]*>[\s\S]*?<\/p:\1>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const block = m[0];
    const tag = m[1];
    const nameM = block.match(/<p:cNvPr[^>]*id="[^"]*" name="([^"]*)"/);
    const texts = [...block.matchAll(/<a:t>([^<]*)<\/a:t>/g)]
      .map((x) => x[1])
      .filter((t) => t.trim());
    if (nameM && nameM[1]) {
      results.push({ tag, name: nameM[1], texts });
    }
  }
  return results;
}

for (const n of [2, 3, 6, 8, 9, 17, 31, 32, 33]) {
  const xml = fs.readFileSync(
    path.join(__dirname, '../ppt-unpacked/ppt/slides', `slide${n}.xml`),
    'utf8',
  );
  console.log(`\n=== slide${n} ===`);
  walkShapes(xml)
    .filter((e) => e.texts.length)
    .forEach((e) => console.log(`  [${e.tag}] ${e.name}: ${e.texts.join(' / ')}`));
}
