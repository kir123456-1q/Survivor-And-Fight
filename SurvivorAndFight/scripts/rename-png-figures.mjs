/** 将 thesis/Png 下文件统一为 图x-x-原名称.png（UTF-8） */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { FIGURE_NAME_MAP, pngFileName } from "./figure-name-map.mjs";

const pngDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "thesis",
  "Png"
);

const targetNames = new Set(
  FIGURE_NAME_MAP.map((r) => pngFileName(r.no, r.base))
);

// 按 base 匹配：任意 *base*.png -> 图x-x-base.png
for (const row of FIGURE_NAME_MAP) {
  const target = pngFileName(row.no, row.base);
  const targetPath = path.join(pngDir, target);

  const candidates = fs
    .readdirSync(pngDir)
    .filter((f) => f.endsWith(".png") && f.includes(row.base));

  const src = candidates.find((f) => f !== target);
  if (!src) {
    if (fs.existsSync(targetPath)) console.log("已有:", target);
    continue;
  }
  const srcPath = path.join(pngDir, src);
  if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
  fs.renameSync(srcPath, targetPath);
  console.log(src, "->", target);
}

// 删除仍不匹配的旧文件（无 base 或重复乱码前缀）
for (const f of fs.readdirSync(pngDir)) {
  if (!f.endsWith(".png")) continue;
  if (targetNames.has(f)) continue;
  const m = f.match(/fig-[a-z0-9-]+\.png$/i) || f.match(/fig-ch\d+/);
  if (m || f.includes("fig-")) {
    fs.unlinkSync(path.join(pngDir, f));
    console.log("删除无效/重复:", f);
  }
}

console.log("\n当前文件:");
fs.readdirSync(pngDir)
  .filter((f) => f.endsWith(".png"))
  .sort()
  .forEach((f) => console.log(" ", f));
