# -*- coding: utf-8 -*-
"""从 LaTeX 源稿导出 Word（Pandoc + references.bib），可长期与 main.tex 同步维护。

用法（在 SurvivorAndFight 根目录）:
  py -3 tools/tex-to-docx.py
  py -3 tools/tex-to-docx.py --body-only
  py -3 tools/tex-to-docx.py -o thesis/main-from-tex.docx

依赖: Pandoc 3.x（https://pandoc.org）。未安装时可用 winget install JohnMacFarlane.Pandoc

说明:
  - 自动展开 \\input，跳过 upc-thesis-format / build-info 等版式宏包
  - 引用由 references.bib + citeproc 生成（顺序编码 [1]，接近 plain）
  - 目录/图目录请在 Word 中基于标题样式重新生成
  - 公式、longtable、部分 \\ref 可能需人工校对
"""
from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
THESIS = ROOT / "thesis"
BUILD = THESIS / "_export"
DEFAULT_OUT = THESIS / "main-from-tex.docx"
BIB = THESIS / "references.bib"
CSL = BUILD / "ieee.csl"

# 与 main.tex 一致的正文顺序（不含目录页、参考文献 LaTeX 环境）
BODY_INPUTS = [
    "chapter01",
    "chapter02",
    "chapter03",
    "chapter04",
    "chapter05",
    "chapter06",
    "chapter07",
    "chapter08",
]

BACKMATTER_INPUTS = [
    "acknowledgement",
    "appendix",
]

SKIP_INPUTS = {
    "upc-thesis-format",
    "build-info",
}

# 字体/版式命令后接空白、{、\ 或行尾，避免 \b 误匹配 \begin 等
_CMD_END = r"(?=\s|\\|{|\[|$)"

PANDOC_PREAMBLE = r"""% 由 tools/tex-to-docx.py 生成，仅供 Pandoc 解析
\documentclass[UTF8,a4paper]{ctexart}
\usepackage{graphicx}
\graphicspath{{figures/}}
\usepackage{booktabs}
\usepackage{longtable}
\usepackage{amsmath}
\usepackage{hyperref}
\hypersetup{colorlinks=false,hidelinks}

\newcommand{\thesisfig}[3]{%
  \begin{figure}[htbp]
    \centering
    \includegraphics[width=0.88\textwidth]{#1}%
    \caption{#2}\label{#3}%
  \end{figure}%
}

\newcommand{\thesistitle}{基于ECS架构的类吸血鬼幸存者游戏开发及优化（校外）}
\newcommand{\thesisauthor}{刘瀚文}
\newcommand{\thesisstudentid}{2207020509}
\newcommand{\thesismajor}{计算机科学与技术专业}
\newcommand{\thesisclass}{软件工程2205班}
\newcommand{\thesisadvisor}{董玉坤}
\newcommand{\thesisdate}{2026年6月}

\newcommand{\upcabstracttitle}{\section*{摘\quad 要}}
\newcommand{\upckeywords}[1]{\par\noindent\textbf{关键词：}#1\par}
\newcommand{\upcabstracten}{\section*{Abstract}}
\newcommand{\upckeywordsen}[1]{\par\noindent\textbf{Keywords:} #1\par}
\newcommand{\upcbibliography}{}
\newcommand{\backmatter}{}

\begin{document}
"""

PANDOC_POSTAMBLE = "\n\\end{document}\n"


def find_pandoc() -> str:
    exe = shutil.which("pandoc")
    if exe:
        return exe
    candidates = [
        Path(r"C:\Program Files\Pandoc\pandoc.exe"),
        Path.home() / "AppData/Local/Pandoc/pandoc.exe",
    ]
    winget_pkg = (
        Path.home()
        / "AppData/Local/Microsoft/WinGet/Packages"
    )
    if winget_pkg.is_dir():
        for p in winget_pkg.glob("JohnMacFarlane.Pandoc*/**/pandoc.exe"):
            candidates.append(p)
    for p in candidates:
        if p.is_file():
            return str(p)
    raise SystemExit(
        "未找到 pandoc。请安装: winget install JohnMacFarlane.Pandoc\n"
        "安装后重新打开终端再运行本脚本。"
    )


def ensure_csl() -> Path:
    BUILD.mkdir(parents=True, exist_ok=True)
    if CSL.is_file():
        return CSL
    url = (
        "https://raw.githubusercontent.com/citation-style-language/"
        "styles/master/ieee.csl"
    )
    try:
        import urllib.request

        print(f"下载 CSL: {url}")
        urllib.request.urlretrieve(url, CSL)
    except Exception as exc:
        raise SystemExit(f"无法下载 ieee.csl: {exc}") from exc
    return CSL


