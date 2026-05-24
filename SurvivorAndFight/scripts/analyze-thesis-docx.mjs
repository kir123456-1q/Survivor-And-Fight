/**
 * 解析毕业论文 docx，输出章节结构、已有图题、可补充插图建议。
 * 用法：node scripts/analyze-thesis-docx.mjs [docx路径]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultDocx = path.resolve(
  __dirname,
  "..",
  "肖泉-毕业论文 终稿.docx"
);
const docxPath = process.argv[2] ? path.resolve(process.argv[2]) : defaultDocx;

if (!fs.existsSync(docxPath)) {
  console.error("文件不存在:", docxPath);
  process.exit(1);
}

// 最小 zip 解压（docx = zip）
async function readDocumentXml() {
  const { createRequire } = await import("module");
  // 使用 Node 内置 zlib + 手动解析 zip 较复杂，改用动态 import adm-zip 若可用
  let AdmZip;
  try {
    const req = createRequire(import.meta.url);
    AdmZip = req("adm-zip");
  } catch {
    // 无 adm-zip：用 PowerShell 临时解压
    const { execSync } = await import("child_process");
    const tmp = path.join(path.dirname(docxPath), "_docx_tmp_analyze");
    if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true, force: true });
    fs.mkdirSync(tmp, { recursive: true });
    const ps = `Expand-Archive -LiteralPath '${docxPath.replace(/'/g, "''")}' -DestinationPath '${tmp.replace(/'/g, "''")}' -Force`;
    // docx 不是标准 zip for Expand-Archive on older PS - use Copy + rename
    const zipCopy = path.join(tmp, "doc.zip");
    fs.copyFileSync(docxPath, zipCopy);
    execSync(
      `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zipCopy.replace(/'/g, "''")}' -DestinationPath '${tmp.replace(/'/g, "''")}' -Force"`,
      { stdio: "inherit" }
    );
    const xmlPath = path.join(tmp, "word", "document.xml");
    const xml = fs.readFileSync(xmlPath, "utf8");
    fs.rmSync(tmp, { recursive: true, force: true });
    return xml;
  }
  const zip = new AdmZip(docxPath);
  return zip.readAsText("word/document.xml");
}

function decodeXmlText(s) {
  return s
    .replace(/<w:tab\/>/g, "\t")
    .replace(/<w:br[^/]*\/>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function extractParagraphs(xml) {
  const paras = [];
  const re = /<w:p[\s>][\s\S]*?<\/w:p>/g;
  let m;
  while ((m = re.exec(xml))) {
    const p = m[0];
    const styleMatch = p.match(/<w:pStyle w:val="([^"]+)"/);
    const style = styleMatch ? styleMatch[1] : "";
    const text = decodeXmlText(p);
    if (text) paras.push({ style, text });
  }
  return paras;
}

function isHeading(style, text) {
  if (/^Heading/i.test(style) || /^标题/.test(style)) return true;
  if (/^\d+(\.\d+)*\s+/.test(text) && text.length < 80) return true;
  if (/^第[一二三四五六七八九十\d]+章/.test(text)) return true;
  return false;
}

function isFigureCaption(text) {
  return /^图\s*\d+[-－]\d+/.test(text) || /^Figure\s+\d+/i.test(text);
}

function hasImageInParagraph(xml, pIndex, allP) {
  // 简化：图题前 3 段内若有 drawing 标记（在完整 xml 里查）
  return false;
}

const xml = await readDocumentXml();
const paras = extractParagraphs(xml);

// 统计图题
const figureCaptions = paras.filter((p) => isFigureCaption(p.text));
const headings = paras.filter((p) => isHeading(p.style, p.text));

// 关键词 → 建议插图类型
const figureSuggestions = [
  {
    chapter: "第2章 相关技术",
    keywords: ["ECS", "实体组件", "LayaAir", "MVC", "Roguelite", "跑图", "DAG"],
    suggest: [
      "轻量 ECS 与 Laya 节点绑定关系示意图（Entity + ViewComponent）",
      "Roguelite DAG 跑图节点类型示意（休息/战斗/Boss）",
      "MVC 与 UIStackManager 路由关系图",
    ],
  },
  {
    chapter: "第3章 需求分析",
    keywords: ["需求", "用例", "功能需求", "非功能"],
    suggest: [
      "系统用例图（玩家：菜单/跑图/战斗/装配/重启）",
      "需求分层与模块映射示意（可选，与表 3-x 配合）",
    ],
  },
  {
    chapter: "第4章 总体设计",
    keywords: ["分层", "架构", "时序", "可靠性", "容错", "ECS", "Worker"],
    suggest: [
      "图4-1 系统分层（已修复横向布局）",
      "图4-2 主交互时序（已提高导出分辨率）",
      "ECS 战斗数据流示意图（CombatDataPrepare → Worker/主线程 → MonsterChase）",
      "容错降级决策流程图（对应表 4-x）",
    ],
  },
  {
    chapter: "第5章 详细设计与实现",
    keywords: ["实现", "EffectExecutor", "技能", "子弹", "跑图", "装配"],
    suggest: [
      "图5-x Tab 技能装配时序（skill-tab-sequence.mmd 已有）",
      "SkillEffect 链式执行流程图（modifier → bullet）",
      "RunMapGenerator 生成与保底流程图",
      "类图或包图（EcsWorld / SimpleEcsDemo / 主要 System，PlantUML）",
    ],
  },
  {
    chapter: "第6章 性能优化",
    keywords: ["对象池", "Worker", "图集", "FPS", "帧"],
    suggest: [
      "对象池复用生命周期图（instantiate → pool → recycle）",
      "Worker 与主线程职责划分图",
      "性能测试对比柱状图（池化/图集前后 FPS、P95，由 CSV 导出）",
    ],
  },
  {
    chapter: "第7章 测试",
    keywords: ["测试", "截图", "FPS", "用例"],
    suggest: [
      "fig-01~06 运行截图（LaTeX 已有，Word 需插入对应位置）",
      "Performance 时间轴截图（GC/帧时间，archive 文档曾建议）",
      "五波 FPS 折线图或柱状图（表 7-x 数据可视化）",
    ],
  },
];

// 检测正文中是否提及图示但可能缺图
const bodyText = paras.map((p) => p.text).join("\n");
const missingMentions = [];
for (const pat of [
  /见图\s*[\d\-－]+/g,
  /如图\s*[\d\-－]+/g,
  /流程图/g,
  /架构图/g,
  /时序图/g,
  /用例图/g,
]) {
  const ms = bodyText.match(pat);
  if (ms) missingMentions.push(...ms);
}

const outPath = path.resolve(__dirname, "..", "docs", "论文插图补充建议.md");
const lines = [];
lines.push("# 毕业论文插图分析与补充建议");
lines.push("");
lines.push(`> 源文件：\`${path.basename(docxPath)}\``);
lines.push(`> 生成时间：${new Date().toISOString().slice(0, 10)}`);
lines.push("");

lines.push("## 一、文档中已识别的图题");
lines.push("");
if (figureCaptions.length === 0) {
  lines.push("（未在 docx 正文中匹配到「图 x-x」样式图题，可能使用图片题注域或纯嵌入图无文字题注。）");
} else {
  figureCaptions.forEach((p) => lines.push(`- ${p.text}`));
}
lines.push("");

lines.push("## 二、章节标题结构（节选）");
lines.push("");
headings.slice(0, 40).forEach((h) => lines.push(`- ${h.text}`));
if (headings.length > 40) lines.push(`- …共 ${headings.length} 个标题样式段落`);
lines.push("");

lines.push("## 三、图 4-1 / 4-2 问题说明与处理");
lines.push("");
lines.push("| 图号 | 问题 | 处理 |");
lines.push("|------|------|------|");
lines.push("| 图4-1 | 原 PNG 为 351×1924，竖长条按页宽缩放后超出页面被裁切 | `system-layers.mmd` 改为横向 LR 布局；`build.ps1` 提高导出宽度；LaTeX 使用 `width=\\linewidth,keepaspectratio` |");
lines.push("| 图4-2 | 原图约 784×739，打印偏糊 | `mermaid-cli` 使用 `-w 2400 -H 2800 -s 2` 重新导出 |");
lines.push("");

lines.push("## 四、建议补充插图的位置与内容");
lines.push("");
for (const block of figureSuggestions) {
  const hit = block.keywords.some((k) => bodyText.includes(k));
  if (!hit) continue;
  lines.push(`### ${block.chapter}`);
  lines.push("");
  block.suggest.forEach((s, i) => {
    const priority = i < 2 ? "【优先】" : "【可选】";
    lines.push(`- ${priority} ${s}`);
  });
  lines.push("");
}

lines.push("## 五、按现有 LaTeX/工程资产可直接复用的图");
lines.push("");
lines.push("| 资产 | 建议插入 Word 章节 |");
lines.push("|------|------------------|");
lines.push("| `thesis/figures/system-layers.png` | 第4章 系统分层 |");
lines.push("| `thesis/figures/system-sequence.png` | 第4章 交互时序 |");
lines.push("| `thesis/figures/skill-tab-sequence.png` | 第5章 Tab 装配 |");
lines.push("| `thesis/figures/fig-01-start.png` ~ `fig-06-restart.png` | 第7章 运行截图 |");
lines.push("| 第6/7章性能表数据 | 第6章 柱状/折线对比图（需用 Excel/Python 作图） |");
lines.push("");

lines.push("## 六、正文中「见图/如图」类表述（供核对是否已配图）");
lines.push("");
const uniq = [...new Set(missingMentions)].slice(0, 30);
if (uniq.length === 0) lines.push("（未检出）");
else uniq.forEach((u) => lines.push(`- ${u}`));
lines.push("");

lines.push("## 七、段落统计");
lines.push("");
lines.push(`- 正文段落数（近似）：${paras.length}`);
lines.push(`- 图题段落数：${figureCaptions.length}`);
lines.push(`- 标题段落数：${headings.length}`);

fs.writeFileSync(outPath, lines.join("\n"), "utf8");
console.log("已写入:", outPath);
console.log("图题数量:", figureCaptions.length);
console.log("标题数量:", headings.length);
