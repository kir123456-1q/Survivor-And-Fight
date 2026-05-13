#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
按《docs/怪物与局内特效_生图提示词.md》约定切分三张图集（保留 PNG alpha）。

仓库内默认原图（顺序：怪物 → 特效 A → 特效 B）：
  assets/OrginImg/MonsterIconMap.png
  assets/OrginImg/EffectIconMap.png
  assets/OrginImg/EffectIconMap2.png

若原图像素尺寸与文档设计稿不一致，默认按「设计坐标 → 实际宽高」分别比例映射后裁切（与 4096×3072 等比例缩放等效）；
加 --strict-size 则要求尺寸完全一致。

依赖：pip install pillow

示例：
  python scripts/slice_monster_fx_atlases.py repo-all -o out/sliced
  python scripts/slice_monster_fx_atlases.py monster -o out/monster
  python scripts/slice_monster_fx_atlases.py monster -i monster_atlas.png -o out/monster
  python scripts/slice_monster_fx_atlases.py fx-a -o out/fx_a --naming ascii
  python scripts/slice_monster_fx_atlases.py all --monster m.png --fx-a a.png --fx-b b.png -o out
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path
from typing import List, Sequence, Tuple

from PIL import Image

# 脚本位于 SurvivorAndFight/scripts/，默认原图在同级项目的 assets/OrginImg/
_SURVIVOR_ROOT = Path(__file__).resolve().parent.parent
REPO_ORIGIN_IMG_DIR = _SURVIVOR_ROOT / "assets" / "OrginImg"
REPO_MONSTER_MAP = REPO_ORIGIN_IMG_DIR / "MonsterIconMap.png"
REPO_FX_A_MAP = REPO_ORIGIN_IMG_DIR / "EffectIconMap.png"
REPO_FX_B_MAP = REPO_ORIGIN_IMG_DIR / "EffectIconMap2.png"

# --- 期望画布尺寸（与文档一致）---
MONSTER_EXPECTED = (4096, 3072)
FX_A_EXPECTED = (4096, 2560)
FX_B_EXPECTED = (2048, 2048)


@dataclass(frozen=True)
class Slice:
    """矩形切片：左上角 (x,y)，宽 w 高 h，输出文件 stem（不含 .png）。"""

    x: int
    y: int
    w: int
    h: int
    stem: str


def _monster_slices() -> List[Slice]:
    """文档 1.2：怪物 4096×3072。"""
    return [
        # 第一行 A1–A8，512×512
        Slice(0, 0, 512, 512, "monster_M02"),
        Slice(512, 0, 512, 512, "monster_M04"),
        Slice(1024, 0, 512, 512, "monster_M06"),
        Slice(1536, 0, 512, 512, "monster_M07"),
        Slice(2048, 0, 512, 512, "monster_M03"),
        Slice(2560, 0, 512, 512, "monster_E03"),
        Slice(3072, 0, 512, 512, "monster_E05"),
        Slice(3584, 0, 512, 512, "monster_calib"),
        # 第二行 B1–B8，512×1024
        Slice(0, 512, 512, 1024, "monster_M01"),
        Slice(512, 512, 512, 1024, "monster_M05"),
        Slice(1024, 512, 512, 1024, "monster_M08"),
        Slice(1536, 512, 512, 1024, "monster_M09"),
        Slice(2048, 512, 512, 1024, "monster_E02"),
        Slice(2560, 512, 512, 1024, "monster_E01"),
        Slice(3072, 512, 512, 1024, "monster_B02"),
        Slice(3584, 512, 512, 1024, "monster_B03"),
        # 第三行 C1–C4，1024×1024
        Slice(0, 1536, 1024, 1024, "monster_B01"),
        Slice(1024, 1536, 1024, 1024, "monster_E04"),
        Slice(2048, 1536, 1024, 1024, "monster_C3_blank"),
        Slice(3072, 1536, 1024, 1024, "monster_C4_blank"),
        # 第四行 D1，4096×512
        Slice(0, 2560, 4096, 512, "monster_M10"),
    ]


