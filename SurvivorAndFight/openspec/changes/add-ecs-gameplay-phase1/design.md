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
- **实体形态**：通过 Tag 组件区分 Player / Monster；须提供 `PlayerTag`、`MonsterTag` 组件供筛选器使用。本阶段不引入复杂 Archetype 类型系统。
- **移动**：Position、Velocity 组件与 MovementSystem 每帧根据 Velocity 更新 Position；与 ecs-laya-binding-demo 的 Transform 同步衔接，执行顺序须为 ECS 先于 Laya 同步。
- **属性与 Modifier**：Attribute 组件须持有基础属性与 Modifier 列表；每个 modifier 须含来源 id、类型（加算/乘算）、数值；AttributeSystem 或 getter 须按约定顺序（先加算后乘算）合并 modifier 得到最终值，并支持按 modifier 溯源。
- **技能与 Effect**：Skill 组件须持有当前技能 id、冷却等；技能表须指向多个 effect 配置；每个 effect 须含 executor 枚举、effect 类型、参数公式字符串、target 枚举（auto / simple）。公式解析器须支持属性别名（atk、hp 等）从执行者/目标实体属性解析。索敌：auto 须按威胁度与血量加权（优先低血高威胁），simple 须以鼠标位置为目标。
- **特效/子弹栏位**：技能或 effect 配表须包含“特效栏位”“子弹栏位”字段，用于配置资源 id 或预制体路径；本阶段只约定表结构，播放/生成由后续系统根据栏位读取。
- **操控**：Control 组件须标记实体受玩家控制；ControlSystem 须根据 input-abstraction 写入移动与技能释放意图到对应实体组件或命令缓冲。
- **筛选器**：须提供按组件组合查询 Entity 列表的抽象，与 ecs-core 的按组件类型遍历对齐；须封装命名筛选器 Players、Monsters、Controllable、Movable，供 Movement、Skill、Control 等 System 使用。

## Risks / Trade-offs
- 公式解析与属性别名：须统一属性名与配表列名，避免运行时解析失败；须使用白名单别名与明确默认值。
- 索敌权重：auto 的“威胁度”须与后续仇恨/威胁系统对接；本阶段须实现基于距离与血量的可配置权重。
- Modifier 顺序与合并规则：加算/乘算顺序须在 design/spec 中固定，并在 AttributeSystem 中一致实现。

## Migration Plan
- 本变更为新增能力，不替换现有 ecs-core 或 ecs-attribute-system 的既有行为；ecs-attribute-system 通过 ADDED requirement 增加“属性组件与 modifier”，原有“配表驱动初始化”保留。
- 实现顺序：entity-archetypes → movement → attribute modifier → filters → skill-effect → control。

## Open Questions
- 技能冷却与 CD 显示在本阶段 spec 中已明确为 Skill 组件字段（cooldownRemain）；若需 CD 显示 UI，由调用方读该字段。
- 子弹栏位本阶段约定为单资源 id 字段；多段/多子弹通过扩展配表结构在后续变更中增加。
