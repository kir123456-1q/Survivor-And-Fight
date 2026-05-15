# Design: 主菜单 MVC 与跑图 MapPanel

## Context
- 引擎 UI 类型为 **UI2**（`PlayerSettings.json` 中 `addons.laya.ui` 为 `"ui2"`）：预制体使用 `GButton`、`GImage`、`Area2D` 等，代码访问须带 `Laya.` 前缀。
- 已有 `UiControllerBase`、`UIStackManager`、`RestartPanelController` 三联模式；本变更复用同一模式，禁止在 View 内直接调用 `MetaFlowController` 或修改 `RunMapState`。
- `RunMapPanel.lh` 中 `MapPanel` 高度为 1644、初始 `y` 为负值，表示设计意图为**纵向长卷轴**；节点自下而上推进，与《杀戮尖塔》式 Act 内 DAG 跑图一致。
- 逻辑跑图数据与 `add-meta-flow-run-map-spellcraft` 的 `RunGraph` / `RunMapState` 一致；本变更只负责将其映射为屏幕坐标与可点击控件。

## Goals
- 启动游戏后显示 `StartPanel`；`StartBtn` → 选关；`EscBtn` → 返回开始；`Level1Btn`/`Level2Btn`/`Level3Btn` → 带难度进入跑图；`BackBtn` → 返回选关。
- 跑图屏根据 `RunGraph` 在 `MapPanel` 下动态创建 `MapNode.lh`、`LineNode.lh` 实例；合法节点可点击并调用 `RunMapState.selectNext`；非法节点不可点击且视觉区分。
- `MapPanel` 支持**拖动平移**与**鼠标滚轮**纵向滚动；初始视口对准当前层/当前节点附近（底部起点层在卷轴下方区域）。

## Non-Goals
- 本变更不实现三大关 Tab 切换条（`RunMap_ACT` 美术子图可后续接入）；首版仅渲染当前 `RunMapState` 所指 Act 的图，或整图单 Act 占位。
- 本变更不实现商店、篝火、问号等节点专属弹窗 UI；节点类型仅影响图标/颜色占位，详细交互归属后续变更。
- 本变更不修改 `add-meta-flow-run-map-spellcraft` 的配表与生成器算法。

## Decisions

### 决策：每屏一组 Model / View / Controller
- **Controller** 继承 `UiControllerBase`，注册唯一 `routeId`；在 `onShow` 中把 Model 状态交给 View 渲染，把用户输入转为 `UIStackManager.push/pop` 或 `MetaFlowController` 调用。
- **View** 负责 `Laya.Prefab.instantiate`、按**节点名**查找控件（`StartBtn`、`MapPanel` 等），注册/注销 `Laya.Event.CLICK`；不得持有业务单例。
- **Model** 持有界面局部状态（如 `difficulty: 1|2|3`）或对 `RunMapState` 的只读引用；状态变更由 Controller 写入。

### 决策：UI 栈导航表（确定性）

| 用户操作 | 栈操作 | 目标 routeId |
|----------|--------|----------------|
| 应用启动（元菜单模式） | `push` | `start-panel` |
| `StartBtn` | `push` | `select-level-panel` |
| `EscBtn` | `pop`（期望栈顶为选关） | 恢复 `start-panel` |
| `LevelNBtn` | `push`，payload 含 `difficulty: N` | `run-map-panel` |
| `BackBtn` | `pop`（期望栈顶为跑图） | 恢复 `select-level-panel` |

同一路由 id 在栈中只存在一个 Controller 实例；重复 `push` 同一 id 须先 `pop` 到该层或拒绝并记录 `UI_ROUTE_ALREADY_ACTIVE`。

### 决策：难度与 RunSeed
- 选关屏点击 `Level1Btn`/`Level2Btn`/`Level3Btn` 时，Controller 构造 `RunSeed`（调用 `MetaFlowController` 或种子工厂），并将 `difficulty` 编码进种子派生字段（见 `INTERFACES.md` 的 `PreRunPayload`）。
- 三按钮对应三种难度档位，数值倍率由 `run_map_rules.json` 或 `metaDefine.ts` 常量读取，不在 View 内写死。