def expand_input(name: str, base: Path, stack: list[str]) -> str:
    key = name.strip()
    if not key.endswith(".tex"):
        key = f"{key}.tex"
    if Path(key).stem in SKIP_INPUTS:
        return f"% skipped: {key}\n"

    path = (base / key).resolve()
    if not path.is_file():
        return f"% missing input: {key}\n"

    rel = path.relative_to(base).as_posix()
    stem = path.stem
    if stem in stack:
        return f"% cycle skipped: {rel}\n"

    text = path.read_text(encoding="utf-8")
    stack.append(stem)

    def repl(m: re.Match[str]) -> str:
        return expand_input(m.group(1), base, stack)

    expanded = re.sub(
        r"\\input\{([^}]+)\}",
        repl,
        text,
        flags=re.IGNORECASE,
    )
    stack.pop()
    return expanded


def expand_if_file_exists(tex: str, base: Path) -> str:
    """展开 \\IfFileExists：文件存在则保留真分支，否则保留假分支。"""
    pat = re.compile(
        r"\\IfFileExists\{([^}]+)\}\{%\s*(.*?)%\s*\}\{%\s*(.*?)%\s*\}",
        re.DOTALL,
    )

    def repl(m: re.Match[str]) -> str:
        raw = m.group(1).strip()
        true_body = m.group(2).strip()
        false_body = m.group(3).strip()
        name = Path(raw).name
        candidates = [
            base / raw,
            base / name,
            base / "figures" / name,
        ]
        if any(p.is_file() for p in candidates):
            return true_body
        return false_body

    return pat.sub(repl, tex)


def strip_titlepage(tex: str) -> str:
    return re.sub(
        r"\\begin\{titlepage\}.*?\\end\{titlepage\}",
        "",
        tex,
        flags=re.DOTALL,
    )


def preprocess_chunk(tex: str) -> str:
    """将 ctex/版式命令转为 Pandoc 可读的简化 LaTeX。"""
    tex = strip_titlepage(tex)
    tex = expand_if_file_exists(tex, THESIS)

    rules: list[tuple[str, str]] = [
        (r"\\graphicspath\{\{figures/\}\}", ""),
        (r"\\input\{upc-thesis-format\}", ""),
        (r"\\input\{build-info\}", ""),
        (r"\\IfFileExists\{build-info\.tex\}\{[^}]*\}\{[^}]*\}", ""),
        (r"\\pagestyle\{[^}]+\}", ""),
        (r"\\thispagestyle\{[^}]+\}", ""),
        (r"\\pagenumbering\{[^}]+\}", ""),
        (r"\\setcounter\{page\}\{[^}]+\}", ""),
        (r"\\tableofcontents", "% [在 Word 中插入目录]\n"),
        (r"\\listoffigures", "% [在 Word 中插入图目录]\n"),
        (r"\\listoftables", "% [在 Word 中插入表目录]\n"),
        (r"\\bibliographystyle\{[^}]+\}", ""),
        (r"\\upcbibliography", ""),
        (r"\\addcontentsline\{[^}]+\}\{[^}]+\}\{[^}]+\}", ""),
        (r"\\clearpage\s*", "\n\n"),
        (r"\\newpage\s*", "\n\n"),
        (r"\\linespread\{[^}]+\}\\selectfont", ""),
        (r"\\setstretch\{[^}]+\}", ""),
        (r"\\setlength\{\\parindent\}\{[^}]+\}", ""),
        (r"\\vspace\*?\{[^}]+\}", "\n"),
        (rf"\\vfill{_CMD_END}", ""),
        (rf"\\noindent{_CMD_END}", ""),
        (rf"\\centering{_CMD_END}", ""),
        (rf"\\justifying{_CMD_END}", ""),
        (r"\\begin\{center\}", ""),
        (r"\\end\{center\}", ""),
        (r"\\begin\{minipage\}\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}", ""),
        (r"\\end\{minipage\}", ""),
        (rf"\\heiti{_CMD_END}", ""),
        (rf"\\songti{_CMD_END}", ""),
        (rf"\\fangsong{_CMD_END}", ""),
        (rf"\\kaishu{_CMD_END}", ""),
        (r"\\zihao\{[^}]+\}", ""),
        (rf"\\bfseries{_CMD_END}\s*", ""),
        (r"\\par(?!box)", "\n"),
        (r"\\textrm\{", "{"),
        (r"\\qquad", "　"),
        (r"\\quad", " "),
        (r"~", " "),
        (r"\\label\{([^}]+)\}", r"\\label{\1}"),
    ]
    for pat, repl in rules:
        tex = re.sub(pat, repl, tex, flags=re.DOTALL)

    # 封面元数据 → 文首段落
    tex = re.sub(
        r"\\underline\{\\hspace\{[^}]+\}([^\\]+)\\hspace\{[^}]+\}\}",
        r"\1",
        tex,
    )

    return tex


