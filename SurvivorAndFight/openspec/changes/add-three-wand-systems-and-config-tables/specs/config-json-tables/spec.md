## ADDED Requirements

### Requirement: 魔杖系统四表注册
系统 MUST 在 `tables.registry.json` 中注册 `Wand`、`WandEffect`、`WandEffectPool`、`WandBalance` 四个逻辑 key，并为每个 key 提供唯一 `sources` 与 `idKey`。

#### Scenario: 注册项完整
- **WHEN** 运行时加载表注册文件
- **THEN** 四个 key SHALL 全部存在且来源文件路径有效

### Requirement: 法杖表 schema 固化
`wand_table.json` 每行 MUST 使用 `WandRow` 字段集，且 `id` 在全表唯一；`category` 与 `rarity` MUST 属于契约枚举。

#### Scenario: 法杖字段校验
- **WHEN** 某行 `category` 不在枚举内
- **THEN** 加载流程 MUST 失败并输出结构化错误

### Requirement: 效果表 schema 固化
`wand_effect_table.json` 每行 MUST 使用 `WandEffectRow` 字段集。数值字段 SHALL 全量存在，未使用字段 MUST 显式填 `0`，禁止缺字段。

#### Scenario: 数值字段齐全
- **WHEN** 读取任意效果行
- **THEN** 系统 SHALL 读取到全部数值字段且类型为 JSON number

### Requirement: 效果池条件字段
`wand_effect_pool_table.json` MUST 包含权重与出现条件字段：`weight`、`min_player_level`、`min_stage`、`requires_tags`、`excludes_tags`。

#### Scenario: 门槛过滤
- **WHEN** 玩家等级低于 `min_player_level`
- **THEN** 该池行 MUST 不参与抽样

### Requirement: 平衡表约束
`wand_balance_table.json` MUST 覆盖每个类别与稀有度组合，提供蓝量、回蓝、耗蓝倍率、攻速区间与预算约束。

#### Scenario: 区间裁剪
- **WHEN** 装配求值得到攻速超出平衡区间
- **THEN** 运行时 MUST 按 `attack_speed_min/max` 裁剪最终结果
