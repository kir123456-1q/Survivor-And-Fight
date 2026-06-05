/**
 * 去除中文与英文/数字交界处的空格（保留英文词组内部空格、Markdown 标题 # 后空格）
 * 用法: node scripts/strip-cjk-latin-spaces.mjs [文件路径...]
 */
import fs from "fs";
import path from "path";

const CJK =
  "\\u2E80-\\u2EFF\\u3000-\\u303F\\u3400-\\u4DBF\\u4E00-\\u9FFF\\uF900-\\uFAFF";
const LAT = "A-Za-z0-9_\\.\\(\\)\\[\\]\\+\\-\\*/=→:;,%@#&";

function stripBoundarySpaces(text) {
  const lines = text.split("\n");
  const out = lines.map((line) => {
    // 保留 Markdown 标题行中 # 与标题文字之间的空格
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      return `${heading[1]} ${stripLine(heading[2])}`;
    }
    return stripLine(line);
  });
  return out.join("\n");
}

function stripLine(text) {
  let prev;
  const cjk = `[${CJK}]`;
  const lat = `[${LAT}]`;
  do {
    prev = text;
    text = text.replace(new RegExp(`(${cjk}) +(${lat})`, "g"), "$1$2");
    text = text.replace(new RegExp(`(${lat}) +(${cjk})`, "g"), "$1$2");
    text = text.replace(/(图\d+(?:\.\d+)?-\d+) +/g, "$1");
    text = text.replace(/(表\d+(?:\.\d+)?-\d+) +/g, "$1");
    text = text.replace(/(第\d+(?:\.\d+)*节?) +/g, "$1");
    text = text.replace(/ +(所示|所示，|所示；|所示。)/g, "$1");
  } while (text !== prev);
  return text;
}

const files = process.argv.slice(2);
const defaultFile = path.join("docs", "论文改写对照-校外稿.md");
const targets = files.length ? files : [defaultFile];

for (const rel of targets) {
  const file = path.isAbsolute(rel) ? rel : path.join(process.cwd(), rel);
  const text = fs.readFileSync(file, "utf8");
  const out = stripBoundarySpaces(text);
  if (out !== text) {
    fs.writeFileSync(file, out, "utf8");
    console.log("updated:", file);
  } else {
    console.log("unchanged:", file);
  }
}
