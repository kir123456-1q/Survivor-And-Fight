const { Automizer } = require('pptx-automizer');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const argFile = process.argv[2];
const pptFile =
  argFile ||
  fs.readdirSync(root).find((f) => f.endsWith('.pptx') && f.includes('已排版')) ||
  fs.readdirSync(root).find((f) => f.endsWith('.pptx') && f.includes('(1)'));
if (!pptFile) {
  console.error('PPT not found');
  process.exit(1);
}

const SW = 12192000;
const SH = 6858000;

function box(p) {
  if (!p || !p.cx) return null;
  return {
    l: (p.x / SW) * 100,
    t: (p.y / SH) * 100,
    r: ((p.x + p.cx) / SW) * 100,
    b: ((p.y + p.cy) / SH) * 100,
    w: (p.cx / SW) * 100,
    h: (p.cy / SH) * 100,
    area: p.cx * p.cy,
  };
}

function isBg(b) {
  return b && b.w > 95 && b.h > 95;
}

function overlaps(a, b) {
  return a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
}

(async () => {
  const automizer = new Automizer({
    templateDir: root,
    outputDir: path.join(root, 'ppt-output'),
    removeExistingSlides: true,
    verbosity: 0,
  });
  const pres = automizer.loadRoot(pptFile).load(pptFile, 'gen');
  const info = await pres.getInfo();
  const gen = info.templateByName('gen');

  const tmp = path.join(root, 'ppt-analyze-tmp');
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  const full = path.join(root, pptFile);
  const zipCopy = path.join(tmp, 'deck.zip');
  fs.copyFileSync(full, zipCopy);
  execSync(
    `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zipCopy.replace(/'/g, "''")}' -DestinationPath '${path.join(tmp, 'unzipped').replace(/'/g, "''")}' -Force"`,
    { stdio: 'pipe' },
  );
  const unzipped = path.join(tmp, 'unzipped');

  console.log('FILE:', pptFile);
  console.log('SLIDES:', gen.slides.length);
  console.log('');

  const summary = [];

  for (const slide of gen.slides) {
    const n = slide.number;
    const xmlPath = path.join(unzipped, 'ppt', 'slides', `slide${n}.xml`);
    let texts = [];
    if (fs.existsSync(xmlPath)) {
      const xml = fs.readFileSync(xmlPath, 'utf8');
      texts = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)]
        .map((m) => m[1])
        .filter((t) => t.trim());
    }

    const title =
      texts.find((t) => t.length >= 4 && !/^\d+$/.test(t) && !t.includes('谢谢')) ||
      texts[0] ||
      '(无标题)';

    const els = slide.elements || [];
    const pics = els
      .filter((e) => e.type === 'pic')
      .map((e) => ({ name: e.name, b: box(e.position) }))
      .filter((x) => x.b && !isBg(x.b));
    const textEls = els
      .filter((e) => e.hasTextBody && e.visualType !== 'vectorLine')
      .map((e) => ({ name: e.name, b: box(e.position), vt: e.visualType }))
      .filter((x) => x.b && !isBg(x.b));
    const bigText = textEls.filter((x) => x.b.area > 2e11).sort((a, b) => b.b.area - a.b.area);

    const contentOverlaps = [];
    for (const p of pics) {
      for (const t of bigText) {
        if (overlaps(p.b, t.b)) contentOverlaps.push(`${p.name}<->${t.name}`);
      }
    }

    // infer layout type
    let layout = 'unknown';
    if (n === 1) layout = 'cover';
    else if (pics.length === 0 && bigText.length >= 3) layout = 'text-bullets';
    else if (pics.length >= 1 && bigText.some((t) => t.b.t > 65)) layout = 'image-top-text-bottom';
    else if (pics.length >= 1 && bigText.some((t) => t.b.l > 50)) layout = 'image-left-text-right';
    else if (pics.length >= 1) layout = 'image-mixed';
    else layout = 'text-only';

    summary.push({ n, title, layout, pics: pics.length, texts: texts.length, contentOverlaps });

    console.log(`--- Slide ${n} | ${title.slice(0, 40)}`);
    console.log(`  版式推断: ${layout} | 文本条: ${texts.length} | 内容图: ${pics.length}`);
    if (pics.length) {
      pics.forEach((p) =>
        console.log(
          `    图 ${p.name}: left ${p.b.l.toFixed(1)}% top ${p.b.t.toFixed(1)}% size ${p.b.w.toFixed(1)}x${p.b.h.toFixed(1)}%`,
        ),
      );
    }
    if (bigText.slice(0, 4).length) {
      bigText.slice(0, 4).forEach((t) =>
        console.log(
          `    文 ${t.name}: left ${t.b.l.toFixed(1)}% top ${t.b.t.toFixed(1)}% size ${t.b.w.toFixed(1)}x${t.b.h.toFixed(1)}%`,
        ),
      );
    }
    if (contentOverlaps.length) console.log(`    [!] 内容重叠: ${contentOverlaps.join(', ')}`);
    console.log('');
  }

  fs.rmSync(tmp, { recursive: true, force: true });

  // layout stats
  const types = {};
  summary.forEach((s) => {
    types[s.layout] = (types[s.layout] || 0) + 1;
  });
  console.log('=== 版式统计 ===');
  Object.entries(types).forEach(([k, v]) => console.log(`  ${k}: ${v} 页`));
  console.log('');
  console.log('=== 存在内容图-文字重叠的页 ===');
  summary.filter((s) => s.contentOverlaps.length).forEach((s) =>
    console.log(`  第${s.n}页 ${s.title.slice(0, 20)}: ${s.contentOverlaps.join(', ')}`),
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
