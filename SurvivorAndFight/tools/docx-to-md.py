#!/usr/bin/env python3
"""Extract Word docx to markdown (headings + paragraphs)."""
from __future__ import annotations

import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def para_style(p) -> str | None:
    p_pr = p.find(f"{W}pPr")
    if p_pr is None:
        return None
    p_style = p_pr.find(f"{W}pStyle")
    if p_style is not None:
        return p_style.get(f"{W}val")
    outline = p_pr.find(f"{W}outlineLvl")
    if outline is not None:
        val = outline.get(f"{W}val")
        if val is not None:
            return f"outline{val}"
    return None


def is_heading(style: str | None, text: str) -> bool:
    if style and re.search(r"heading|标题", style, re.I):
        return True
    t = text.strip()
    if re.match(r"^第[一二三四五六七八九十\d]+章", t):
        return True
    if re.match(r"^\d+(\.\d+)+\s*\S", t) and len(t) < 80:
        return True
    if re.match(r"^[一二三四五六七八九十]+、", t):
        return True
    return False


def heading_level(style: str | None, text: str) -> int:
    if style:
        m = re.search(r"(\d+)", style)
        if m:
            return min(6, int(m.group(1)))
    t = text.strip()
    m = re.match(r"^(\d+(?:\.\d+)*)", t)
    if m:
        return min(6, m.group(1).count(".") + 1)
    if re.match(r"^第.+章", t):
        return 1
    return 2


def docx_to_md(docx_path: Path) -> list[str]:
    with zipfile.ZipFile(docx_path) as z:
        root = ET.fromstring(z.read("word/document.xml"))

    lines: list[str] = []
    for p in root.iter(f"{W}p"):
        texts = []
        for t in p.iter(f"{W}t"):
            texts.append(t.text or "")
        text = "".join(texts)
        if not text.strip():
            lines.append("")
            continue
        style = para_style(p)
        if is_heading(style, text):
            lvl = heading_level(style, text)
            lines.append("#" * lvl + " " + text.strip())
        else:
            lines.append(text.strip())

    md: list[str] = []
    blank = 0
    for ln in lines:
        if ln == "":
            blank += 1
            if blank <= 1:
                md.append("")
        else:
            blank = 0
            md.append(ln)
    return md


def main() -> int:
    repo = Path(__file__).resolve().parents[1]
    default_docx = repo.parent / "基于 ECS 架构的类吸血鬼幸存者游戏开发及优化（校外）.docx"
    docx = Path(sys.argv[1]) if len(sys.argv) > 1 else default_docx
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else repo / "docs" / "thesis-from-docx.md"

    if not docx.is_file():
        print(f"docx not found: {docx}", file=sys.stderr)
        return 1

    md = docx_to_md(docx)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(md), encoding="utf-8")
    print(f"Wrote {len(md)} lines -> {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