### 决策：MapPanel 子节点挂载
- 编辑器中 `RunMapPanel` 下的占位 `MapNode` 实例在运行时**必须移除或隐藏**，所有节点均由 `prefabs/UIItem/MapNode.lh` 实例化并 `addChild` 到名为 `MapPanel` 的容器下。
- `LineNode` 实例挂载在 `MapPanel` 上，且 **zOrder 低于** 同批 `MapNode`，保证连线在节点下方。
- `LineNode` 的 `MovedlineNode` 子节点表示已走过路径；当边两端节点均在 `visited` 集合中时显示该子节点。

### 决策：网格布局坐标系
- 每个 `RunNode` 携带 `gridCol`（0…`RUN_MAP_GRID_COLS-1`）与 `gridRow`（0=底层入口，最大行=Boss）。
- **X** = `RUN_MAP_MARGIN_X + gridCol * cellW`；**Y** = `panelHeight - RUN_MAP_MARGIN_Y - gridRow * RUN_MAP_GRID_CELL_H`。
- 生成器在网格行之间连边，并校验入口→Boss 可达。
- **路径线**：仅 `traversedEdges` 中的边显示 `MovedlineNode`。
- **图标**：`MapNodeIconUtil` 按 `RunNodeType` 加载 `atlas/UIPng/MapIcon/*.png`，尺寸固定为 `RUN_MAP_NODE_SIZE`。

### 决策：MapPanel 滚动实现
- 在 `MapPanel` 外包一层 `scrollRoot`（代码创建 `Area2D` 或 `GBox`），裁剪视口为跑图屏中间卷轴区域（与预制体中背景镂空一致）。
- 监听 `MapPanel` 或其父级的 `MOUSE_DOWN`/`MOUSE_MOVE`/`MOUSE_UP` 实现拖动；监听 `MOUSE_WHEEL` 改变 `MapPanel.y`（或 `scrollRoot` 的滚动偏移），并 clamp 到 `[minScroll, maxScroll]`。
- 进入跑图屏时，将滚动偏移对准 `currentNodeId` 所在层，使当前节点落在视口内下半区（玩家自下而上选路的习惯）。

## Risks / Trade-offs
- **风险：`RunMapPanel` 占位节点与运行时实例冲突** → **缓解**：`RunMapPanelView.initialize` 清理名为 `MapNode` 的编辑器占位子节点。
- **风险：UI2 事件与 2D 场景抢焦点** → **缓解**：滚动与点击仅在 `MapPanel` 子树内处理；全屏按钮使用独立层级。
- **风险：与 `add-meta-flow-run-map-spellcraft` 并行开发接口漂移** → **缓解**：仅通过 `INTERFACES.md` 中列出的类型与方法集成；变更合入前对照该文档做契约检查。

## Migration Plan
- 入口增加编译期或运行时开关 `META_MENU_ENABLED`（定义于 `metaDefine.ts`）：为 `true` 时 `Main.ts` 调用 `MetaMenuBootstrap`；为 `false` 时保持现有 `SimpleEcsDemo` 直进战斗行为。
- 三屏 Controller 在 `MetaMenuBootstrap.registerRoutes` 中集中注册，与 `RestartPanelController` 注册方式一致。

## Open Questions
- **战斗入口时机**：默认约定玩家点击**可达** `MapNode` 且节点类型为 `Combat` 或 `Elite` 时，Controller 调用 `MetaFlowController.goto('Combat', payload)` 并 `hide` 跑图屏（不 `pop`，战斗结束回到跑图时 `show` 同一 Controller）。若节点为 `Campfire`/`Shop`，首版仅更新 `RunMapState` 不切换元视图。
- **整图三 Act 同屏**：首版只渲染 `RunMapState.graph.acts[currentActIndex]`；`currentActIndex` 由状态机维护，Act 切换时整图重绘 MapPanel 子树。
