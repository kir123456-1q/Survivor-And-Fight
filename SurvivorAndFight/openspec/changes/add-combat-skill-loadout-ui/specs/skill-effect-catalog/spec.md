## ADDED Requirements

### Requirement: Skill 图标目录全量配表

系统 SHALL 为 `assets/atlas/Skillicon` 下每一张 PNG 提供 `skill_table` 数据行，主键 `id` SHALL 与文件名（不含扩展名）一致。

#### Scenario: 十三技能全覆盖

- **WHEN** 枚举 `assets/atlas/Skillicon/*.png`
- **THEN** `Data.Skill.GetByID(id)` 对每个文件名必须返回非空行
- **AND** 行必须包含 `iconPath`、`name`、`cooldownSec`、`effectIds`

#### Scenario: 默认装备技能

- **WHEN** 战斗开始且玩家尚未手动装配
- **THEN** 必须存在至少 3 行 `defaultEquipped: true` 的技能
- **AND** 这三行必须写入 `SkillLoadoutState.equippedSkillIds`

### Requirement: Effect 图标目录全量配表

系统 SHALL 为 `assets/atlas/EffectIcon` 下每一张 PNG 提供 `skill_effect_table` 数据行，主键 `id` SHALL 与文件名（不含扩展名）一致。

#### Scenario: 七十四 Effect 全覆盖

- **WHEN** 枚举 `assets/atlas/EffectIcon/*.png`（共 74 张）
- **THEN** `Data.SkillEffect.GetByID(id)` 对每个文件名必须返回非空行
- **AND** 行必须包含 `iconPath`、`name`、`effect`、`target`

#### Scenario: 战斗可释放子集

- **WHEN** Effect 行 `enabled` 为 `true` 且 `effect` 为 `bullet`
- **THEN** 行必须包含有效 `bulletSlot`，且对应 `bullet_table` 行必须存在
- **WHEN** Effect 行 `enabled` 为 `false`
- **THEN** 该 Effect 仅允许在 UI 中展示，不得加入运行中技能的 `effectIds` 链

### Requirement: Effect 行为类型映射

系统 SHALL 根据 Effect 配表行的 `effect` 字段选择战斗实现路径，SHALL NOT 硬编码图标文件名到逻辑。

#### Scenario: 射击类 Effect 走子弹

- **WHEN** `skill_effect_table.effect` 为 `bullet`
- **THEN** `SkillSystem` 释放时必须使用该行 `bulletSlot` 与数值列（`damage`、`penetration`、`splitCount`）
- **AND** 子弹 `ownerType` 必须为玩家阵营

#### Scenario: 直伤类 Effect

- **WHEN** `skill_effect_table.effect` 为 `direct_damage`
- **THEN** `SkillSystem` 必须对目标 `Attribute` 扣除 `damage` 列数值
- **AND** 不得生成子弹实例

### Requirement: 技能与 Effect 装配驱动战斗

系统 SHALL 将 `SkillLoadoutState` 中装备栏与技能 Effect 槽配置同步到玩家 `Skill` 组件的施法数据。

#### Scenario: 主装备槽驱动自动施法

- **WHEN** `equippedSkillIds[0]` 变更为新 `skillId`
- **THEN** 玩家实体 `Skill.skillId` 必须在同一帧内更新为该值
- **AND** `PlayerAutoCastSystem` 必须使用新技能的 `cooldownSec` 与 `effectIds`

#### Scenario: 技能 Effect 链顺序

- **WHEN** 某装备技能在 `skillEffectMap[skillId]` 中按槽位顺序排列 Effect id 列表
- **THEN** `SkillSystem` 施放时必须按槽位顺序依次执行已启用（`enabled: true`）的 Effect
