# -*- coding: utf-8 -*-
"""
读取学院本科毕业设计 Word 模板（.docx），导出正文、样式、图片与 LaTeX 格式建议。

用法:
  python tools/read-docx-thesis-template.py
  python tools/read-docx-thesis-template.py "path/to/template.docx" -o docs/thesis-docx-extract

依赖: 仅 Python 3 标准库（zipfile + xml）；可选 python-docx 作补充校验。
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DOCX = ROOT / "本科毕业设计(论文)参考模板-计算机学院.docx"
DEFAULT_OUT = ROOT / "docs" / "thesis-docx-extract"

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
A_NS = "http://schemas.openxmlformats.org/drawingml/2006/main"
WP_NS = "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"

NS = {"w": W_NS, "r": R_NS, "a": A_NS, "wp": WP_NS, "rel": REL_NS}


def q(tag: str) -> str:
    return f"{{{W_NS}}}{tag}"


def qr(tag: str) -> str:
    return f"{{{R_NS}}}{tag}"


V_NS = "urn:schemas-microsoft-com:vml"
O_NS = "urn:schemas-microsoft-com:office:office"


def get_rel_embed_id(elem: ET.Element) -> str | None:
    """读取 r:embed / r:id（DrawingML 与 VML 图片均可能出现）。"""
    for key in (
        qr("embed"),
        qr("id"),
        f"{{{O_NS}}}relid",
        "embed",
        "id",
    ):
        val = elem.get(key)
        if val:
            return val
    return None


def emu_to_cm(emu: str | None) -> float | None:
    if not emu:
        return None
    try:
        return int(emu) / 360000.0
    except ValueError:
        return None


def collect_blips_in_element(elem: ET.Element, rels: dict[str, str], source: str) -> list[dict]:
    """在任意 XML 子树中收集图片引用（含 w:drawing 内 a:blip）。"""
    found: list[dict] = []
    seen: set[str] = set()
    for blip in elem.iter(f"{{{A_NS}}}blip"):
        rid = get_rel_embed_id(blip)
        if not rid or rid in seen or rid not in rels:
            continue
        seen.add(rid)
        target = rels[rid]
        entry: dict = {
            "rel_id": rid,
            "target": target,
            "source": source,
            "format": Path(target).suffix.lower().lstrip("."),
        }
        found.append(entry)
    # 旧式 VML：v:imagedata r:id="rId16"
    for im in elem.iter(f"{{{V_NS}}}imagedata"):
        rid = get_rel_embed_id(im)
        if not rid or rid in seen or rid not in rels:
            continue
        seen.add(rid)
        found.append(
            {
                "rel_id": rid,
                "target": rels[rid],
                "source": source,
                "format": Path(rels[rid]).suffix.lower().lstrip("."),
                "vml": True,
            }
        )
    return found


def enrich_image_sizes(p: ET.Element, images: list[dict]) -> None:
    """为段落内图片补充 wp:extent 尺寸（EMU）。"""
    extents = []
    for ext in p.iter(f"{{{WP_NS}}}extent"):
        extents.append(
            {
                "cx": ext.get("cx"),
                "cy": ext.get("cy"),
                "width_cm": emu_to_cm(ext.get("cx")),
                "height_cm": emu_to_cm(ext.get("cy")),
            }
        )
    for i, img in enumerate(images):
        if i < len(extents):
            img.update(extents[i])


def convert_emf_to_png(emf_path: Path, png_path: Path) -> bool:
    """Windows 下用 GDI+ 将 EMF 转为 PNG（供 LaTeX 使用）。"""
    if not emf_path.exists() or emf_path.suffix.lower() != ".emf":
        return False
    if png_path.exists():
        return True
    ps = (
        "Add-Type -AssemblyName System.Drawing; "
        f"$m=[System.Drawing.Imaging.Metafile]::new('{emf_path}'); "
        f"$m.Save('{png_path}',[System.Drawing.Imaging.ImageFormat]::Png); "
        "$m.Dispose()"
    )
    try:
        import subprocess

        subprocess.run(
            ["powershell", "-NoProfile", "-Command", ps],
            check=True,
            capture_output=True,
        )
        return png_path.exists()
    except Exception:
        return False


def build_images_inventory(
    blocks: list[dict], rels: dict[str, str], media_out: Path
) -> list[dict]:
    """汇总全部图片并标注封面校徽（正文第一个图片，通常为 image1.emf）。"""
    inventory: list[dict] = []
    para_idx = 0
    for b in blocks:
        para_idx += 1
        for img in b.get("images", []):
            target = img.get("target", "")
            fname = Path(target).name
            abs_path = media_out / fname
            entry = {
                **img,
                "paragraph_index": para_idx,
                "paragraph_text_preview": (b.get("text") or "")[:40],
                "abs_path": str(abs_path),
            }
            inventory.append(entry)

    # 封面校徽：第一个出现的图片，且多为 emf
    for i, item in enumerate(inventory):
        role = "body"
        if i == 0:
            role = "cover_logo"
        item["role"] = role
        if role == "cover_logo" and item.get("format") == "emf":
            png = media_out / "cover-logo.png"
            if convert_emf_to_png(Path(item["abs_path"]), png):
                item["png_converted"] = str(png)
                item["latex_path"] = "figures/cover-logo.png"

    return inventory


def half_points_to_pt(sz: str | None) -> float | None:
    if not sz:
        return None
    try:
        return int(sz) / 2.0
    except ValueError:
        return None


def twips_to_cm(val: str | None) -> float | None:
    if not val:
        return None
    try:
        return int(val) / 567.0
    except ValueError:
        return None


def pt_to_ctex_zihao(pt: float) -> str:
    """粗略映射 Word 磅值到 ctex 字号名。"""
    mapping = [
        (42, "chuhao"),
        (36, "xiaochu"),
        (26, "yihao"),
        (24, "erhao"),
        (22, "xiaoer"),
        (18, "sanhao"),
        (16, "xiaosan"),
        (15, "sihao"),
        (14, "xiaosi"),
        (12, "wuhao"),
        (10.5, "xiaowu"),
        (9, "liuhao"),
        (7.5, "xiaoqiu"),
    ]
    for threshold, name in mapping:
        if pt >= threshold - 0.5:
            return name
    return "xiaowu"


def read_styles(styles_path: Path) -> dict:
    tree = ET.parse(styles_path)
    root = tree.getroot()
    styles: dict[str, dict] = {}
    for st in root.findall("w:style", NS):
        sid = st.get(q("styleId"))
        name_el = st.find("w:name", NS)
        name = name_el.get(q("val")) if name_el is not None else sid
        p_pr = st.find("w:pPr", NS)
        r_pr = st.find("w:rPr", NS)
        info: dict = {"id": sid, "name": name, "type": st.get(q("type"))}
        if p_pr is not None:
            jc = p_pr.find("w:jc", NS)
            if jc is not None:
                info["align"] = jc.get(q("val"))
            ind = p_pr.find("w:ind", NS)
            if ind is not None:
                info["first_line_chars"] = ind.get(q("firstLineChars"))
                info["first_line_twips"] = ind.get(q("firstLine"))
            spacing = p_pr.find("w:spacing", NS)
            if spacing is not None:
                info["line"] = spacing.get(q("line"))
                info["line_rule"] = spacing.get(q("lineRule"))
        if r_pr is not None:
            fonts = r_pr.find("w:rFonts", NS)
            if fonts is not None:
                info["font_ascii"] = fonts.get(q("ascii"))
                info["font_east_asia"] = fonts.get(q("eastAsia"))
            sz = r_pr.find("w:sz", NS)
            if sz is not None:
                pt = half_points_to_pt(sz.get(q("val")))
                info["size_pt"] = pt
                info["zihao"] = pt_to_ctex_zihao(pt) if pt else None
            bold = r_pr.find("w:b", NS)
            info["bold"] = bold is not None
        styles[sid or name] = info
    return styles


def read_page_margins(document_path: Path) -> dict:
    tree = ET.parse(document_path)
    root = tree.getroot()
    body = root.find("w:body", NS)
    if body is None:
        return {}
    sect = body.find("w:sectPr", NS)
    if sect is None:
        return {}
    pg_mar = sect.find("w:pgMar", NS)
    if pg_mar is None:
        return {}
    return {
        "top_cm": twips_to_cm(pg_mar.get(q("top"))),
        "bottom_cm": twips_to_cm(pg_mar.get(q("bottom"))),
        "left_cm": twips_to_cm(pg_mar.get(q("left"))),
        "right_cm": twips_to_cm(pg_mar.get(q("right"))),
        "header_cm": twips_to_cm(pg_mar.get(q("header"))),
        "footer_cm": twips_to_cm(pg_mar.get(q("footer"))),
    }


def load_relationships(rels_path: Path) -> dict[str, str]:
    if not rels_path.exists():
        return {}
    tree = ET.parse(rels_path)
    rels = {}
    for rel in tree.getroot():
        rid = rel.get("Id")
        target = rel.get("Target")
        if rid and target:
            rels[rid] = target
    return rels


def run_formatting(run: ET.Element) -> dict:
    r_pr = run.find("w:rPr", NS)
    fmt: dict = {}
    if r_pr is None:
        return fmt
    fonts = r_pr.find("w:rFonts", NS)
    if fonts is not None:
        for key in ("ascii", "eastAsia", "hAnsi"):
            v = fonts.get(q(key))
            if v:
                fmt[f"font_{key}"] = v
    sz = r_pr.find("w:sz", NS)
    if sz is not None:
        pt = half_points_to_pt(sz.get(q("val")))
        fmt["size_pt"] = pt
        fmt["zihao"] = pt_to_ctex_zihao(pt) if pt else None
    if r_pr.find("w:b", NS) is not None:
        fmt["bold"] = True
    if r_pr.find("w:i", NS) is not None:
        fmt["italic"] = True
    if r_pr.find("w:u", NS) is not None:
        fmt["underline"] = True
    color = r_pr.find("w:color", NS)
    if color is not None:
        fmt["color"] = color.get(q("val"))
    return fmt


def paragraph_style_id(p: ET.Element) -> str | None:
    p_pr = p.find("w:pPr", NS)
    if p_pr is None:
        return None
    ps = p_pr.find("w:pStyle", NS)
    return ps.get(q("val")) if ps is not None else None


def extract_paragraph_text(p: ET.Element) -> str:
    parts: list[str] = []
    for t in p.iter(q("t")):
        if t.text:
            parts.append(t.text)
        if t.tail:
            parts.append(t.tail)
    return "".join(parts).strip()


def parse_document(document_path: Path, rels: dict[str, str], media_dir: Path) -> list[dict]:
    tree = ET.parse(document_path)
    body = tree.getroot().find("w:body", NS)
    if body is None:
        return []
    blocks: list[dict] = []
    img_index = 0
    for child in body:
        tag = child.tag.split("}")[-1] if "}" in child.tag else child.tag
        if tag == "sectPr":
            continue
        if tag != "p":
            continue
        p = child
        style_id = paragraph_style_id(p)
        runs: list[dict] = []
        images: list[dict] = []
        for run in p.findall("w:r", NS):
            fmt = run_formatting(run)
            text = extract_paragraph_text(run)
            if text:
                runs.append({"text": text, **fmt})
        # 在整段内查找图片（封面校徽常在仅含 w:drawing 的段落，须在段落级搜索）
        para_images = collect_blips_in_element(p, rels, "document.xml")
        for img in para_images:
            img_index += 1
            img["index"] = img_index
            images.append(img)
        enrich_image_sizes(p, images)
        para_text = extract_paragraph_text(p)
        if not para_text and not images:
            continue
        blocks.append(
            {
                "type": "paragraph",
                "style_id": style_id,
                "text": para_text,
                "runs": runs,
                "images": images,
            }
        )
    return blocks


def extract_headers_footers(word_dir: Path, rels: dict[str, str]) -> dict:
    result = {}
    for path in sorted(word_dir.glob("header*.xml")):
        texts = []
        hdr_images = []
        tree = ET.parse(path)
        hdr_rels = load_relationships(path.parent / "_rels" / f"{path.name}.rels")
        merged_rels = {**rels, **hdr_rels}
        for p in tree.getroot().iter(q("p")):
            t = extract_paragraph_text(p)
            if t:
                texts.append(t)
            hdr_images.extend(collect_blips_in_element(p, merged_rels, path.name))
        result[path.name] = {"texts": texts, "images": hdr_images}
    for path in sorted(word_dir.glob("footer*.xml")):
        texts = []
        ftr_images = []
        tree = ET.parse(path)
        ftr_rels = load_relationships(path.parent / "_rels" / f"{path.name}.rels")
        merged_rels = {**rels, **ftr_rels}
        for p in tree.getroot().iter(q("p")):
            t = extract_paragraph_text(p)
            if t:
                texts.append(t)
            ftr_images.extend(collect_blips_in_element(p, merged_rels, path.name))
        result[path.name] = {"texts": texts, "images": ftr_images}
    return result


def copy_media(zip_path: Path, out_media: Path) -> list[dict]:
    out_media.mkdir(parents=True, exist_ok=True)
    copied = []
    with zipfile.ZipFile(zip_path) as zf:
        for name in zf.namelist():
            if name.startswith("word/media/"):
                data = zf.read(name)
                fname = Path(name).name
                dest = out_media / fname
                dest.write_bytes(data)
                copied.append({"archive": name, "file": str(dest.relative_to(out_media.parent.parent))})
    return copied


def build_latex_recommendations(styles: dict, margins: dict) -> dict:
    """根据 styles.xml 与学院模板说明生成 LaTeX 建议。"""
    h1 = styles.get("2") or styles.get("heading 1", {})
    h2 = styles.get("3") or styles.get("heading 2", {})
    h3 = styles.get("4") or styles.get("heading 3", {})
    normal = styles.get("1") or styles.get("Normal", {})
    header = styles.get("12") or styles.get("header", {})

    return {
        "documentclass": "ctexrep",
        "options": ["UTF8", "a4paper", "zihao=-4", "linespread=1.5"],
        "geometry_cm": margins or {"top": 2.5, "bottom": 2.5, "left": 3.0, "right": 2.5},
        "body": {
            "font": "songti",
            "zihao": normal.get("zihao", "xiaosi"),
            "linespread": 1.5,
            "indent": "2em",
        },
        "chapter": {
            "format": "第\\arabic{chapter}章",
            "font": h1.get("font_east_asia", "heiti"),
            "zihao": h1.get("zihao", "sanhao"),
            "align": h1.get("align", "center"),
        },
        "section": {
            "font": h2.get("font_east_asia", "heiti"),
            "zihao": h2.get("zihao", "xiaosan"),
        },
        "subsection": {
            "font": h3.get("font_east_asia", "heiti"),
            "zihao": h3.get("zihao", "sihao"),
        },
        "pagestyle": {
            "frontmatter_header": "中国石油大学（华东）本科毕业设计(论文)",
            "frontmatter_font": "kaishu",
            "frontmatter_zihao": header.get("zihao", "wuhao"),
            "body_header": "chapter_title",
            "footer_font": "Times New Roman",
            "footer_zihao": "wuhao",
            "footer_align": "center",
        },
        "notes_from_template": [
            "封面、摘要、目录无页眉页码",
            "摘要/目录/致谢/参考文献/附录页眉为固定学校标题（楷体五号）",
            "正文各章页眉为章标题",
            "正文至附录页脚阿拉伯数字居中（Times New Roman 五号）",
            "三级以下标题可用 1、（1）① 等，小四号宋体",
        ],
    }


def blocks_to_markdown(blocks: list[dict], styles: dict, inventory: list[dict] | None = None) -> str:
    lines = ["# Word 模板提取", ""]
    if inventory:
        lines.append("## 图片清单")
        for img in inventory:
            role = img.get("role", "")
            lines.append(
                f"- **{role}** `{img.get('target')}` "
                f"(段落 {img.get('paragraph_index')}, {img.get('format')})"
            )
            if img.get("png_converted"):
                lines.append(f"  - 已转 PNG: `{img.get('png_converted')}`")
        lines.append("")
    for i, b in enumerate(blocks, 1):
        sid = b.get("style_id") or ""
        sname = styles.get(sid, {}).get("name", sid)
        lines.append(f"## 段落 {i} [{sname}]")
        if b.get("text"):
            lines.append(b["text"])
            lines.append("")
        if b.get("runs"):
            lines.append("**runs:**")
            for r in b["runs"]:
                flags = []
                if r.get("bold"):
                    flags.append("bold")
                if r.get("italic"):
                    flags.append("italic")
                meta = ", ".join(
                    x
                    for x in [
                        r.get("font_eastAsia"),
                        f"{r.get('size_pt')}pt" if r.get("size_pt") else None,
                        "+".join(flags) if flags else None,
                    ]
                    if x
                )
                lines.append(f"- `{r.get('text','')}` ({meta})")
            lines.append("")
        for img in b.get("images", []):
            role = img.get("role", "")
            lines.append(f"![{role or 'image'}]({img.get('target')})")
            if img.get("png_converted"):
                lines.append(f"PNG: `{img.get('png_converted')}`")
            lines.append("")
    return "\n".join(lines)


def write_latex_snippet(latex_path: Path, rec: dict) -> None:
    g = rec["geometry_cm"]
    lines = [
        "% 由 tools/read-docx-thesis-template.py 根据学院 Word 模板自动生成，可手工微调",
        f"% geometry: top={g.get('top_cm', 2.5)}cm ...",
        "",
        "\\usepackage{geometry}",
        f"\\geometry{{left={g.get('left_cm', 3.0)}cm,right={g.get('right_cm', 2.5)}cm,"
        f"top={g.get('top_cm', 2.5)}cm,bottom={g.get('bottom_cm', 2.5)}cm}}",
        "",
        "\\setlength{\\headheight}{13pt}",
        "\\setlength{\\parindent}{2em}",
        "",
        "\\CTEXsetup[name={第,章},number={\\arabic{chapter}}]{chapter}",
        "\\CTEXsetup[format={\\heiti\\zihao{-3}\\centering}]{chapter}",
        "\\CTEXsetup[format={\\heiti\\zihao{4}}]{section}",
        "\\CTEXsetup[format={\\heiti\\zihao{-4}}]{subsection}",
        "",
    ]
    latex_path.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="读取学院毕业设计 docx 模板")
    parser.add_argument("docx", nargs="?", default=str(DEFAULT_DOCX), help=".docx 路径")
    parser.add_argument("-o", "--out", default=str(DEFAULT_OUT), help="输出目录")
    args = parser.parse_args()

    docx_path = Path(args.docx).resolve()
    out_dir = Path(args.out).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    media_out = out_dir / "media"
    unpack_dir = out_dir / "_unpack"

    if not docx_path.exists():
        raise SystemExit(f"文件不存在: {docx_path}")

    if unpack_dir.exists():
        shutil.rmtree(unpack_dir)
    with zipfile.ZipFile(docx_path) as zf:
        zf.extractall(unpack_dir)

    word_dir = unpack_dir / "word"
    styles = read_styles(word_dir / "styles.xml")
    margins = read_page_margins(word_dir / "document.xml")
    rels = load_relationships(word_dir / "_rels" / "document.xml.rels")
    blocks = parse_document(word_dir / "document.xml", rels, word_dir / "media")
    headers = extract_headers_footers(word_dir, rels)
    media_files = copy_media(docx_path, media_out)
    images_inventory = build_images_inventory(blocks, rels, media_out)
    # 将 role 写回 blocks 内图片条目
    inv_by_rid = {x["rel_id"]: x for x in images_inventory}
    for b in blocks:
        for img in b.get("images", []):
            if img.get("rel_id") in inv_by_rid:
                img.update(inv_by_rid[img["rel_id"]])
    latex_rec = build_latex_recommendations(styles, margins)
    if images_inventory:
        cover = next((x for x in images_inventory if x.get("role") == "cover_logo"), None)
        if cover:
            latex_rec["cover_logo"] = {
                "source": cover.get("target"),
                "emf": cover.get("abs_path"),
                "png": cover.get("png_converted"),
                "latex_include": cover.get("latex_path"),
                "note": "封面左上角校徽，原格式为 EMF，需转为 PNG 后供 XeLaTeX 使用",
            }

    (out_dir / "styles.json").write_text(
        json.dumps(styles, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (out_dir / "margins.json").write_text(
        json.dumps(margins, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (out_dir / "content.json").write_text(
        json.dumps(blocks, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (out_dir / "headers-footers.json").write_text(
        json.dumps(headers, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (out_dir / "media-index.json").write_text(
        json.dumps(media_files, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (out_dir / "images-inventory.json").write_text(
        json.dumps(images_inventory, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (out_dir / "latex-recommendations.json").write_text(
        json.dumps(latex_rec, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (out_dir / "content.md").write_text(
        blocks_to_markdown(blocks, styles, images_inventory), encoding="utf-8"
    )
    write_latex_snippet(out_dir / "latex-snippet.tex", latex_rec)

    print(f"OK: {docx_path.name}")
    print(f"  paragraphs: {len(blocks)}")
    print(f"  images: {len(media_files)} -> {media_out}")
    cover = next((x for x in images_inventory if x.get("role") == "cover_logo"), None)
    if cover:
        print(f"  cover logo: {cover.get('target')} -> {cover.get('png_converted', '(EMF only)')}")
    print(f"  output: {out_dir}")
    print(f"  LaTeX snippet: {out_dir / 'latex-snippet.tex'}")


if __name__ == "__main__":
    main()
