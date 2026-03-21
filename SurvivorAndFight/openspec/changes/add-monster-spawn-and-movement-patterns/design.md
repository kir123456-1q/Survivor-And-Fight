# Design: 怪物出生点系统与怪物移动模式系统

## Context
- 依赖：`add-ecs-gameplay-phase1` 中的 Position、Velocity、PlayerTag、MonsterTag、Control、FilterRegistry 以及 Movement/Skill 等系统能力。
- 目标：补齐怪物“出生位置规则”与“按类型移动规则”，确保刷怪节奏稳定且行为可配置。
- 范围：本变更只定义四角随机出生与三类移动模式（远程小怪、近战小怪、Boss）。

## Goals / Non-Goals
- Goals:
  - 怪物出生点须严格来自地图四个角，并由系统按随机策略选择。
  - 怪物移动模式须支持 `ranged`、`melee`、`boss` 三类。
  - Boss 行为须按固定阶段循环：`rangedAttack -> approach -> retreat -> rangedAttack`。
  - 关键参数须配表化，支持后续数值调整。
- Non-Goals:
  - 不在本变更实现新的怪物攻击特效与子弹资源制作。
  - 不在本变更实现复杂路径规划（A*）或群体避障。
  - 不在本变更引入新的并行调度机制。

## Decisions
- **出生点模型**：定义四个角点坐标（左上、右上、左下、右下）。每次刷怪时在四个点中等概率随机选择一个作为初始 Position。
- **行为组件**：新增 `MonsterBehavior` 组件，包含：
  - `mode`: `ranged | melee | boss`
  - `moveSpeed`: number
  - `desiredDistance`: number（远程保持距离）
  - `orbitAngularSpeed`: number（远程绕圈角速度，弧度/秒）
  - `bossAttackRange`: number（Boss 远程攻击距离阈值）
  - `bossApproachDuration`: number（Boss 靠近阶段时长）
  - `bossRetreatDuration`: number（Boss 远离阶段时长）
- **远程小怪规则**：
  - 与玩家距离大于 `desiredDistance` 时朝玩家靠近；
  - 与玩家距离小于 `desiredDistance` 时远离；
  - 与玩家距离接近目标时切向移动形成绕圈。
- **近战小怪规则**：始终按 `moveSpeed` 朝玩家方向移动。
- **Boss 规则**：
  - `rangedAttack`：以远程攻击为主，保持在 `bossAttackRange` 附近；
  - `approach`：持续靠近玩家，持续 `bossApproachDuration`；
  - `retreat`：持续远离玩家，持续 `bossRetreatDuration`；
  - 阶段完成后严格切换到下一阶段并循环。
- **系统职责边界**：
  - `MonsterSpawnSystem` 只负责出生点选择与初始位置写入；
  - `MonsterMovementSystem` 只负责移动速度向量与行为阶段更新；
  - 实际伤害结算仍由现有技能/子弹系统负责。

## Risks / Trade-offs
- 四角出生可能导致出生分布被玩家“蹲点”利用，但实现简单、可验证，适合作为第一阶段规则。
- Boss 行为使用固定阶段时长，可控性高，但智能性弱；后续可演进为行为树条件切换。
- 远程绕圈采用简单切向速度计算，性能开销低，但在极端地形下可能出现路径不自然。

## Migration Plan
- 本变更为新增能力，不替换已有 `movement` 或 `skill-effect` 规范。
- 集成顺序：
  1) 加入 `MonsterBehavior` 组件与配表字段；
  2) 接入 `MonsterSpawnSystem` 到刷怪流程；
  3) 接入 `MonsterMovementSystem` 到系统更新链；
  4) 校验三类怪物行为与 Boss 阶段切换。

## Open Questions
- 无。本阶段默认采用“等概率四角随机”与“固定阶段时长 Boss 循环”。
