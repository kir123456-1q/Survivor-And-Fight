/**
 * 将 ppt-html/index.html 逐页截图并组装为 PPTX（整页图片型）
 *
 * 用法：node scripts/export-html-slides-to-pptx.cjs
 * 输出：ppt-output/毕业答辩PPT-HTML导出.pptx
 */
const path = require('path');
const fs = require('fs');
const http = require('http');
const { chromium } = require('playwright');
const pptxgen = require('pptxgenjs');

const root = path.resolve(__dirname, '..');
const htmlDir = path.join(root, 'ppt-html');
const outDir = path.join(root, 'ppt-output');
const shotsDir = path.join(outDir, 'html-slide-shots');
const SLIDE_COUNT = 19;
const OUTPUT_NAME = '毕业答辩PPT-HTML导出.pptx';

function mime(pathname) {
  const ext = path.extname(pathname).toLowerCase();
  const map = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.woff2': 'font/woff2',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
  };
  return map[ext] || 'application/octet-stream';
}

function startServer(port) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split('?')[0]);
      let filePath = path.join(htmlDir, urlPath === '/' ? 'index.html' : urlPath);
      if (!filePath.startsWith(htmlDir)) {
        res.writeHead(403);
        res.end();
        return;
      }
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404);
        res.end('Not found');
        return;
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
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
  });
  const shots = [];

  for (let i = 1; i <= SLIDE_COUNT; i++) {
    const page = await context.newPage();
    const url = `${baseUrl}/?export=1&slide=${i}`;
    console.log(`截图第 ${i}/${SLIDE_COUNT} 页…`);
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.body.dataset.ready === '1', { timeout: 10000 }).catch(() =>
      page.waitForTimeout(1500)
    );
    const outPath = path.join(shotsDir, `slide-${String(i).padStart(2, '0')}.png`);
    await page.screenshot({ path: outPath, fullPage: false });
    shots.push(outPath);
    await page.close();
  }

  await browser.close();
  return shots;
}

function buildPptx(shots) {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.author = '刘瀚文';
  pres.title = '基于 ECS 架构的类吸血鬼幸存者游戏开发及优化';
  pres.subject = '毕业设计答辩';

  for (const shot of shots) {
    const slide = pres.addSlide();
    slide.addImage({
      path: shot,
      x: 0,
      y: 0,
      w: '100%',
      h: '100%',
    });
  }

  const outPath = path.join(outDir, OUTPUT_NAME);
  fs.mkdirSync(outDir, { recursive: true });
  return pres.writeFile({ fileName: outPath }).then(() => outPath);
}

async function main() {
  const port = 37521;
  const server = await startServer(port);
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    console.log('HTML 幻灯片服务:', baseUrl);
    const shots = await captureSlides(baseUrl);
    const pptxPath = await buildPptx(shots);
    console.log('\n完成:', pptxPath);
    console.log('截图目录:', shotsDir);
    console.log('提示: 可在 PPT 中套用学校模板，将各页作为全页背景图或替换主图区。');
  } finally {
    server.close();
  }
}

main().catch((err) => {
  console.error('导出失败:', err);
  process.exit(1);
});
