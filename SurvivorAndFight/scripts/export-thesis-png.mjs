/**
 * 导出论文插图到 thesis/Png/（文件名：图x-x-原名称.png）
 * 用法: node scripts/export-thesis-png.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import {
  FIGURE_NAME_MAP,
  pngFileName,
  pngFileNameByBase,
} from "./figure-name-map.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const diagramsDir = path.join(root, "thesis", "diagrams");
const figuresDir = path.join(root, "thesis", "figures");
const pngDir = path.join(root, "thesis", "Png");

fs.mkdirSync(pngDir, { recursive: true });
fs.mkdirSync(diagramsDir, { recursive: true });

/** @type {Record<string, string[]>} */
const MERMAID_OPTS = {
  "fig-ch02-runmap-dag": ["-w", "2200", "-H", "720", "-s", "2"],
  "fig-ch04-01-layers": ["-w", "2000", "-H", "600", "-s", "2"],
  "fig-ch04-02-sequence": ["-w", "2400", "-H", "2800", "-s", "2"],
  "fig-ch05-tab-sequence": ["-w", "2000", "-H", "1400", "-s", "2"],
  "fig-ch06-chart-fps-atlas": ["-w", "1200", "-H", "800", "-s", "2"],
  "fig-ch06-chart-p95-pool": ["-w", "1200", "-H", "800", "-s", "2"],
  default: ["-w", "2000", "-H", "1200", "-s", "2"],
};

/** base -> 源 .mmd（相对 thesis/） */
const MERMAID_SOURCES = {
  "fig-ch04-01-layers": "figures/system-layers.mmd",
  "fig-ch04-02-sequence": "figures/system-sequence.mmd",
  "fig-ch05-tab-sequence": "figures/skill-tab-sequence.mmd",
};

function runMermaid(inputMmd, outputPng, extraArgs) {
  const args = [
    "--yes",
    "@mermaid-js/mermaid-cli",
    "-i",
    inputMmd,
    "-o",
    outputPng,
    "-b",
    "transparent",
    ...extraArgs,
  ];
  console.log("  mmdc:", path.basename(inputMmd), "->", path.basename(outputPng));
  execSync(`npx ${args.map((a) => `"${a}"`).join(" ")}`, {
    stdio: "inherit",
    cwd: root,
    shell: true,
  });
}

function outPathForBase(base) {
  return path.join(pngDir, pngFileNameByBase(base));
}

// 1) figures/*.mmd
for (const [base, relMmd] of Object.entries(MERMAID_SOURCES)) {
  const input = path.join(root, "thesis", relMmd);
  const output = outPathForBase(base);
  if (!fs.existsSync(input)) {
    console.warn("跳过（源文件不存在）:", relMmd);
    continue;
  }
  const opts = MERMAID_OPTS[base] || MERMAID_OPTS.default;
  runMermaid(input, output, opts);
}

// 2) diagrams/*.mmd
if (fs.existsSync(diagramsDir)) {
  for (const file of fs.readdirSync(diagramsDir).filter((f) => f.endsWith(".mmd"))) {
    const base = file.replace(/\.mmd$/, "");
    const input = path.join(diagramsDir, file);
    const output = outPathForBase(base);
    const opts = MERMAID_OPTS[base] || MERMAID_OPTS.default;
    runMermaid(input, output, opts);
  }
}

// 3) 运行截图
for (const { base } of FIGURE_NAME_MAP.filter((r) => r.no.startsWith("7-"))) {
  const src = path.join(figuresDir, `${base}.png`);
  const dst = outPathForBase(base);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
    console.log("  copy:", path.basename(dst));
  } else {
    console.warn("  截图缺失:", `${base}.png`);
  }
}

// 4) LaTeX 仍使用 figures/system-*.png（从图4-1/4-2 复制）
const layersPng = outPathForBase("fig-ch04-01-layers");
const seqPng = outPathForBase("fig-ch04-02-sequence");
if (fs.existsSync(layersPng)) {
  fs.copyFileSync(layersPng, path.join(figuresDir, "system-layers.png"));
}
if (fs.existsSync(seqPng)) {
  fs.copyFileSync(seqPng, path.join(figuresDir, "system-sequence.png"));
}

// 5) 删除 Png 下未带「图x-x-」前缀的旧文件名
const validNames = new Set(FIGURE_NAME_MAP.map((r) => pngFileName(r.no, r.base)));
for (const f of fs.readdirSync(pngDir)) {
  if (!f.endsWith(".png")) continue;
  if (validNames.has(f)) continue;
  if (/^图\d+-\d+-/.test(f)) continue;
  const oldPath = path.join(pngDir, f);
  fs.unlinkSync(oldPath);
  console.log("  移除旧名:", f);
}

console.log("\nPNG 目录:", pngDir);
console.log("共", validNames.size, "个文件（图x-x-原名称.png）");
