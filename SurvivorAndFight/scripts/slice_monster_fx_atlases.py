#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
按《docs/怪物与局内特效_生图提示词.md》约定切分三张图集（保留 PNG alpha）。

默认（非 --strict-size 且非 --legacy-grid）在**实际像素尺寸**上：
  - 怪物图：四行布局（第 1、2 行各 8 格；第 3 行 4 格含空白占位；第 4 行整宽一格），
    在行间、列间**透明带（alpha 低）**附近搜索切割线，避免切穿主体。
  - EffectIconMap / EffectIconMap2：在均匀网格的**理论接缝**附近搜索，使接缝落在
    **垂直/水平窄带内 alpha 能量最小**处（尽量不落在不透明像素上）。

可选 --legacy-grid：仍按设计稿坐标比例映射切分（不做接缝搜索）。

仓库默认原图：assets/OrginImg/MonsterIconMap.png、EffectIconMap.png、EffectIconMap2.png

依赖：pip install pillow numpy

示例：
  python scripts/slice_monster_fx_atlases.py repo-all -o out/sliced
  python scripts/slice_monster_fx_atlases.py repo-all -o out --seam-search-pct 0.2
  python scripts/slice_monster_fx_atlases.py monster -o out/monster --legacy-grid
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path
from typing import List, Sequence, Tuple

import numpy as np
from PIL import Image

# 脚本位于 SurvivorAndFight/scripts/
_SURVIVOR_ROOT = Path(__file__).resolve().parent.parent
REPO_ORIGIN_IMG_DIR = _SURVIVOR_ROOT / "assets" / "OrginImg"
REPO_MONSTER_MAP = REPO_ORIGIN_IMG_DIR / "MonsterIconMap.png"
REPO_FX_A_MAP = REPO_ORIGIN_IMG_DIR / "EffectIconMap.png"
REPO_FX_B_MAP = REPO_ORIGIN_IMG_DIR / "EffectIconMap2.png"

# --- 设计稿参考尺寸（仅 legacy / strict 用）---
MONSTER_EXPECTED = (4096, 3072)
FX_A_EXPECTED = (4096, 2560)
FX_B_EXPECTED = (2048, 2048)

# 怪物图设计稿行高比例（文档 512 : 1024 : 1024 : 512）
_MONSTER_ROW_FRAC = (512 / 3072, 1024 / 3072, 1024 / 3072, 512 / 3072)


@dataclass(frozen=True)
class Slice:
    x: int
    y: int
    w: int
    h: int
    stem: str


def _open_image(path: Path) -> Image.Image:
    if not path.is_file():
        raise FileNotFoundError(f"输入文件不存在：{path}")
    return Image.open(path).convert("RGBA")


def _rgba_u8(img: Image.Image) -> np.ndarray:
    return np.asarray(img, dtype=np.uint8)


def _vertical_strip_cost(rgba: np.ndarray, x: int, strip_half: int) -> float:
    """
    竖缝代价：主项为加权 alpha 之和；在近似透明像素上增加 RGB 分散度惩罚，
    便于在「透明底 + 纯色细线边界」时仍对齐到线/低纹理带。
    """
    h, w, _ = rgba.shape
    x0 = max(0, x - strip_half)
    x1 = min(w, x + strip_half + 1)
    if x0 >= x1:
        return 1e18
    band = rgba[:, x0:x1]
    a = band[..., 3].astype(np.float64)
    alpha_term = float(np.maximum(0, a - 8).sum())
    mask = a < 24
    if not np.any(mask):
        return alpha_term + 800.0
    rgb = band[:, :, :3][mask].astype(np.float64)
    rgb_std = float(rgb.std(axis=0).mean()) if rgb.size else 0.0
    return alpha_term + 0.4 * rgb_std


def _horizontal_strip_cost(rgba: np.ndarray, y: int, strip_half: int) -> float:
    h, w, _ = rgba.shape
    y0 = max(0, y - strip_half)
    y1 = min(h, y + strip_half + 1)
    if y0 >= y1:
        return 1e18
    band = rgba[y0:y1, :, :]
    a = band[..., 3].astype(np.float64)
    alpha_term = float(np.maximum(0, a - 8).sum())
    mask = a < 24
    if not np.any(mask):
        return alpha_term + 800.0
    rgb = band[:, :, :3][mask].astype(np.float64)
    rgb_std = float(rgb.std(axis=0).mean()) if rgb.size else 0.0
    return alpha_term + 0.4 * rgb_std