def _fx_a_names_ascii() -> List[str]:
    """文档 2.2：从左到右、从上到下，与中文特效名一一对应（ASCII 文件名）。"""
    rows = [
        [
            "muzzle_spark",
            "thin_trail",
            "chain_beam_hit",
            "hit_flash_mask",
            "damage_beam",
            "atk_speed_aura",
            "weapon_enchant_glow",
            "fan_aim_fan",
        ],
        [
            "double_ghost_frame",
            "split_burst_on_hit",
            "bullet_spawn_ring",
            "orbit_trail",
            "spinning_wind_ring",
            "cut_spark",
            "melee_shockwave",
            "warn_ground_circle",
        ],
        [
            "small_starburst_hit",
            "burst_brightness_upsweep",
            "ghost_scale_frame",
            "execute_mark_skull",
            "kill_vertical_pillar",
            "charge_glow_dot",
            "split_prism_refraction",
            "explosion_warn_double_ring",
        ],
        [
            "core_fireball",
            "blast_smoke",
            "shockwave_rim",
            "chain_lightning_zigzag",
            "electrocute_spark",
            "ember_particles_stream",
            "ground_flame_cluster",
            "crosshair_jitter_particles",
        ],
        [
            "curved_trail_ballistic",
            "multi_segment_lock_line",
            "mirror_bounce_highlight",
            "polyline_trail_frame",
            "weak_spotlight_cone",
            "poison_ring_decal",
            "thunder_parry_pulse_ring",
            "spike_warn_line",
        ],
    ]
    out: List[str] = []
    for row in rows:
        out.extend(row)
    assert len(out) == 40
    return out


def _fx_a_names_zh() -> List[str]:
    """文档 2.2 表「特效名」列，用于 --naming chinese。"""
    rows = [
        ["枪口火花", "细弹道拖尾", "锁链光束命中", "受击闪白遮罩", "直接伤害光束", "攻速流光环身", "武器附魔光晕", "扇形瞄准线"],
        ["双发残影叠帧", "命中分裂爆发", "子弹生成环状冲击", "环绕轨迹带", "旋转风圈", "切割火花", "近身气浪", "警示地面圈"],
        ["小星爆命中", "爆发亮度上冲", "残影缩放帧", "处决标记骷髅裂纹", "击杀竖直光柱", "蓄力光点", "分裂棱镜折射", "爆炸预警圈"],
        ["爆心火球", "爆炸烟尘", "震荡波外缘", "连锁闪电折线", "触电闪光点", "持续余烬颗粒", "地面小火苗簇", "准星抖动粒子"],
        ["曲线拖尾弹道", "多段锁定线", "镜面反弹高光", "折线轨迹高亮帧", "弱聚光灯锥", "毒环地面贴花", "雷反脉冲环", "地刺预警线"],
    ]
    out: List[str] = []
    for row in rows:
        out.extend(row)
    assert len(out) == 40
    return out


def _fx_a_slices(naming: str) -> List[Slice]:
    cell = 512
    names = _fx_a_names_zh() if naming == "chinese" else _fx_a_names_ascii()
    slices: List[Slice] = []
    idx = 0
    for row in range(5):
        for col in range(8):
            x, y = col * cell, row * cell
            stem = names[idx]
            if naming == "chinese":
                stem = f"fx_{stem}"
            else:
                stem = f"fx_{stem}"
            slices.append(Slice(x, y, cell, cell, stem))
            idx += 1
    return slices


def _fx_b_slices() -> List[Slice]:
    """文档 2.4：四象限 1024×1024。"""
    return [
        Slice(0, 0, 1024, 1024, "fx_tile_poison"),
        Slice(1024, 0, 1024, 1024, "fx_tile_thundergrid"),
        Slice(0, 1024, 1024, 1024, "fx_shield_crack"),
        Slice(1024, 1024, 1024, 1024, "fx_void_rip"),
    ]


def _open_image(path: Path) -> Image.Image:
    if not path.is_file():
        raise FileNotFoundError(f"输入文件不存在：{path}")
    return Image.open(path).convert("RGBA")


def _scale_slices(slices: Sequence[Slice], sx: float, sy: float) -> List[Slice]:
    """将设计稿坐标系下的矩形缩放到实际像素（宽、高可不同缩放比）。"""
    out: List[Slice] = []
    for s in slices:
        out.append(
            Slice(
                int(round(s.x * sx)),
                int(round(s.y * sy)),
                max(1, int(round(s.w * sx))),
                max(1, int(round(s.h * sy))),
                s.stem,
            )
        )
    return out


def _prepare_slices(
    path: Path,
    expected: Tuple[int, int],
    slices_canonical: Sequence[Slice],
    strict: bool,
) -> Tuple[Image.Image, List[Slice]]:
    """
    按文档设计分辨率 expected 定义切片；若实际图尺寸不同，则按比例映射到像素（除非 strict）。
    """
    img = _open_image(path)
    aw, ah = img.size
    ew, eh = expected
    if (aw, ah) == (ew, eh):
        return img, list(slices_canonical)
    if strict:
        raise ValueError(
            f"{path.name} 尺寸为 {aw}×{ah}，文档约定应为 {ew}×{eh}。"
            f" 去掉 --strict-size 可按比例从设计坐标裁切。"
        )
    sx, sy = aw / ew, ah / eh
    scaled = _scale_slices(slices_canonical, sx, sy)
    return img, scaled


