# 对外接口（契约）

本文件是三类魔杖系统的数据与接口权威定义。实现层必须与此一致。

## 稀有度与类别枚举

- `Rarity`: `common` | `rare` | `epic`
- `WandCategory`: `melee_orbit` | `ranged_shot` | `ranged_random`

## 数据行契约：`WandRow`

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 法杖主键，跨表唯一 |
| `name` | `string` | 法杖名称 |
| `category` | `WandCategory` | 法杖类别 |
| `rarity` | `Rarity` | 稀有度 |
| `base_attack_speed` | `number` | 基础攻速（次/秒） |
| `base_mana_cost` | `number` | 基础耗蓝 |
| `mana_cap_bonus` | `number` | 蓝量上限加成 |
| `projectile_speed` | `number` | 弹道速度或环绕角速度基准 |
| `effect_slot_count` | `number` | 效果槽数量 |
| `default_tags` | `string[]` | 默认标签 |
| `description` | `string` | 策划说明 |

## 数据行契约：`WandEffectRow`

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 效果主键 |
| `name` | `string` | 效果名称 |
| `category` | `WandCategory` | 适配类别 |
| `rarity` | `Rarity` | 稀有度 |
| `effect_type` | `string` | 行为类型，如 `split`、`explosion` |
| `damage_mul` | `number` | 伤害倍率 |
| `attack_speed_mul` | `number` | 攻速倍率 |
| `mana_cost_add` | `number` | 额外耗蓝 |
| `split_count` | `number` | 分裂数量 |
| `bounce_count` | `number` | 反弹次数 |
| `explosion_radius` | `number` | 爆炸半径 |
| `orbit_radius` | `number` | 环绕半径 |
| `random_arc_deg` | `number` | 随机弹道角度 |
| `target_search_radius` | `number` | 随机目标搜索半径 |
| `duration_sec` | `number` | 持续时长 |
| `dot_per_sec` | `number` | 每秒持续伤害 |
| `compatible_tags` | `string[]` | 兼容标签 |
| `conflict_effect_ids` | `string[]` | 冲突效果 id |

## 数据行契约：`WandEffectPoolRow`

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 池行主键 |
| `category` | `WandCategory` | 生效类别 |
| `rarity` | `Rarity` | 稀有度 |
| `weight` | `number` | 出现权重 |
| `min_player_level` | `number` | 最小玩家等级 |
| `min_stage` | `number` | 最小关卡阶段 |
| `requires_tags` | `string[]` | 必需标签 |
| `excludes_tags` | `string[]` | 排除标签 |

## 数据行契约：`WandBalanceRow`

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 平衡行主键 |
| `category` | `WandCategory` | 类别 |
| `rarity` | `Rarity` | 稀有度 |
| `mana_cap_base` | `number` | 基础蓝量上限 |
| `mana_regen_per_sec` | `number` | 回蓝速度 |
| `mana_cost_scale` | `number` | 耗蓝倍率 |
| `attack_speed_min` | `number` | 攻速下界 |
| `attack_speed_max` | `number` | 攻速上界 |
| `projectile_budget` | `number` | 单次施放投射体预算 |
| `max_chain_triggers` | `number` | 连锁触发上限 |

## 服务接口契约

- `rollWandEffects(category: WandCategory, playerLevel: number, stage: number, activeTags: string[]): WandEffectRow[]`
  - 必须按 `WandEffectPoolRow.weight` 加权抽样。
  - 必须执行 `requires_tags` 与 `excludes_tags` 过滤。
- `validateEffectLoadout(effectIds: string[]): { ok: true } | { ok: false, code: string, conflictPair: [string, string] }`
  - 必须校验 `conflict_effect_ids`。
- `resolveWandStats(wandId: string, effectIds: string[]): { attackSpeed: number, manaCost: number, damageMul: number }`
  - 必须叠加法杖基础值、效果加成与 `WandBalanceRow` 区间裁剪。

## 错误码约定

- `WAND_CFG_NOT_FOUND`
- `WAND_EFFECT_CONFLICT`
- `WAND_EFFECT_INCOMPATIBLE`
- `WAND_POOL_FILTER_EMPTY`
- `WAND_BALANCE_OUT_OF_RANGE`

错误码常量必须集中导出，禁止在业务文件硬编码字符串。