def _refine_vertical_seams(
    rgba: np.ndarray,
    n_cols: int,
    search_px: int,
    strip_half: int,
    min_cell: int = 8,
) -> List[int]:
    """返回 x 边界 [0, x1, ..., W]，长度 n_cols+1。"""
    _h, w, _ = rgba.shape
    boundaries = [0]
    cell = w / n_cols
    for i in range(1, n_cols):
        nominal = int(round(i * cell))
        lo = max(boundaries[-1] + min_cell, nominal - search_px)
        hi = min(w - min_cell * (n_cols - i), nominal + search_px)
        if lo >= hi:
            x_best = nominal
        else:
            costs = [(x, _vertical_strip_cost(rgba, x, strip_half)) for x in range(lo, hi + 1)]
            x_best = min(costs, key=lambda t: t[1])[0]
        boundaries.append(x_best)
    boundaries.append(w)
    return boundaries


def _refine_horizontal_seams(
    rgba: np.ndarray,
    n_rows: int,
    search_px: int,
    strip_half: int,
    min_cell: int = 8,
) -> List[int]:
    h, _w, _ = rgba.shape
    boundaries = [0]
    cell = h / n_rows
    for i in range(1, n_rows):
        nominal = int(round(i * cell))
        lo = max(boundaries[-1] + min_cell, nominal - search_px)
        hi = min(h - min_cell * (n_rows - i), nominal + search_px)
        if lo >= hi:
            y_best = nominal
        else:
            costs = [(y, _horizontal_strip_cost(rgba, y, strip_half)) for y in range(lo, hi + 1)]
            y_best = min(costs, key=lambda t: t[1])[0]
        boundaries.append(y_best)
    boundaries.append(h)
    return boundaries


def _refine_horizontal_seams_guided(
    rgba: np.ndarray,
    nominal_boundaries: Sequence[int],
    search_px: int,
    strip_half: int,
    min_cell: int = 6,
) -> List[int]:
    """在 nominal_boundaries 附近（±search_px）细化水平线，首末固定为 0 与 H。"""
    h, _w, _ = rgba.shape
    out = [0]
    for i in range(1, len(nominal_boundaries) - 1):
        nominal = int(np.clip(nominal_boundaries[i], 0, h))
        lo = max(out[-1] + min_cell, nominal - search_px)
        hi = min(h - min_cell * (len(nominal_boundaries) - 1 - i), nominal + search_px)
        if lo >= hi:
            y_best = nominal
        else:
            costs = [(y, _horizontal_strip_cost(rgba, y, strip_half)) for y in range(lo, hi + 1)]
            y_best = min(costs, key=lambda t: t[1])[0]
        out.append(y_best)
    out.append(h)
    return out


def _monster_slices() -> List[Slice]:
    """文档坐标 + stem（仅 legacy 用）。"""
    return [
        Slice(0, 0, 512, 512, "monster_M02"),
        Slice(512, 0, 512, 512, "monster_M04"),
        Slice(1024, 0, 512, 512, "monster_M06"),
        Slice(1536, 0, 512, 512, "monster_M07"),
        Slice(2048, 0, 512, 512, "monster_M03"),
        Slice(2560, 0, 512, 512, "monster_E03"),
        Slice(3072, 0, 512, 512, "monster_E05"),
        Slice(3584, 0, 512, 512, "monster_calib"),
        Slice(0, 512, 512, 1024, "monster_M01"),
        Slice(512, 512, 512, 1024, "monster_M05"),
        Slice(1024, 512, 512, 1024, "monster_M08"),
        Slice(1536, 512, 512, 1024, "monster_M09"),
        Slice(2048, 512, 512, 1024, "monster_E02"),
        Slice(2560, 512, 512, 1024, "monster_E01"),
        Slice(3072, 512, 512, 1024, "monster_B02"),
        Slice(3584, 512, 512, 1024, "monster_B03"),
        Slice(0, 1536, 1024, 1024, "monster_B01"),
        Slice(1024, 1536, 1024, 1024, "monster_E04"),
        Slice(2048, 1536, 1024, 1024, "monster_C3_blank"),
        Slice(3072, 1536, 1024, 1024, "monster_C4_blank"),
        Slice(0, 2560, 4096, 512, "monster_M10"),
    ]


