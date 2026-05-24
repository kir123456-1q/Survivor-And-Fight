import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { FIGURE_NAME_MAP, pngFileName } from "./figure-name-map.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

for (const rel of ["docs/论文插图-Png清单.md", "docs/论文插图补充建议.md"]) {
  let md = fs.readFileSync(path.join(root, rel), "utf8");
  for (const r of FIGURE_NAME_MAP) {
    const correct = pngFileName(r.no, r.base);
    // 匹配任意错误前缀 + base.png
    const re = new RegExp(
      `(thesis/Png/)?[\`"]?图[^\\s\`"]*${r.base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.png`,
      "g"
    );
    md = md.replace(re, (_m, p1) => (p1 ? `thesis/Png/${correct}` : correct));
  }
  fs.writeFileSync(path.join(root, rel), md, "utf8");
  console.log("synced", rel);
}
