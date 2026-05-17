# 对外接口（契约）

本文件是战斗技能装配 UI 与配表扩展的权威定义。实现层必须与此一致。

## 枚举

- `DragKind`: `effect` | `skill`
- `LoadoutSlotKind`: `equipped_skill` | `skill_effect` | `unequipped_effect` | `skill_inventory`

## 配表行扩展：`SkillRow`（`skill_table.json`）

在现有列基础上 **必须** 包含：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 主键，与 `assets/atlas/Skillicon/{id}.png` 文件名一致 |
| `name` | `string` | 显示名 |
| `iconPath` | `string` | 如 `atlas/Skillicon/chain-lightning.png` |
| `effectIds` | `string` 或 `string[]` | 默认绑定的 Effect id 列表 |
| `cooldownSec` | `number` | 技能冷却 |
| `effectSlotCount` | `number` | 该技能详情页 EffectBtn 槽位数，默认 8 |
| `defaultEquipped` | `boolean` | 是否进入战斗时放入三装备栏之一 |
| `sortOrder` | `number` | SkillBox 排序 |

## 配表行扩展：`SkillEffectRow`（`skill_effect_table.json`）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 主键，对应 `EffectIcon` 文件名（可含 `fx_` 前缀） |
| `name` | `string` | 显示名 |
| `iconPath` | `string` | 如 `atlas/EffectIcon/fx_shot_split_two_icon.png` |
| `effect` | `string` | `bullet` \| `direct_damage` \| `modifier_split` \| `modifier_chain` \| `modifier_pierce` |
| `target` | `string` | `auto` \| `nearest` 等 |
| `bulletSlot` | `string` | `effect=bullet` 时必填 |
| `damage` | `number` | 伤害或公式基数 |
| `cooldownSec` | `number` | 可选，覆盖父 Skill |
| `penetration` | `number` | 可选 |
| `splitCount` | `number` | 可选；`modifier_split` 或 bullet 行分裂级数 |
| `chainCount` | `number` | 可选；连锁额外命中目标数 |
| `enabled` | `boolean` | `false` 时仅 UI 展示，不参与战斗 |

## 组件：`SkillLoadoutState`

| 字段 | 类型 | 说明 |
|------|------|------|
| `equippedSkillIds` | `[string \| null, string \| null, string \| null]` | 对应 SkillBaseBar1–3 |
| `ownedSkillIds` | `string[]` | SkillBox 持有列表 |
| `unequippedEffectIds` | `string[]` | EffectBox 未装备 Effect |
| `skillEffectMap` | `Record<string, (string \| null)[]>` | 技能 id → Effect 槽数组 |
| `panelOpen` | `boolean` | SkillSelectPanel 是否打开 |

## 类：`SkillSlotLayout`

- `layoutHorizontal(count: number, slotWidth: number, slotHeight: number, gap: number): Array<{ x: number; y: number }>`
  - 返回长度为 `count` 的坐标数组；相邻槽 `x` 差值 = `slotWidth + gap`。

## 类：`SkillIconBinder`

- `bindSkillIcon(parent: GImage, skillId: string | null): void`
  - 有 skill：子节点 `GImage` 80×80，`skin`/纹理来自 `Data.Skill` 的 `iconPath`。
  - 无 skill：移除或隐藏子图标。
- `bindEffectIcon(effectBtnRoot: any, effectId: string | null): void`
  - 有 effect：`EffectIcon.visible = true` 并设置纹理。
  - 无 effect：`EffectIcon.visible = false`。

## 模块：`EffectExecutor`（`src/game/skill/EffectExecutor.ts`）

- `buildSkillCastPlan(skillId, effectIds, getEffectRow): SkillCastPlan | null`
  - 按槽顺序合并 `modifier_*`，作用于**下一条** `bullet`。
- `executeSkillCastPlan(plan, ctx): void`
  - 调用 `BulletSystem.spawnBulletWithOptions` 与直伤逻辑。

## 组件：`Skill`（扩展）

| 字段 | 类型 | 说明 |
|------|------|------|
| `pendingCasts` | `PendingCastRequest[]` | 待施放队列（多技能） |
| `cooldownRemain` | `Record<string, number>` | 按 `skillId` 独立 CD |

## 类：`SkillDragService`

- `setCoordinateRoot(mainUiRoot)` — 落点检测坐标系
- `registerSlot(binding)` / stage 指针监听

`DropTarget`：`{ kind: DragKind; slot: LoadoutSlotKind; index: number; skillIndex?: number }`

## 类：`SkillSelectPanelController`

- `init(panelRoot: any, sessionEntity: EntityId, world: EcsWorld): void`
- `setPanelVisible(visible: boolean): void`
- `togglePanel(): void`
- `refreshAll(): void`
- `onOpen(): void` — 隐藏模板 `EffectBtn`，生成 EffectBox 10 槽与 SkillBox 槽

## 类：`SkillLoadoutSyncSystem`（ECS System）

- `update(deltaTime: number): void`
  - 当 `SkillLoadoutState` 变更时，将 `equippedSkillIds[0]` 写入玩家 `Skill.skillId`（主技能），其余槽通过 `SkillSystem` 扩展或 `pendingCast` 队列释放（首版至少同步 slot0）。

## 节点名常量（`uiDefine.ts` / `skillSelectDefine.ts`）

| 常量 | 值 |
|------|-----|
| `SKILL_SELECT_PANEL_NAME` | `SkillSelectPanel` |
| `SKILL_BASE_BAR_NAMES` | `SkillBaseBar1`, `SkillBaseBar2`, `SkillBaseBar3` |
| `EFFECT_BOX_NAME` | `EffectBox` |
| `EFFECT_BOX_SKILL_PREFIX` | `EffectBox_` |
| `SKILL_BOX_NAME` | `SkillBox` |
| `EFFECT_BTN_NAME` | `EffectBtn` |
| `EFFECT_ICON_NAME` | `EffectIcon` |
| `SKILL_BASE_BAR_NAME` | `SkillBaseBar` |

## Skill 图标清单（13）

`acidcircus`, `acidspray`, `ball-lightning`, `basher`, `blades`, `blazing-feet`, `blizzard`, `chain-lightning`, `devolution`, `dragonbreath`, `electric-snare`, `electrostatics`, `firearrow-lvl3`

## Effect 图标数量

74 张 PNG，文件名以 `tools/list-effect-icons.ps1`（实现阶段添加）或目录枚举为准；配表 `id` 与文件名一一对应。