def _monster_smart_slices(
    img: Image.Image,
    search_pct: float,
    strip_half: int,
) -> List[Slice]:
    """
    怪物拼图：行 1/2 各 8 列；行 3 为 4 列（两格内容 + 空白占位）；行 4 单行整宽。
    行间、列间接缝在透明带附近搜索。
    """
    rgba = _rgba_u8(img)
    H, W = rgba.shape[:2]
    search_h = max(6, int(H * search_pct * 0.25))
    search_w8 = max(6, int((W / 8) * search_pct))
    search_w4 = max(6, int((W / 4) * search_pct))

    # 水平四带：按设计比例得 nominal 行界，再在 ±search 内压 alpha
    y_nom = [0]
    acc = 0.0
    for fr in _MONSTER_ROW_FRAC:
        acc += fr
        y_nom.append(int(round(acc * H)))
    y_bounds = _refine_horizontal_seams_guided(rgba, y_nom, search_h, strip_half)

    y0, y1, y2, y3, y4 = y_bounds[0], y_bounds[1], y_bounds[2], y_bounds[3], y_bounds[4]
    slices: List[Slice] = []

    # 行 1：8 格（短带）
    band1 = rgba[y0:y1, :, :]
    xs1 = _refine_vertical_seams(band1, 8, search_w8, strip_half)
    stems_r1 = [
        "monster_M02",
        "monster_M04",
        "monster_M06",
        "monster_M07",
        "monster_M03",
        "monster_E03",
        "monster_E05",
        "monster_calib",
    ]
    for c in range(8):
        slices.append(
            Slice(xs1[c], y0, xs1[c + 1] - xs1[c], y1 - y0, stems_r1[c])
        )

    # 行 2：8 格（高带）
    band2 = rgba[y1:y2, :, :]
    xs2 = _refine_vertical_seams(band2, 8, search_w8, strip_half)
    stems_r2 = [
        "monster_M01",
        "monster_M05",
        "monster_M08",
        "monster_M09",
        "monster_E02",
        "monster_E01",
        "monster_B02",
        "monster_B03",
    ]
    for c in range(8):
        slices.append(
            Slice(xs2[c], y1, xs2[c + 1] - xs2[c], y2 - y1, stems_r2[c])
        )

    # 行 3：4 列（两内容 + 两空白占位）
    band3 = rgba[y2:y3, :, :]
    xs3 = _refine_vertical_seams(band3, 4, search_w4, strip_half)
    stems_r3 = ["monster_B01", "monster_E04", "monster_C3_blank", "monster_C4_blank"]
    for c in range(4):
        slices.append(
            Slice(xs3[c], y2, xs3[c + 1] - xs3[c], y3 - y2, stems_r3[c])
        )

    # 行 4：整宽一条
    slices.append(Slice(0, y3, W, y4 - y3, "monster_M10"))

    return slices


def _fx_a_names_ascii() -> List[str]:
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


def _fx_a_smart_slices(
    img: Image.Image,
    naming: str,
    search_pct: float,
    strip_half: int,
) -> List[Slice]:
    """8×5 格：先定水平带再定竖条，接缝均在各自 band 内最小 alpha 穿透。"""
    rgba = _rgba_u8(img)
    H, W = rgba.shape[:2]
    search_h = max(6, int((H / 5) * search_pct))
    search_w = max(6, int((W / 8) * search_pct))

    y_bounds = _refine_horizontal_seams(rgba, 5, search_h, strip_half)
    names = _fx_a_names_zh() if naming == "chinese" else _fx_a_names_ascii()
    slices: List[Slice] = []
    idx = 0
    for r in range(5):
        y0, y1 = y_bounds[r], y_bounds[r + 1]
        band = rgba[y0:y1, :, :]
        xs = _refine_vertical_seams(band, 8, search_w, strip_half)
        for c in range(8):
            stem = names[idx]
            stem = f"fx_{stem}"
            slices.append(
                Slice(xs[c], y0, xs[c + 1] - xs[c], y1 - y0, stem)
            )
            idx += 1
    return slices


def _fx_b_stems() -> List[str]:
    return ["fx_tile_poison", "fx_tile_thundergrid", "fx_shield_crack", "fx_void_rip"]


def _fx_b_smart_slices(
    img: Image.Image,
    search_pct: float,
    strip_half: int,
) -> List[Slice]:
    """2×2：在中间附近找一条竖缝、一条横缝（全图 alpha 最小穿透）。"""
    rgba = _rgba_u8(img)
    H, W = rgba.shape[:2]
    search_x = max(8, int((W / 2) * search_pct))
    search_y = max(8, int((H / 2) * search_pct))
    mid_x = W // 2
    mid_y = H // 2
    lo_x, hi_x = max(4, mid_x - search_x), min(W - 4, mid_x + search_x)
    x_split = min(range(lo_x, hi_x + 1), key=lambda x: _vertical_strip_cost(rgba, x, strip_half))
    lo_y, hi_y = max(4, mid_y - search_y), min(H - 4, mid_y + search_y)
    y_split = min(range(lo_y, hi_y + 1), key=lambda y: _horizontal_strip_cost(rgba, y, strip_half))

    stems = _fx_b_stems()
    quads = [
        (0, 0, x_split, y_split),
        (x_split, 0, W - x_split, y_split),
        (0, y_split, x_split, H - y_split),
        (x_split, y_split, W - x_split, H - y_split),
    ]
    slices: List[Slice] = []
    for i, (x, y, w, h) in enumerate(quads):
        slices.append(Slice(x, y, max(1, w), max(1, h), stems[i]))
    return slices


