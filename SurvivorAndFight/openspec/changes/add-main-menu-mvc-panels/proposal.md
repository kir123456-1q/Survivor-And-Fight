# Change: 主菜单三屏 MVC 与跑图 MapPanel 视图

## Why
项目已具备 `UIStackManager`、`UiControllerBase` 与 `RestartPanel` 参考实现，且 `assets/prefabs/MainUI/` 下已放置 `StartPanel`、`SelectLevelPanel`、`RunMapPanel` 及 `MapNode`、`LineNode` 预制体，但缺少将上述资源接入元游戏流程的确定性规格。须定义基于 MVC 的界面导航、按钮绑定、跑图节点/连线的动态挂载与 MapPanel 纵向滚动，使启动到选关再到跑图的路径可验收，并与 `add-meta-flow-run-map-spellcraft` 的数据契约对齐。

## What Changes
- 新增 `meta-menu-ui` 能力规格：三屏 MVC 模块（Model / View / Controller）、路由 id、预制体路径常量、按钮事件与 `UIStackManager` 入栈/出栈规则。
- 新增 `run-map-panel-ui` 能力规格：`RunMapPanel` 下 `MapPanel` 的动态 `MapNode` / `LineNode` 实例化、节点点击与 `RunMapState` 对接、纵向拖动与滚轮滚动、底→顶布局约定。
- 新增 `MetaMenuBootstrap`：应用启动后 `push` 开始界面；不修改 `SimpleEcsDemo` 战斗调试入口的既有行为，元菜单入口由独立引导类注册。
- 在 `src/defines/uiDefine.ts` 扩展主菜单预制体路径与路由 id 常量；难度选择写入 `RunSeed` 派生参数（见 `INTERFACES.md`）。
- 与 `add-meta-flow-run-map-spellcraft` 的关系：本变更只负责 UI 层与栈导航；`RunMapGenerator`、`RunMapState`、`MetaFlowController.goto` 由该变更提供，本变更通过接口消费，不重复定义跑图生成算法。

## Impact
- Affected specs（新增 delta）：`meta-menu-ui`、`run-map-panel-ui`
- Affected specs（依赖，不在本变更目录修改）：`ui-mvc-lifecycle`、`ui-stack-management`、`meta-game-shell`、`roguelite-run-map`（`add-meta-flow-run-map-spellcraft`）
- Affected code（计划落点）：
  - `src/game/ui/meta/*`：Start / SelectLevel / RunMap 的 Model、View、Controller
  - `src/game/ui/meta/MetaMenuBootstrap.ts`：路由注册与启动 `push`
  - `src/game/ui/runmap/*`：`RunMapPanelView`、节点/连线布局与滚动
  - `src/defines/uiDefine.ts`：预制体路径、路由 id、节点名常量
  - `src/Main.ts` 或等价入口：调用 `MetaMenuBootstrap`（与战斗场景并存策略见 `design.md`）
- 预制体（已存在，实现阶段仅校验节点名，不要求改 `.lh` 结构）：
  - `assets/prefabs/MainUI/StartPanel.lh` — `StartBtn`
  - `assets/prefabs/MainUI/SelectLevelPanel.lh` — `EscBtn`、`Level1Btn`、`Level2Btn`、`Level3Btn`
  - `assets/prefabs/MainUI/RunMapPanel.lh` — `BackBtn`、`MapPanel`
  - `assets/prefabs/UIItem/MapNode.lh`、`assets/prefabs/UIItem/LineNode.lh`

## 新建文件清单

| 路径 | 职责 |
|------|------|
| `openspec/changes/add-main-menu-mvc-panels/INTERFACES.md` | 路由 id、Payload、View 对外方法、与 `MetaFlowController` 边界 |
| `openspec/changes/add-main-menu-mvc-panels/design.md` | MVC 分层、栈导航图、MapPanel 坐标系与滚动方案 |
| `src/game/ui/meta/MetaMenuBootstrap.ts` | 注册三屏 Controller 并启动 `StartPanel` |
| `src/game/ui/meta/StartPanelModel.ts` | 开始屏无状态或占位模型 |
| `src/game/ui/meta/StartPanelView.ts` | 加载 `StartPanel.lh`，绑定 `StartBtn` |
| `src/game/ui/meta/StartPanelController.ts` | 处理开始 → `push` 选关屏 |
| `src/game/ui/meta/SelectLevelPanelModel.ts` | 当前选中难度 `1 \| 2 \| 3` |
| `src/game/ui/meta/SelectLevelPanelView.ts` | 加载选关预制体，绑定四个按钮 |
| `src/game/ui/meta/SelectLevelPanelController.ts` | Esc 出栈；Level 按钮确认并 `push` 跑图屏 |
| `src/game/ui/meta/RunMapPanelController.ts` | 跑图屏 Controller，持有 `RunMapPanelView` |
| `src/game/ui/runmap/RunMapPanelView.ts` | MapPanel 子树、滚动、节点/连线刷新 |
| `src/game/ui/runmap/RunMapPanelModel.ts` | 绑定 `RunMapState` 与难度 |
| `src/game/ui/runmap/MapNodeView.ts` | 单节点视觉与点击（可选独立文件） |
| `src/game/ui/runmap/LineNodeView.ts` | 单连线视觉与已走过样式（可选独立文件） |
| `src/game/ui/runmap/RunMapLayout.ts` | 层→Y、节点→X 的布局计算 |

对外接口以 `INTERFACES.md` 为权威说明。
