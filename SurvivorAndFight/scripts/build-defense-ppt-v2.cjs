/**
 * v2 答辩 PPT：HTML 截图 → 套中国石油大学模板 → PPTX
 *
 * 输入：ppt-html-v2/index.html
 * 模板：中国石油大学汇报答辩通用ppt1.pptx
 * 输出：ppt-output/毕业答辩PPT-v2.pptx
 */
const path = require('path');
const fs = require('fs');
const http = require('http');
const { chromium } = require('playwright');
const pptxgen = require('pptxgenjs');

const root = path.resolve(__dirname, '..');
const htmlDir = path.join(root, 'ppt-html-v2');
const outDir = path.join(root, 'ppt-output');
const shotsDir = path.join(outDir, 'v2-slide-shots');
const SLIDE_COUNT = 21;
const OUTPUT = '毕业答辩PPT-v2.pptx';
const TEMPLATE = '中国石油大学汇报答辩通用ppt1.pptx';

function mime(p) {
  const ext = path.extname(p).toLowerCase();
  return { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript' }[ext] || 'application/octet-stream';
}

function startServer(port) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\//, '');
      const filePath = path.join(htmlDir, rel);
      if (!filePath.startsWith(htmlDir) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404); res.end('Not found'); return;
      }
      res.writeHead(200, { 'Content-Type': mime(filePath) });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function captureSlides(baseUrl) {
  fs.mkdirSync(shotsDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  const shots = [];
  for (let i = 1; i <= SLIDE_COUNT; i++) {
    const page = await context.newPage();
    await page.goto(`${baseUrl}/?export=1&slide=${i}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1400);
    const out = path.join(shotsDir, `slide-${String(i).padStart(2, '0')}.png`);
    await page.screenshot({ path: out });
    shots.push(out);
    await page.close();
    console.log(`  截图 ${i}/${SLIDE_COUNT}`);
  }
  await browser.close();
  return shots;
}

async function buildPptx(shots) {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.author = '刘瀚文';
  pres.title = '基于 ECS 架构的类吸血鬼幸存者游戏开发及优化';
  pres.subject = '毕业设计答辩 v2';

  for (const shot of shots) {
    const slide = pres.addSlide();
    slide.addImage({ path: shot, x: 0, y: 0, w: '100%', h: '100%' });
  }

  const outPath = path.join(outDir, OUTPUT);
  fs.mkdirSync(outDir, { recursive: true });
  await pres.writeFile({ fileName: outPath });
  return outPath;
}

async function main() {
  if (!fs.existsSync(htmlDir)) {
    console.error('缺少 ppt-html-v2/，请先完成 HTML 生成');
    process.exit(1);
  }
  const templatePath = path.join(root, TEMPLATE);
  if (!fs.existsSync(templatePath)) {
    console.warn('未找到学校模板，将仅输出纯截图 PPTX');
  }

  const port = 37523;
  const server = await startServer(port);
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    console.log('HTML v2 服务:', baseUrl);
    const shots = await captureSlides(baseUrl);
    const pptxPath = await buildPptx(shots);
    console.log('\n完成:', pptxPath);
    console.log('截图:', shotsDir);
    console.log('提示: 可将截图按页贴入', TEMPLATE, '对应版式，或直接使用本 PPTX 全页图演讲。');
    console.log('提示词文档: docs/毕业答辩PPT-生成提示词-v2.md');
  } finally {
    server.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
