# 接口文档（add-monster-spawn-and-movement-patterns）

归档后本文件须保留在项目文档树（如 `docs/monster-spawn-and-movement-interfaces.md`）。

## 新建文件清单

- `src/ecs/components/MonsterBehavior.ts`
- `src/game/monster/MonsterSpawnSystem.ts`
- `src/game/monster/MonsterMovementSystem.ts`
- `src/game/monster/BossAttackState.ts`
- `docs/config/monster_behavior_table.json`

## 组件接口

### `MonsterBehavior`
- `mode: 'ranged' | 'melee' | 'boss'`
- `moveSpeed: number`
- `desiredDistance?: number`
- `orbitAngularSpeed?: number`
- `bossAttackRange?: number`
- `bossApproachDuration?: number`
- `bossRetreatDuration?: number`
- `bossState?: 'rangedAttack' | 'approach' | 'retreat'`
- `bossStateElapsed?: number`

## 系统接口

### `MonsterSpawnSystem`
- `setSpawnCorners(corners: { x: number; y: number }[]): void`
- `pickSpawnCorner(): { x: number; y: number }`
- `spawnOne(monsterTypeId: string): number`
  - 说明：创建怪物实体并写入初始 `Position`。

### `MonsterMovementSystem`
- `update(deltaTime: number): void`
  - 说明：遍历带 `MonsterBehavior` 的怪物实体，按模式更新速度或位置。
- `updateRangedBehavior(entityId: number, deltaTime: number): void`
- `updateMeleeBehavior(entityId: number, deltaTime: number): void`
- `updateBossBehavior(entityId: number, deltaTime: number): void`

### `BossAttackState`
- `type BossState = 'rangedAttack' | 'approach' | 'retreat'`
- `nextBossState(current: BossState): BossState`

## 配表字段接口

### `monster_behavior_table.json` 行结构
- `id: string`
- `mode: 'ranged' | 'melee' | 'boss'`
- `moveSpeed: number`
- `desiredDistance?: number`
- `orbitAngularSpeed?: number`
- `bossAttackRange?: number`
- `bossApproachDuration?: number`
- `bossRetreatDuration?: number`

## 约束

- 出生点只允许来自四角坐标集合。
- Boss 阶段切换顺序固定：`rangedAttack -> approach -> retreat -> rangedAttack`。
- 近战模式不读取 `desiredDistance` 与 `orbitAngularSpeed`。