def _crop_save(img: Image.Image, s: Slice, out_dir: Path, dry_run: bool) -> Path:
    """PIL crop 使用 (left, upper, right, lower)，right/lower 为开区间外边界。"""
    w_img, h_img = img.size
    left = max(0, min(s.x, w_img - 1))
    top = max(0, min(s.y, h_img - 1))
    right = max(left + 1, min(s.x + s.w, w_img))
    bottom = max(top + 1, min(s.y + s.h, h_img))
    box = (left, top, right, bottom)
    out_path = out_dir / f"{s.stem}.png"
    if dry_run:
        return out_path
    tile = img.crop(box)
    out_dir.mkdir(parents=True, exist_ok=True)
    tile.save(out_path)
    return out_path


def _run_slices(
    img: Image.Image,
    slices: Sequence[Slice],
    out_dir: Path,
    dry_run: bool,
) -> List[Path]:
    paths: List[Path] = []
    for s in slices:
        paths.append(_crop_save(img, s, out_dir, dry_run))
    return paths


def _resolve_input(explicit: str | None, default: Path) -> Path:
    if explicit:
        return Path(explicit)
    return default


def cmd_monster(args: argparse.Namespace) -> None:
    p = _resolve_input(args.input, REPO_MONSTER_MAP)
    out = Path(args.output)
    img, slices = _prepare_slices(p, MONSTER_EXPECTED, _monster_slices(), args.strict_size)
    _run_slices(img, slices, out, args.dry_run)
    _print_done("monster", p, out, len(slices), args.dry_run)


def cmd_fx_a(args: argparse.Namespace) -> None:
    p = _resolve_input(args.input, REPO_FX_A_MAP)
    out = Path(args.output)
    img, slices = _prepare_slices(p, FX_A_EXPECTED, _fx_a_slices(args.naming), args.strict_size)
    _run_slices(img, slices, out, args.dry_run)
    _print_done("fx-a", p, out, len(slices), args.dry_run)


def cmd_fx_b(args: argparse.Namespace) -> None:
    p = _resolve_input(args.input, REPO_FX_B_MAP)
    out = Path(args.output)
    img, slices = _prepare_slices(p, FX_B_EXPECTED, _fx_b_slices(), args.strict_size)
    _run_slices(img, slices, out, args.dry_run)
    _print_done("fx-b", p, out, len(slices), args.dry_run)


def cmd_all(args: argparse.Namespace) -> None:
    base = Path(args.output)
    origin = Path(args.origin_dir) if getattr(args, "origin_dir", None) else REPO_ORIGIN_IMG_DIR
    monster_in = args.monster or str(origin / "MonsterIconMap.png")
    fxa_in = args.fx_a or str(origin / "EffectIconMap.png")
    fxb_in = args.fx_b or str(origin / "EffectIconMap2.png")
    if not Path(monster_in).is_file() or not Path(fxa_in).is_file() or not Path(fxb_in).is_file():
        raise SystemExit(
            "未找到全部三张原图，请检查路径：\n"
            f"  怪物: {monster_in}\n"
            f"  特效A: {fxa_in}\n"
            f"  特效B: {fxb_in}"
        )
    ns_m = argparse.Namespace(
        input=monster_in,
        output=str(base / "monster"),
        dry_run=args.dry_run,
        strict_size=args.strict_size,
    )
    ns_a = argparse.Namespace(
        input=fxa_in,
        output=str(base / "fx_a"),
        naming=args.naming,
        dry_run=args.dry_run,
        strict_size=args.strict_size,
    )
    ns_b = argparse.Namespace(
        input=fxb_in,
        output=str(base / "fx_b"),
        dry_run=args.dry_run,
        strict_size=args.strict_size,
    )
    cmd_monster(ns_m)
    cmd_fx_a(ns_a)
    cmd_fx_b(ns_b)


def cmd_repo_all(args: argparse.Namespace) -> None:
    """顺序：MonsterIconMap → EffectIconMap → EffectIconMap2。"""
    ns = argparse.Namespace(
        output=args.output,
        monster=None,
        fx_a=None,
        fx_b=None,
        origin_dir=args.origin_dir,
        naming=args.naming,
        dry_run=args.dry_run,
        strict_size=args.strict_size,
    )
    cmd_all(ns)


