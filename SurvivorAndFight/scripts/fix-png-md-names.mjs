import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { FIGURE_NAME_MAP, pngFileName } from "./figure-name-map.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

for (const file of ["docs/论文插图-Png清单.md", "docs/论文插图补充建议.md"]) {
  let md = fs.readFileSync(path.join(root, file), "utf8");
  // 去掉重复前缀 图x-x-图x-x-
  md = md.replace(/图(\d+-\d+)-图\1-/g, "图$1-");
  // 统一为正确文件名
  for (const r of FIGURE_NAME_MAP) {
    const correct = pngFileName(r.no, r.base);
    const wrongRe = new RegExp(
      `图${r.no.replace(/-/g, "\\-")}-[^\\s\`]+${r.base}\\.png`,
      "g"
    );
    md = md.replace(wrongRe, correct);
    md = md.replaceAll(r.base + ".png", correct);
  }
  fs.writeFileSync(path.join(root, file), md, "utf8");
  console.log("fixed", file);
}
