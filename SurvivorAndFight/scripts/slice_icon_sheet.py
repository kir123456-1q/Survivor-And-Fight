#!/usr/bin/env python3
"""
按规则切分 icon 拼版图（默认 4x4）。

示例：
python scripts/slice_icon_sheet.py \
  --input assets/icon_sheets/wand_sheet_a.png \
  --output-dir assets/icons/wands \
  --names-file scripts/sheet_a_names.txt \
  --rows 4 --cols 4
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import List

from PIL import Image


def read_names(names_file: Path, expected: int) -> List[str]:
    lines = [x.strip() for x in names_file.read_text(encoding="utf-8").splitlines()]
    names = [x for x in lines if x and not x.startswith("#")]
    if len(names) != expected:
        raise ValueError(
            f"names 数量不匹配：期望 {expected}，实际 {len(names)}。"
        )
    return names


def main() -> None:
    parser = argparse.ArgumentParser(description="切分 icon 拼版图。")
    parser.add_argument("--input", required=True, help="输入拼版图路径")
    parser.add_argument("--output-dir", required=True, help="输出目录")
    parser.add_argument("--rows", type=int, default=4, help="行数，默认 4")
    parser.add_argument("--cols", type=int, default=4, help="列数，默认 4")
    parser.add_argument(
        "--names-file",
        required=True,
        help="名称清单文件（每行一个名称，对应从左到右、从上到下）",
    )
    parser.add_argument(
        "--prefix",
        default="",
        help="输出文件名前缀（可选），例如 wand_",
    )
    parser.add_argument(
        "--skip-reserved",
        action="store_true",
        help="跳过名称以 reserved_ 开头的格子",
    )
    args = parser.parse_args()

    input_path = Path(args.input)
    output_dir = Path(args.output_dir)
    names_file = Path(args.names_file)

    if not input_path.exists():
        raise FileNotFoundError(f"输入图片不存在：{input_path}")
    if not names_file.exists():
        raise FileNotFoundError(f"names 文件不存在：{names_file}")

    output_dir.mkdir(parents=True, exist_ok=True)

    image = Image.open(input_path).convert("RGBA")
    width, height = image.size

    if width % args.cols != 0 or height % args.rows != 0:
        raise ValueError(
            f"图片尺寸 {width}x{height} 不能被网格 {args.cols}x{args.rows} 整除。"
        )

    cell_w = width // args.cols
    cell_h = height // args.rows
    total = args.rows * args.cols
    names = read_names(names_file, total)

    for idx, name in enumerate(names):
        if args.skip_reserved and name.startswith("reserved_"):
            continue

        row = idx // args.cols
        col = idx % args.cols
        left = col * cell_w
        top = row * cell_h
        right = left + cell_w
        bottom = top + cell_h

        tile = image.crop((left, top, right, bottom))
        output_name = f"{args.prefix}{name}.png"
        tile.save(output_dir / output_name)

    print(
        f"切图完成：{input_path.name} -> {output_dir}，"
        f"网格 {args.rows}x{args.cols}，单格 {cell_w}x{cell_h}"
    )


if __name__ == "__main__":
    main()

