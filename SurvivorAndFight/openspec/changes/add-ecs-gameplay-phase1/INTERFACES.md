# 接口文档（add-ecs-gameplay-phase1）

归档后本文件须保留在项目内（如 `docs/ecs-gameplay-phase1-interfaces.md` 或对应 spec 目录），供后续实现与调用方使用。

---

## 新建文件清单与路径

| 路径 | 说明 |
|-----|------|
| `src/ecs/components/Position.ts` | 位置组件 |
| `src/ecs/components/Velocity.ts` | 速度组件 |
| `src/ecs/components/PlayerTag.ts` | 玩家实体标记组件 |
| `src/ecs/components/MonsterTag.ts` | 怪物实体标记组件 |
| `src/ecs/components/Attribute.ts` | 属性组件（含基础属性与 Modifier 列表） |
| `src/ecs/components/Skill.ts` | 技能组件（当前技能 id、冷却等） |
| `src/ecs/components/Control.ts` | 操控标记组件 |
| `src/ecs/systems/MovementSystem.ts` | 移动系统 |
| `src/ecs/systems/AttributeSystem.ts` | 属性系统（合并与溯源） |
| `src/ecs/systems/SkillSystem.ts` | 技能系统 |
| `src/ecs/systems/ControlSystem.ts` | 操控系统 |
| `src/ecs/filters/FilterRegistry.ts` | 筛选器注册与按组件组合查询 |
| `src/ecs/filters/NamedFilters.ts` | 命名筛选器（Players / Monsters / Controllable 等） |
| `src/game/skill/FormulaParser.ts` | 公式解析器（属性别名解析） |
| `src/game/skill/Targeting.ts` | 索敌（auto / simple） |

---

## 组件接口（数据形态）

### Position
- `x: number`
- `y: number`
- `z?: number`（若为 2D 可省略）

### Velocity
- `vx: number`
- `vy: number`
- `vz?: number`

### PlayerTag / MonsterTag
- 空标记组件（无字段或仅 `readonly _tag: 'player' | 'monster'`）

### Attribute
- `base: Record<string, number>` — 基础属性键值
- `modifiers: AttributeModifier[]`
- **对外 API（由 AttributeSystem 或 Attribute 模块提供）**：
  - `getFinalValue(entityId: number, key: string): number`
  - `getModifierContributions(entityId: number, key: string): { sourceId: string; value: number }[]`
  - `addModifier(entityId: number, mod: AttributeModifier): void`
  - `removeModifiersBySource(entityId: number, sourceId: string): void`

### AttributeModifier
- `sourceId: string`
- `type: 'add' | 'multiply'`
- `key: string` — 影响的属性名
- `value: number`

### Skill
- `currentSkillId: string | null`
- `cooldownRemain: Record<string, number>` — 技能 id -> 剩余 CD 时间
- `pendingCast: { skillId: string } | null` — 本帧待释放（由 ControlSystem 写入）

### Control
- 空标记组件或 `readonly _controlled: true`

---

## 系统接口

### MovementSystem
- `update(deltaTime: number): void` — 遍历拥有 Position + Velocity 的实体，按速度更新位置

### AttributeSystem
- `update(deltaTime: number): void` — 按需：刷新缓存或仅提供 getter 时无状态更新
- 须提供：`getFinalValue(entityId, key): number`、`addModifier`、`removeModifiersBySource`、`getModifierContributions`

### SkillSystem
- `update(deltaTime: number): void` — 处理 pendingCast、执行 effect 列表、扣 CD
- 依赖：FormulaParser、Targeting、读表 API、FilterRegistry（获取目标实体）

### ControlSystem
- `update(deltaTime: number): void` — 从输入抽象读取输入，向带 Control 的实体写入移动意图与 pendingCast
- 依赖：输入抽象接口（如 `getMoveAxis(): { x: number; y: number }`、`getSkillCastRequest(): number | null`）、FilterRegistry（Controllable）

---

## 筛选器接口

### FilterRegistry（或等价）
- `query(componentTypes: readonly ComponentType[]): EntityId[]` — 返回拥有全部指定组件类型的实体 ID 列表
- `registerNamedFilter(name: string, componentTypes: readonly ComponentType[]): void`
- `getNamedFilter(name: string): EntityId[]` — 返回命名筛选结果，每帧由调用方在适当时机调用

### NamedFilters 提供的命名
- `Players` — 拥有 PlayerTag
- `Monsters` — 拥有 MonsterTag
- `Controllable` — 拥有 Control
- `Movable` — 拥有 Position + Velocity

---

## 公式与索敌接口

### FormulaParser
- `evaluate(formula: string, context: Record<string, number>): number` — 属性别名从 context 提供，解析失败须抛错或返回明确默认并打日志
- `context` 由调用方从 Attribute 的 getFinalValue 按别名白名单填充

### Targeting
- `resolveAuto(casterEntityId: number, candidates: EntityId[], world: EcsWorld): EntityId | null` — 按威胁度与血量加权，优先低血高威胁
- `resolveSimple(casterEntityId: number, targetWorldPos: { x: number; y: number; z?: number }, world: EcsWorld): EntityId | null` — 以 targetWorldPos 为目标的简单索敌（如最近）

---

## 归档后保留约定

- 本接口文档在变更归档时须复制或移动到持久位置（如 `docs/ecs-gameplay-phase1-interfaces.md` 或 `openspec/specs/<capability>/interfaces.md`），以便后续实现与调用方查阅，不得仅存在于 archive 目录而不在文档树中保留可发现副本。
