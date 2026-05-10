## Context
本变更横跨法杖构筑、配表加载、战斗表现与美术生产。系统必须提供稳定的数据契约，使程序可直接读表驱动玩法，使美术可按提示词批量出图并回填资源。

## Goals / Non-Goals
- Goals:
  - 建立三类魔杖统一数据模型，覆盖武器模板、效果定义、效果池、平衡参数。
  - 保证每个效果具备稀有度、数值字段、兼容标签、冲突字段、出现条件。
  - 交付可直接使用的 JSON 配表，不依赖二次补字段。
  - 定义 UI 面板与特效提示词产物标准，支撑切图与透明底导出。
- Non-Goals:
  - 本变更不实现运行时代码逻辑。
  - 本变更不替代战斗系统已有命中检测或弹道求解。
  - 本变更不引入新的资源加载器架构。

## Decisions
- Decision: 稀有度固定三档 `common`、`rare`、`epic`，法杖与效果均使用同一枚举。
  - Rationale: 三档与当前升级系统复杂度匹配，便于权重调参与可视化。
- Decision: 三类法杖统一使用字段集，差异通过 `category` 与数值参数表达。
  - Rationale: 统一 schema 可减少读取分支并降低跨表错误率。
- Decision: 效果表每行必须具备显式冲突与兼容字段。
  - Rationale: 明确冲突规则后，装配器可直接拒绝非法组合。
- Decision: 效果池以行级条件过滤（关卡、玩家等级、标签需求）实现出现门槛。
  - Rationale: 该方式可被纯 JSON 表达，且无需脚本扩展即可上线。
- Decision: 美术提示词文档按“图标 / 特效 / UI 面板”三层组织并统一透明底规则。
  - Rationale: 保障程序切图与资源命名可直接落地。

## Data Model
- `WandRow`:
  - `id`, `name`, `category`, `rarity`
  - `base_attack_speed`, `base_mana_cost`, `mana_cap_bonus`, `projectile_speed`
  - `effect_slot_count`, `default_tags`, `description`
- `WandEffectRow`:
  - `id`, `name`, `category`, `rarity`, `effect_type`
  - `damage_mul`, `attack_speed_mul`, `mana_cost_add`
  - `split_count`, `bounce_count`, `explosion_radius`, `orbit_radius`
  - `random_arc_deg`, `target_search_radius`, `duration_sec`, `dot_per_sec`
  - `compatible_tags`, `conflict_effect_ids`
- `WandEffectPoolRow`:
  - `id`, `category`, `rarity`, `weight`
  - `min_player_level`, `min_stage`
  - `requires_tags`, `excludes_tags`
- `WandBalanceRow`:
  - `id`, `category`, `rarity`
  - `mana_cap_base`, `mana_regen_per_sec`
  - `mana_cost_scale`, `attack_speed_min`, `attack_speed_max`

## Risks / Trade-offs
- 风险：效果数值跨度过大导致单一流派极端强势。  
  - Mitigation：`wand_balance_table.json` 固定攻速区间与耗蓝倍率，效果倍率限制在可控范围。
- 风险：随机弹道与分裂效果叠加造成性能波峰。  
  - Mitigation：在平衡表中设置 `projectile_budget` 与 `max_chain_triggers`，实现侧强制限流。
- 风险：美术出图风格不一致影响识别。  
  - Mitigation：提示词中必须包含同一批次光照、边框、透明背景与切图规则。

## Migration Plan
1. 注册新表 key 到 `tables.registry.json`。
2. 将四张 JSON 表纳入构建时复制路径。
3. 实现侧按 `category` 分发法杖行为，按 `effect_type` 执行效果。
4. 美术按提示词出图并映射至表内 `id`。
5. 验收以固定 seed 验证效果池抽取分布与冲突校验。

## Open Questions
- 无开放问题。本提案已冻结字段与约束，后续扩展必须通过新增 OpenSpec 变更处理。
