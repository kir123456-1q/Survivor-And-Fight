# -*- coding: utf-8 -*-
"""将 PDF 转为 Word (.docx)。

用法:
  python tools/pdf-to-docx.py
  python tools/pdf-to-docx.py thesis/main.pdf
  python tools/pdf-to-docx.py input.pdf -o output.docx
  python tools/pdf-to-docx.py input.pdf --start 1 --end 10

依赖: pdf2docx（首次运行会自动 pip install）
说明: 版式尽量保留，复杂公式/双栏/扫描件可能需人工校对；论文源稿建议仍以 LaTeX 为准。
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PDF = ROOT / "thesis" / "main.pdf"


def ensure_pdf2docx():
    try:
        from pdf2docx import Converter  # noqa: F401
    except ImportError:
        import subprocess

        print("正在安装 pdf2docx …")
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", "pdf2docx", "-q"],
            stdout=subprocess.DEVNULL,
        )
        from pdf2docx import Converter  # noqa: F401

    from pdf2docx import Converter

    return Converter


def convert(
    pdf_path: Path,
    docx_path: Path,
    *,
    start: int | None = None,
    end: int | None = None,
) -> None:
    Converter = ensure_pdf2docx()
    docx_path.parent.mkdir(parents=True, exist_ok=True)

    cv = Converter(str(pdf_path))
    try:
        kwargs: dict = {}
        if start is not None:
            kwargs["start"] = start
        if end is not None:
            kwargs["end"] = end
        cv.convert(str(docx_path), **kwargs)
    finally:
        cv.close()

    size_kb = docx_path.stat().st_size / 1024
    print(f"已生成: {docx_path} ({size_kb:.1f} KB)")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="PDF 转 Word (.docx)，基于 pdf2docx 保留版式与图片。"
    )
    parser.add_argument(
        "pdf",
        nargs="?",
        default=str(DEFAULT_PDF),
        help=f"输入 PDF（默认: {DEFAULT_PDF.relative_to(ROOT)}）",
    )
    parser.add_argument(
        "-o",
        "--output",
        help="输出 .docx 路径（默认同目录、同名 .docx）",
    )
    parser.add_argument(
        "--start",
        type=int,
        default=None,
        metavar="N",
        help="起始页（1 起，含）",
    )
    parser.add_argument(
        "--end",
        type=int,
        default=None,
        metavar="N",
        help="结束页（含）",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    pdf_path = Path(args.pdf).resolve()
    if not pdf_path.exists():
        raise SystemExit(f"PDF 不存在: {pdf_path}")
    if pdf_path.suffix.lower() != ".pdf":
        raise SystemExit(f"需要 .pdf 文件: {pdf_path}")

    if args.output:
        docx_path = Path(args.output).resolve()
    else:
        docx_path = pdf_path.with_suffix(".docx")

    if args.start is not None and args.start < 1:
        raise SystemExit("--start 须 >= 1")
    if args.end is not None and args.end < 1:
        raise SystemExit("--end 须 >= 1")
    if (
        args.start is not None
        and args.end is not None
        and args.start > args.end
    ):
        raise SystemExit("--start 不能大于 --end")

    print(f"输入: {pdf_path}")
    convert(pdf_path, docx_path, start=args.start, end=args.end)


if __name__ == "__main__":
    main()