def _print_done(kind: str, src: Path, out: Path, n: int, dry: bool) -> None:
    verb = "将写出" if dry else "已写出"
    print(f"[{kind}] {verb} {n} 张 -> {out}（源 {src}）")


def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="切分怪物 / 局内特效 A / 局内特效 B 三张图集（见 docs/怪物与局内特效_生图提示词.md）。"
    )
    sub = p.add_subparsers(dest="command", required=True)

    def add_strict(sp: argparse.ArgumentParser) -> None:
        sp.add_argument(
            "--strict-size",
            action="store_true",
            help="强制原图尺寸与文档设计分辨率一致；默认按宽高比例映射设计坐标到当前像素",
        )

    def add_in_out(sp: argparse.ArgumentParser) -> None:
        sp.add_argument(
            "-i",
            "--input",
            required=False,
            default=None,
            help="输入整张 PNG；省略则使用 assets/OrginImg 下对应默认文件名",
        )
        sp.add_argument("-o", "--output", required=True, help="输出目录")

    sp_m = sub.add_parser("monster", help="怪物图集 4096×3072（默认输入 MonsterIconMap.png）")
    add_in_out(sp_m)
    add_strict(sp_m)
    sp_m.add_argument("--dry-run", action="store_true", help="只校验尺寸并打印数量，不写文件")
    sp_m.set_defaults(func=cmd_monster)

    sp_a = sub.add_parser(
        "fx-a",
        help="局内特效图集 A 4096×2560，8×5 格各 512×512（默认输入 EffectIconMap.png）",
    )
    add_in_out(sp_a)
    add_strict(sp_a)
    sp_a.add_argument(
        "--naming",
        choices=("ascii", "chinese"),
        default="ascii",
        help="输出文件名：ascii 为英文蛇形；chinese 为 fx_+ 文档表中文名",
    )
    sp_a.add_argument("--dry-run", action="store_true")
    sp_a.set_defaults(func=cmd_fx_a)

    sp_b = sub.add_parser(
        "fx-b",
        help="局内特效图集 B 2048×2048，四象限各 1024×1024（默认输入 EffectIconMap2.png）",
    )
    add_in_out(sp_b)
    add_strict(sp_b)
    sp_b.add_argument("--dry-run", action="store_true")
    sp_b.set_defaults(func=cmd_fx_b)

    sp_all = sub.add_parser(
        "all",
        help="一次切三张；省略各路径时从 --origin-dir 按顺序读 MonsterIconMap / EffectIconMap / EffectIconMap2",
    )
    sp_all.add_argument("-o", "--output", required=True, help="输出根目录")
    sp_all.add_argument(
        "--origin-dir",
        default=str(REPO_ORIGIN_IMG_DIR),
        help=f"默认三张原图所在目录（默认：{REPO_ORIGIN_IMG_DIR}）",
    )
    sp_all.add_argument(
        "--monster",
        default=None,
        help="怪物图集 PNG；省略则用 origin-dir/MonsterIconMap.png",
    )
    sp_all.add_argument(
        "--fx-a",
        default=None,
        help="特效 A PNG；省略则用 origin-dir/EffectIconMap.png",
    )
    sp_all.add_argument(
        "--fx-b",
        default=None,
        help="特效 B PNG；省略则用 origin-dir/EffectIconMap2.png",
    )
    sp_all.add_argument("--naming", choices=("ascii", "chinese"), default="ascii")
    sp_all.add_argument("--dry-run", action="store_true")
    add_strict(sp_all)
    sp_all.set_defaults(func=cmd_all)

    sp_repo = sub.add_parser(
        "repo-all",
        help="等同 all + 默认 origin-dir：顺序 MonsterIconMap.png → EffectIconMap.png → EffectIconMap2.png",
    )
    sp_repo.add_argument("-o", "--output", required=True, help="输出根目录")
    sp_repo.add_argument(
        "--origin-dir",
        default=str(REPO_ORIGIN_IMG_DIR),
        help=f"原图目录（默认：{REPO_ORIGIN_IMG_DIR}）",
    )
    sp_repo.add_argument("--naming", choices=("ascii", "chinese"), default="ascii")
    sp_repo.add_argument("--dry-run", action="store_true")
    add_strict(sp_repo)
    sp_repo.set_defaults(func=cmd_repo_all)

    return p


def main() -> None:
    parser = _build_parser()
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
