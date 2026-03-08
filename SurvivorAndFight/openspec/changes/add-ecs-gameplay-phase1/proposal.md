# Change: 为 ECS 玩法层增加玩家/怪物实体、移动/属性/技能/操控组件与系统及筛选器

## Why
在 ECS 核心（add-ecs-core-phase1）与属性配置能力（ecs-attribute-system）基础上，需要定义玩法层实体形态（玩家/怪物）、移动与属性（含可溯源 modifier）、技能（多 effect、配表驱动、公式与索敌）、操控以及驱动这些数据的筛选器，以便实现可配置、可扩展的战斗与操控逻辑。

## What Changes
- 新增**实体形态能力**：定义 Player / Monster 等 Entity 的标识方式与组件组合约定。
- 新增**移动组件与移动系统**：位置/速度等组件及每帧驱动位置更新的 MovementSystem。
- 扩展**属性能力**：属性组件与属性系统，并补充 **modifier 机制**，供外来 buff 进行属性可溯源变化。
- 新增**技能能力**：技能由多个 effect 组成；每个 effect 包含执行者、效果、目标三部分，可配表驱动；效果参数支持公式（属性别名解析）；目标支持 auto（威胁度+血量加权索敌）与 simple（跟随鼠标）；技能配表增加特效栏位、子弹栏位等。
- 新增**操控组件与操控系统**：用于标记与处理玩家控制的实体及其输入驱动。
- 新增**筛选器设计**：定义对应筛选器，用于驱动上述 Entity 等数据的查询与迭代。

## New Files and Interfaces

本变更须新增以下文件，各文件对外接口见同目录下 **`INTERFACES.md`**。归档后须将该接口文档保留到项目文档树（如 `docs/ecs-gameplay-phase1-interfaces.md` 或对应 spec 目录），供后续实现与调用方使用。

### 新建文件清单
- **组件**：`src/ecs/components/Position.ts`、`Velocity.ts`、`PlayerTag.ts`、`MonsterTag.ts`、`Attribute.ts`、`Skill.ts`、`Control.ts`
- **系统**：`src/ecs/systems/MovementSystem.ts`、`AttributeSystem.ts`、`SkillSystem.ts`、`ControlSystem.ts`
- **筛选器**：`src/ecs/filters/FilterRegistry.ts`、`NamedFilters.ts`
- **技能相关**：`src/game/skill/FormulaParser.ts`、`Targeting.ts`

### 接口概要（详见 INTERFACES.md）
- **组件**：各组件数据字段（如 Position.x/y/z、Velocity.vx/vy、Attribute.base 与 modifiers、Skill.currentSkillId 与 cooldownRemain 等）；Attribute 须提供 getFinalValue、addModifier、removeModifiersBySource、getModifierContributions。
- **系统**：MovementSystem / AttributeSystem / SkillSystem / ControlSystem 均须提供 `update(deltaTime: number): void`；AttributeSystem 须提供属性合并与 Modifier API；ControlSystem 须依赖输入抽象与 Controllable 筛选器。
- **筛选器**：FilterRegistry 须提供 `query(componentTypes): EntityId[]`、`registerNamedFilter`、`getNamedFilter`；NamedFilters 须提供 Players、Monsters、Controllable、Movable。
- **公式与索敌**：FormulaParser 须提供 `evaluate(formula, context): number`；Targeting 须提供 `resolveAuto`、`resolveSimple`。

## Impact
- **Affected specs（新增能力）**
  - `entity-archetypes`：玩家/怪物等实体形态与组件组合约定。
  - `movement`：移动组件与移动系统。
  - `ecs-attribute-system`：属性组件、属性系统及 modifier 机制（MODIFIED/ADDED）。
  - `skill-effect`：技能组件、技能系统、effect 配表（执行者/效果/目标）、公式解析、索敌、特效与子弹栏位。
  - `control`：操控组件与操控系统。
  - `ecs-filters`：筛选器设计与驱动 Entity 数据的查询方式。
- **Affected code**
  - 新建文件见上文「New Files and Interfaces」及 `INTERFACES.md`。
  - 配表与读表：技能/effect 表、公式与索敌配置。
