import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const mdPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "docs",
  "论文插图-Png清单.md"
);
let md = fs.readFileSync(mdPath, "utf8");
md = md.replace(
  /\| (图\d+-\d+) \| (图\d+-\d+-[^|]+?\.png)`/g,
  "| $1 | `$2`"
);
fs.writeFileSync(mdPath, md);
console.log("done");