def validate_export_tex(tex: str) -> None:
    """导出前检查常见预处理错误。"""
    if "\x08egin{" in tex or "\x08egin{tabular}" in tex:
        raise SystemExit(
            "中间稿含损坏的 \\\\begin（疑似 \\\\b 转义错误），请检查 preprocess 替换串。"
        )
    if re.search(r"\\begin\{tabular\}\{ll\}p\{", tex):
        raise SystemExit(
            "tabular 列格式被截断（旧版预处理残留），请删除 thesis/_export 后重试。"
        )


def build_frontmatter() -> str:
    path = THESIS / "frontmatter.tex"
    if not path.is_file():
        return ""
    raw = path.read_text(encoding="utf-8")
    raw = strip_titlepage(raw)
    cover = (
        "\\section*{封面信息}\n\n"
        f"题目：\\thesistitle\\\\\n"
        f"学生：\\thesisauthor \\quad 学号：\\thesisstudentid\\\\\n"
        f"专业：\\thesismajor \\quad 班级：\\thesisclass\\\\\n"
        f"指导教师：\\thesisadvisor \\quad 日期：\\thesisdate\n\n"
        "\\textit{（声明页请在学院 Word 模板中保留；此处仅导出摘要供编辑。）}\n\n"
    )
    return cover + preprocess_chunk(raw)


def build_export_tex(*, body_only: bool) -> Path:
    BUILD.mkdir(parents=True, exist_ok=True)
    parts: list[str] = [PANDOC_PREAMBLE]

    if not body_only:
        parts.append(build_frontmatter())
        parts.append("\n% --- 正文（章节目录请在 Word 中生成）---\n\n")

    for name in BODY_INPUTS:
        parts.append(preprocess_chunk(expand_input(name, THESIS, [])))
        parts.append("\n")

    parts.append("% --- 致谢与附录 ---\n")
    for name in BACKMATTER_INPUTS:
        parts.append(preprocess_chunk(expand_input(name, THESIS, [])))
        parts.append("\n")

    parts.append(PANDOC_POSTAMBLE)
    merged = "".join(parts)
    validate_export_tex(merged)
    out_tex = BUILD / "thesis-pandoc.tex"
    out_tex.write_text(merged, encoding="utf-8")
    return out_tex


def run_pandoc(tex: Path, docx: Path, *, verbose: bool) -> None:
    pandoc = find_pandoc()
    ensure_csl()
    docx.parent.mkdir(parents=True, exist_ok=True)

    cmd = [
        pandoc,
        str(tex),
        "-f",
        "latex",
        "-t",
        "docx",
        "-o",
        str(docx),
        "--standalone",
        "--citeproc",
        f"--bibliography={BIB}",
        f"--csl={CSL}",
        "-M",
        "reference-section-title=参考文献",
        "-M",
        "lang=zh-CN",
        "--resource-path",
        str(THESIS),
    ]
    if verbose:
        cmd.append("--verbose")

    print("运行:", " ".join(cmd))
    proc = subprocess.run(cmd, cwd=str(THESIS), capture_output=True, text=True)
    if proc.returncode != 0:
        err = (proc.stderr or proc.stdout or "").strip()
        raise SystemExit(f"Pandoc 失败 (exit {proc.returncode}):\n{err}")
    if proc.stderr:
        print(proc.stderr)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="LaTeX 论文源稿 → Word (Pandoc)")
    p.add_argument(
        "-o",
        "--output",
        default=str(DEFAULT_OUT),
        help=f"输出 docx（默认 {DEFAULT_OUT.relative_to(ROOT)}）",
    )
    p.add_argument(
        "--body-only",
        action="store_true",
        help="跳过 frontmatter（封面/摘要），仅导出第1–8章+致谢+附录",
    )
    p.add_argument(
        "--tex-only",
        action="store_true",
        help="只生成 _export/thesis-pandoc.tex，不调用 Pandoc",
    )
    p.add_argument("-v", "--verbose", action="store_true")
    return p.parse_args()


def main() -> None:
    args = parse_args()
    out_docx = Path(args.output).resolve()
    tex = build_export_tex(body_only=args.body_only)
    print(f"已生成中间稿: {tex.relative_to(ROOT)} ({tex.stat().st_size // 1024} KB)")

    if args.tex_only:
        return

    run_pandoc(tex, out_docx, verbose=args.verbose)
    size_kb = out_docx.stat().st_size / 1024
    print(f"已导出 Word: {out_docx.relative_to(ROOT)} ({size_kb:.1f} KB)")
    print(
        "\n后续请在 Word 中:\n"
        "  1. 套用学院模板样式（标题1/2/3、正文）\n"
        "  2. 引用 → 目录 / 图表目录\n"
        "  3. 核对公式、表格与图片位置\n"
        "  4. 引用已为 [1] 顺序编码，可按需改 CSL 或文献样式"
    )


if __name__ == "__main__":
    main()
