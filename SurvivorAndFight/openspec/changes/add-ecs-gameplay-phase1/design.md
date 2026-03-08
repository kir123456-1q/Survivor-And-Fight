# Design: ECS 玩法层 — 实体、移动、属性、技能、操控与筛选器

## Context
- 依赖：add-ecs-core-phase1（ECS 内核、Component/System 模型）、ecs-attribute-system（属性与配表驱动）、config-table-loader（读表 API）。
- 目标：在 ECS 架构下实现玩法层实体（玩家/怪物）、移动、属性（含 buff 可溯源修改）、技能（多 effect、配表、公式与索敌）、操控，以及统一的筛选器以驱动上述数据。

## Goals / Non-Goals
- Goals:
  - 明确 Player/Monster 等实体在 ECS 中的表示方式（Tag 或 Archetype 约定）。
  - 提供移动组件与系统，与现有 Transform/Position 等概念兼容。
  - 属性组件支持 modifier 机制：外来 buff 可增删 modifier，最终属性可溯源到每个 modifier。
  - 技能由多 effect 组成；effect 配表包含执行者、效果类型、参数公式、目标类型；公式支持属性别名解析；目标支持 auto（威胁+血量加权）与 simple（鼠标位置）；技能表含特效栏位、子弹栏位。
  - 操控组件标记“被玩家控制”的实体，操控系统根据输入驱动对应实体行为。
  - 筛选器抽象：按组件组合查询实体，供各 System 使用，与 ecs-core 的查询能力对齐。
- Non-Goals:
  - 不实现完整 buff 系统（仅约定 modifier 的挂载与溯源）。
  - 不实现具体渲染/特效/子弹实例化，仅约定配表栏位与数据格式。
  - 本阶段不引入多线程或 Job 调度。

## Decisions
- **实体形态**：通过“Tag 组件”或“Archetype 名”区分 Player / Monster；具体为可选的 `PlayerTag`、`MonsterTag` 等组件，便于筛选器使用。不在本阶段引入复杂 Archetype 类型系统。
- **移动**：Movement 相关组件（如 Position、Velocity）与 MovementSystem 每帧根据 Velocity 等更新 Position；与 ecs-laya-binding-demo 的 Transform 同步可衔接（先 ECS 再同步到 Laya）。
- **属性与 Modifier**：Attribute 组件持有“基础属性”与“Modifier 列表”；每个 modifier 有来源 id（如 buffId）、类型（加算/乘算等）、数值；AttributeSystem 或 getter 按约定顺序合并 modifier 得到最终值，支持溯源到具体 modifier。
- **技能与 Effect**：Skill 组件持有当前技能 id、冷却等；技能表指向多个 effect 配置；每个 effect 有 executor 枚举（如 player）、effect 类型（如 damage）、参数公式字符串（如 atk*1.2）、target 枚举（auto / simple）。公式解析器支持属性别名（atk、hp 等）从执行者/目标实体属性解析。索敌：auto = 威胁度与血量加权（优先低血高威胁），simple = 以鼠标位置为目标的简单索敌。
- **特效/子弹栏位**：在技能或 effect 配表中增加“特效栏位”“子弹栏位”等字段，用于配置资源 id 或预制体路径；具体播放/生成由后续系统根据栏位读取，本阶段只约定表结构。
- **操控**：Control 组件标记实体受玩家控制；ControlSystem 根据输入（如来自 input-abstraction）写入移动/技能释放等意图到对应实体组件或命令缓冲。
- **筛选器**：提供“筛选器”抽象：按“拥有哪些组件”查询 Entity 列表；与 ecs-core 的“按组件类型遍历”对齐，可封装为 Named Filter（如 “Players”“Monsters”“Controllable”），供 Movement、Skill、Control 等 System 使用。

## Risks / Trade-offs
- 公式解析与属性别名：需要统一属性名与配表列名，避免运行时解析失败；建议白名单别名与默认值。
- 索敌权重：auto 的“威胁度”需后续与仇恨/威胁系统对接，本阶段可先实现“距离+血量”等简单权重。
- Modifier 顺序与合并规则：加算/乘算顺序会影响结果，需在 design/spec 中写死规则并在 AttributeSystem 中一致实现。

## Migration Plan
- 本变更为新增能力，不替换现有 ecs-core 或 ecs-attribute-system 的既有行为；ecs-attribute-system 通过 ADDED requirement 增加“属性组件与 modifier”，原有“配表驱动初始化”保留。
- 实现顺序建议：entity-archetypes → movement → attribute modifier → filters → skill-effect → control。

## Open Questions
- 技能冷却与 CD 显示是否在本阶段 spec 中明确为技能组件字段？
- 子弹栏位是“单 bullet 资源 id”还是“支持多段/多子弹”的列表？先按单资源 id 约定，后续可扩展。