def _scale_slices(slices: Sequence[Slice], sx: float, sy: float) -> List[Slice]:
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


def _prepare_slices_legacy(
    path: Path,
    expected: Tuple[int, int],
    slices_canonical: Sequence[Slice],
    strict: bool,
) -> Tuple[Image.Image, List[Slice]]:
    img = _open_image(path)
    aw, ah = img.size
    ew, eh = expected
    if (aw, ah) == (ew, eh):
        return img, list(slices_canonical)
    if strict:
        raise ValueError(
            f"{path.name} 尺寸为 {aw}×{ah}，文档约定应为 {ew}×{eh}。"
            f" 去掉 --strict-size 可按比例从设计坐标裁切，或使用默认智能接缝。"
        )
    sx, sy = aw / ew, ah / eh
    return img, _scale_slices(slices_canonical, sx, sy)


def _fx_a_slices_canonical(naming: str) -> List[Slice]:
    cell = 512
    names = _fx_a_names_zh() if naming == "chinese" else _fx_a_names_ascii()
    slices: List[Slice] = []
    idx = 0
    for row in range(5):
        for col in range(8):
            x, y = col * cell, row * cell
            stem = f"fx_{names[idx]}"
            slices.append(Slice(x, y, cell, cell, stem))
            idx += 1
    return slices


def _fx_b_slices_canonical() -> List[Slice]:
    return [
        Slice(0, 0, 1024, 1024, "fx_tile_poison"),
        Slice(1024, 0, 1024, 1024, "fx_tile_thundergrid"),
        Slice(0, 1024, 1024, 1024, "fx_shield_crack"),
        Slice(1024, 1024, 1024, 1024, "fx_void_rip"),
    ]


def _crop_save(img: Image.Image, s: Slice, out_dir: Path, dry_run: bool) -> Path:
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
    if args.strict_size or args.legacy_grid:
        img, slices = _prepare_slices_legacy(
            p, MONSTER_EXPECTED, _monster_slices(), args.strict_size
        )
    else:
        img = _open_image(p)
        slices = _monster_smart_slices(img, args.seam_search_pct, args.seam_strip)
    _run_slices(img, slices, out, args.dry_run)
    _print_done("monster", p, out, len(slices), args.dry_run)


def cmd_fx_a(args: argparse.Namespace) -> None:
    p = _resolve_input(args.input, REPO_FX_A_MAP)
    out = Path(args.output)
    if args.strict_size or args.legacy_grid:
        img, slices = _prepare_slices_legacy(
            p, FX_A_EXPECTED, _fx_a_slices_canonical(args.naming), args.strict_size
        )
    else:
        img = _open_image(p)
        slices = _fx_a_smart_slices(img, args.naming, args.seam_search_pct, args.seam_strip)
    _run_slices(img, slices, out, args.dry_run)
    _print_done("fx-a", p, out, len(slices), args.dry_run)


def cmd_fx_b(args: argparse.Namespace) -> None:
    p = _resolve_input(args.input, REPO_FX_B_MAP)
    out = Path(args.output)
    if args.strict_size or args.legacy_grid:
        img, slices = _prepare_slices_legacy(
            p, FX_B_EXPECTED, _fx_b_slices_canonical(), args.strict_size
        )
    else:
        img = _open_image(p)
        slices = _fx_b_smart_slices(img, args.seam_search_pct, args.seam_strip)
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
    common = dict(
        dry_run=args.dry_run,
        strict_size=args.strict_size,
        legacy_grid=args.legacy_grid,
        seam_search_pct=args.seam_search_pct,
        seam_strip=args.seam_strip,
    )
    cmd_monster(
        argparse.Namespace(
            input=monster_in,
            output=str(base / "monster"),
            **common,
        )
    )
    cmd_fx_a(
        argparse.Namespace(
            input=fxa_in,
            output=str(base / "fx_a"),
            naming=args.naming,
            **common,
        )
    )
    cmd_fx_b(
        argparse.Namespace(
            input=fxb_in,
            output=str(base / "fx_b"),
            **common,
        )
    )


