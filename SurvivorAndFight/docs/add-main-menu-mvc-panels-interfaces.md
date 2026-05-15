# 对外接口（主菜单 MVC + 跑图视图）

归档时复制到 `docs/add-main-menu-mvc-panels-interfaces.md`。

## 路由 id（`uiDefine.ts`）

| 常量名 | 值 | 预制体 |
|--------|-----|--------|
| `START_PANEL_ROUTE_ID` | `start-panel` | `prefabs/MainUI/StartPanel.lh` |
| `SELECT_LEVEL_PANEL_ROUTE_ID` | `select-level-panel` | `prefabs/MainUI/SelectLevelPanel.lh` |
| `RUN_MAP_PANEL_ROUTE_ID` | `run-map-panel` | `prefabs/MainUI/RunMapPanel.lh` |
| `MAP_NODE_PREFAB` | — | `prefabs/UIItem/MapNode.lh` |
| `LINE_NODE_PREFAB` | — | `prefabs/UIItem/LineNode.lh` |

## 预制体节点名（View 查找用）

| 预制体 | 节点名 | 用途 |
|--------|--------|------|
| `StartPanel.lh` | `StartBtn` | 进入选关 |
| `SelectLevelPanel.lh` | `EscBtn` | 返回开始 |
| `SelectLevelPanel.lh` | `Level1Btn` / `Level2Btn` / `Level3Btn` | 难度 1 / 2 / 3 |
| `RunMapPanel.lh` | `BackBtn` | 返回选关 |
| `RunMapPanel.lh` | `MapPanel` | 节点与连线容器 |
| `MapNode.lh` | （根 `GButton`） | 点击选路 |
| `LineNode.lh` | `MovedlineNode` | 已走过边高亮 |

## `MetaMenuBootstrap`

```typescript
class MetaMenuBootstrap {
  static registerRoutes(stack: UIStackManager): void;
  static async start(stack: UIStackManager): Promise<void>; // push start-panel
}
```

## Payload 类型

### `SelectLevelPanelPayload`（可选，出栈无 payload）

空或省略。

### `RunMapPanelPayload`

| 字段 | 类型 | 说明 |
|------|------|------|
| `difficulty` | `1 \| 2 \| 3` | 与 `Level1Btn`/`Level2Btn`/`Level3Btn` 对应 |
| `runSeed` | `RunSeed` | 由 Controller 在 push 前生成 |
| `runMapState` | `RunMapState` | 已生成图的状态；首屏由 `MetaFlowController` 或工厂注入 |

## View 方法签名（示意）

### `StartPanelView`

- `initialize(): Promise<void>`
- `show(): void` / `hide(): void` / `dispose(): void`
- `setOnStart(handler: () => void): void`

### `SelectLevelPanelView`

- `setOnEsc(handler: () => void): void`
- `setOnLevelSelected(handler: (difficulty: 1|2|3) => void): void`

### `RunMapPanelView`

- `bindMapState(state: RunMapState): void`
- `refreshGraph(): void` — 根据 `state.graph` 重建 MapPanel 子节点
- `setScrollToNode(nodeId: string): void`
- `setOnNodeClicked(handler: (nodeId: string) => void): void`

## Controller 与 `MetaFlowController` 边界

- **StartPanelController**：`StartBtn` → `uiStack.push(SELECT_LEVEL_PANEL_ROUTE_ID)`
- **SelectLevelPanelController**：`EscBtn` → `uiStack.pop(SELECT_LEVEL_PANEL_ROUTE_ID)`；`LevelNBtn` → 生成 `RunSeed` + `RunMapState` → `uiStack.push(RUN_MAP_PANEL_ROUTE_ID, payload)`
- **RunMapPanelController**：`BackBtn` → `uiStack.pop(RUN_MAP_PANEL_ROUTE_ID)`；节点点击 → `runMapState.selectNext(id)`，成功则 `view.refreshGraph()` 并视节点类型调用 `metaFlow.goto`

## 错误码（UI 层，前缀 `UI_`）

| 代码 | 含义 |
|------|------|
| `UI_ROUTE_NOT_REGISTERED` | push 时路由未注册 |
| `UI_POP_MISMATCH` | pop 时栈顶 routeId 与期望不符 |
| `UI_MAP_NODE_NOT_FOUND` | 刷新时 graph 中 id 在视图中无对应实例 |
| `UI_MAP_PANEL_MISSING` | `RunMapPanel` 预制体缺少 `MapPanel` 节点 |

## 事件（可选派发，供 HUD / 日志）

| 事件名 | 载荷 |
|--------|------|
| `ui.meta.start.clicked` | — |
| `ui.meta.level.selected` | `{ difficulty: 1\|2\|3, runSeed: RunSeed }` |
| `ui.meta.runmap.node.clicked` | `{ nodeId: string, ok: boolean, code?: string }` |

`RunSeed`、`RunMapState`、`RunGraph` 字段定义以 `add-meta-flow-run-map-spellcraft/INTERFACES.md` 为准。
