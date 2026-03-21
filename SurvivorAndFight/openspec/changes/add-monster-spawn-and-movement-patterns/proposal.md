# Change: 增加怪物出生点系统与怪物移动模式系统

## Why
当前玩法层缺少“怪物从何处出生”与“不同怪物如何移动”的明确能力定义，导致刷怪行为与战斗节奏不稳定。需要通过 OpenSpec 新增两项能力：怪物出生点系统（先实现四角随机）和怪物移动模式系统（远程小怪、近战小怪、Boss），以统一实现与验收标准。

## What Changes
- 新增 **怪物出生点系统能力**：在地图四个角中随机选择出生点，生成怪物时写入初始 Position。
- 新增 **怪物移动模式系统能力**：按怪物类型区分三种行为模式。
  - 远程小怪：保持与玩家的目标距离并绕圈移动。
  - 近战小怪：持续向玩家靠近。
  - Boss：执行“远程攻击 -> 靠近 -> 远离 -> 远程攻击”的循环模式。
- 新增怪物行为模式字段约定与读取规则，供刷怪系统和移动系统对接。

## New Files and Interfaces
本变更须新增以下文件，各文件对外接口见同目录下 **`INTERFACES.md`**。归档后须将该接口文档保留到项目文档树（如 `docs/monster-spawn-and-movement-interfaces.md`），供后续实现与调用方使用。

### 新建文件清单
- `src/ecs/components/MonsterBehavior.ts`：怪物行为模式组件（近战/远程/Boss）与参数。
- `src/game/monster/MonsterSpawnSystem.ts`：怪物出生点系统（四角随机出生）。
- `src/game/monster/MonsterMovementSystem.ts`：怪物移动模式系统（远程绕圈、近战追击、Boss 循环行为）。
- `src/game/monster/BossAttackState.ts`：Boss 行为状态定义（attack/approach/retreat）与阶段切换参数。
- `docs/config/monster_behavior_table.json`：怪物行为配表（模式、目标距离、环绕角速度、Boss 阶段时长等）。

## Impact
- **Affected specs（新增能力）**
  - `monster-spawn-system`：怪物出生点生成规则与四角随机策略。
  - `monster-movement-pattern`：远程小怪、近战小怪、Boss 三类移动与战斗循环规则。
- **Affected code（预期）**
  - `src/game/monster/`：新增出生点与移动模式系统。
  - `src/ecs/components/`：新增怪物行为模式组件。
  - `docs/config/`：新增怪物行为配表与字段约定。
