# 对外接口（契约）

本文档列出跨模块边界类型与服务方法签名；实现须与此保持一致。归档时复制到 `docs/add-meta-flow-run-map-spellcraft-interfaces.md` 或并入对应 `openspec/specs/<capability>/`。

## 类型：`RunSeed`

| 字段 | 类型 | 说明 |
|------|------|------|
| `value` | `string` | 64-bit 十六进制字符串或项目约定种子格式 |
| `createdAt` | `number` | UTC 毫秒时间戳 |

## 类型：`MetaView`

枚举：`Title` | `PreRun` | `RunMap` | `Combat` | `PauseOverlay`。

壳层控制器暴露迁移方法：`goto(view: MetaView, payload?: unknown): void`。

## 类型：`RunGraph`

| 字段 | 类型 | 说明 |
|------|------|------|
| `acts` | `RunAct[]` | 长度须为 3 |
| `seed` | `RunSeed` | 生成该图使用的种子 |

### `RunAct`

| 字段 | 类型 | 说明 |
|------|------|------|
| `index` | `0 \| 1 \| 2` | 大关序号 |
| `layers` | `RunLayer[]` | 层序列 |

### `RunLayer`

| 字段 | 类型 | 说明 |
|------|------|------|
| `nodes` | `RunNode[]` | 该层节点 |
| `edges` | `[string, string][]` | 前后继有向边，引用 `RunNode.id` |

### `RunNode`

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 全图唯一 |
| `type` | `RunNodeType` | 配表驱动字符串枚举 |
| `payloadId` | `string \| null` | 战斗或事件的配置 id |

`RunNodeType` 至少包含：`Campfire`、`Shop`、`Combat`、`Elite`、`Unknown`。

## 类型：`RunMapState`

| 字段 | 类型 | 说明 |
|------|------|------|
| `graph` | `RunGraph` | 当前局固定不变 |
| `currentNodeId` | `string` | 当前停留节点 |
| `visited` | `Set<string>` 或序列化等价物 | 已访问节点集合 |
| `availableNext` | `string[]` | 从当前节点经一条边可达且满足解锁条件的节点 id 列表 |

方法签名：

- `selectNext(nodeId: string): { ok: true } \| { ok: false, code: string }`

## 类型：`WandId`、`SpellPieceId`

均为 `string`，与配表主键一致。

## 类型：`WandSlot`

| 字段 | 类型 | 说明 |
|------|------|------|
| `role` | `'Projectile' \| 'Modifier' \| 'Utility'` | 槽语义 |
| `pieceId` | `SpellPieceId \| null` | 装配内容 |

## 类型：`WandInstance`

| 字段 | 类型 | 说明 |
|------|------|------|
| `wandId` | `WandId` | 模板 |
| `slots` | `WandSlot[]` | 顺序决定求值次序 |

## 类型：`Loadout`

| 字段 | 类型 | 说明 |
|------|------|------|
| `wands` | `[WandInstance \| null, WandInstance \| null, WandInstance \| null]` | 长度固定 3；未解锁槽为 null |

方法签名：

- `setWand(slotIndex: 0|1|2, wand: WandInstance \| null): { ok: true } \| { ok: false, code: string }`
- `equipPiece(wandIndex: 0|1|2, slotIndex: number, pieceId: SpellPieceId \| null): { ok: true } \| { ok: false, code: string }`

## 类型：`CastPlan`

战斗帧消费的结构：

| 字段 | 类型 | 说明 |
|------|------|------|
| `sourceWandIndex` | `0 \| 1 \| 2` | 施放来源 |
| `steps` | `CastStep[]` | 有序步骤 |

### `CastStep`

| 字段 | 类型 | 说明 |
|------|------|------|
| `kind` | `'EmitProjectile' \| 'ApplyModifier' \| 'TriggerEffect'` | 步骤种类 |
| `refId` | `string` | 指向子弹模板、修饰器规则或效果 id |

方法签名：

- `evalCast(loadout: Loadout, wandIndex: 0|1|2): { ok: true, plan: CastPlan } \| { ok: false, code: string }`

## 事件（字符串常量）

| 名称 | 载荷 |
|------|------|
| `meta.run.confirm` | `{ seed: RunSeed }` |
| `run.node.selected` | `{ nodeId: string }` |
| `combat.enter` | `{ nodeId: string, payloadId: string \| null }` |
| `spellcraft.cast.requested` | `{ wandIndex: 0|1|2 }` |

## 错误码（前缀）

| 前缀 | 所有者 |
|------|--------|
| `META_*` | 元流程 |
| `MAP_*` | 跑图 |
| `WAND_*` | 法杖装配 |
| `CAST_*` | 求值 |

具体常量名由实现定义并在 define 文件中集中导出。
