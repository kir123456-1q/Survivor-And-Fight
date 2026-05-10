## ADDED Requirements

### Requirement: 三类魔杖模板覆盖
系统 MUST 提供三类魔杖模板：`melee_orbit`、`ranged_shot`、`ranged_random`。每类 SHALL 包含 5 根法杖，总数 SHALL 不少于 15 根；每根法杖 SHALL 声明攻速、耗蓝、蓝量上限加成、稀有度、效果槽位数。

#### Scenario: 法杖数量与类别校验
- **WHEN** 运行时加载 `wand_table.json`
- **THEN** 系统 SHALL 校验三类法杖均存在且每类数量为 5
- **AND** 任意法杖缺失基础字段时 MUST 返回 `WAND_CFG_NOT_FOUND`

### Requirement: 效果定义完整性
系统 MUST 提供至少 30 个效果定义，三类魔杖各 10 个。每个效果 MUST 包含 `rarity`、数值字段、`compatible_tags`、`conflict_effect_ids`，且 `effect_type` SHALL 指明行为类型。

#### Scenario: 效果字段完整
- **WHEN** 加载 `wand_effect_table.json` 任一行
- **THEN** 若 `compatible_tags` 或 `conflict_effect_ids` 缺失，系统 MUST 判定该行非法并拒绝载入

### Requirement: 冲突与兼容校验
装配系统 MUST 在效果装配前执行兼容与冲突检查。若任意效果对存在冲突，系统 SHALL 拒绝组合并返回 `WAND_EFFECT_CONFLICT`；若标签不兼容，系统 SHALL 返回 `WAND_EFFECT_INCOMPATIBLE`。

#### Scenario: 冲突效果拒绝
- **WHEN** 玩家同时装配存在于彼此 `conflict_effect_ids` 的两条效果
- **THEN** 验证接口 SHALL 返回 `ok: false` 且携带冲突对

### Requirement: 远程随机攻击行为参数
`ranged_random` 类效果 MUST 提供随机目标或随机弹道参数；`random_arc_deg`、`target_search_radius` 至少一项 SHALL 大于 0。

#### Scenario: 随机参数有效
- **WHEN** 加载 `ranged_random` 类效果
- **THEN** 系统 SHALL 拒绝 `random_arc_deg == 0` 且 `target_search_radius == 0` 的行

### Requirement: 稀有度驱动效果出现
效果生成流程 MUST 使用稀有度与权重控制出现概率，且不同类别 SHALL 独立抽样，不得跨类别污染。

#### Scenario: 类别隔离抽样
- **WHEN** 请求 `melee_orbit` 效果池抽样
- **THEN** 返回集合 MUST 全部来自 `melee_orbit` 类别