def cmd_repo_all(args: argparse.Namespace) -> None:
    ns = argparse.Namespace(
        output=args.output,
        monster=None,
        fx_a=None,
        fx_b=None,
        origin_dir=args.origin_dir,
        naming=args.naming,
        dry_run=args.dry_run,
        strict_size=args.strict_size,
        legacy_grid=args.legacy_grid,
        seam_search_pct=args.seam_search_pct,
        seam_strip=args.seam_strip,
    )
    cmd_all(ns)


def _print_done(kind: str, src: Path, out: Path, n: int, dry: bool) -> None:
    verb = "将写出" if dry else "已写出"
    print(f"[{kind}] {verb} {n} 张 -> {out}（源 {src}）")


def _add_seam_and_legacy(sp: argparse.ArgumentParser) -> None:
    sp.add_argument(
        "--legacy-grid",
        action="store_true",
        help="按设计稿坐标比例切分，不做透明缝搜索",
    )
    sp.add_argument(
        "--seam-search-pct",
        type=float,
        default=0.18,
        metavar="PCT",
        help="接缝相对「单格尺寸」的搜索半径比例，默认 0.18（约 ±18%% 格宽/格高）",
    )
    sp.add_argument(
        "--seam-strip",
        type=int,
        default=3,
        metavar="PX",
        help="接缝检测带半宽（像素），整带为 2*半宽+1；默认 3",
    )


def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="切分怪物 / 局内特效图集；默认按 alpha 低值带对齐接缝（见 --legacy-grid）。"
    )
    sub = p.add_subparsers(dest="command", required=True)

    def add_strict(sp: argparse.ArgumentParser) -> None:
        sp.add_argument(
            "--strict-size",
            action="store_true",
            help="强制原图尺寸与文档设计分辨率一致并按设计像素切分",
        )

    def add_in_out(sp: argparse.ArgumentParser) -> None:
        sp.add_argument(
            "-i",
            "--input",
            required=False,
            default=None,
            help="输入整张 PNG；省略则使用 assets/OrginImg 下默认文件名",
        )
        sp.add_argument("-o", "--output", required=True, help="输出目录")

    sp_m = sub.add_parser("monster", help="怪物拼图：智能接缝（默认）或 --legacy-grid")
    add_in_out(sp_m)
    add_strict(sp_m)
    _add_seam_and_legacy(sp_m)
    sp_m.add_argument("--dry-run", action="store_true")
    sp_m.set_defaults(func=cmd_monster)

    sp_a = sub.add_parser("fx-a", help="EffectIconMap：8×5 智能接缝（默认）")
    add_in_out(sp_a)
    add_strict(sp_a)
    _add_seam_and_legacy(sp_a)
    sp_a.add_argument(
        "--naming",
        choices=("ascii", "chinese"),
        default="ascii",
        help="ascii：英文 stem；chinese：fx_+ 中文名",
    )
    sp_a.add_argument("--dry-run", action="store_true")
    sp_a.set_defaults(func=cmd_fx_a)

    sp_b = sub.add_parser("fx-b", help="EffectIconMap2：2×2 智能接缝（默认）")
    add_in_out(sp_b)
    add_strict(sp_b)
    _add_seam_and_legacy(sp_b)
    sp_b.add_argument("--dry-run", action="store_true")
    sp_b.set_defaults(func=cmd_fx_b)

    sp_all = sub.add_parser("all", help="一次切三张")
    sp_all.add_argument("-o", "--output", required=True, help="输出根目录")
    sp_all.add_argument("--origin-dir", default=str(REPO_ORIGIN_IMG_DIR))
    sp_all.add_argument("--monster", default=None)
    sp_all.add_argument("--fx-a", default=None)
    sp_all.add_argument("--fx-b", default=None)
    sp_all.add_argument("--naming", choices=("ascii", "chinese"), default="ascii")
    sp_all.add_argument("--dry-run", action="store_true")
    add_strict(sp_all)
    _add_seam_and_legacy(sp_all)
    sp_all.set_defaults(func=cmd_all)

    sp_repo = sub.add_parser("repo-all", help="默认 OrginImg 三张顺序切分")
    sp_repo.add_argument("-o", "--output", required=True)
    sp_repo.add_argument("--origin-dir", default=str(REPO_ORIGIN_IMG_DIR))
    sp_repo.add_argument("--naming", choices=("ascii", "chinese"), default="ascii")
    sp_repo.add_argument("--dry-run", action="store_true")
    add_strict(sp_repo)
    _add_seam_and_legacy(sp_repo)
    sp_repo.set_defaults(func=cmd_repo_all)

    return p


def main() -> None:
    parser = _build_parser()
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
