# Tasks: add-main-menu-mvc-panels

依赖：`add-mvc-ui-stack-redpoint-pooling`（`UIStackManager`、`UiControllerBase` 已落地）；`add-meta-flow-run-map-spellcraft` 的 `RunMapState` / `MetaFlowController` 可先用 Stub，签名与 `INTERFACES.md` 一致。

## 1. 常量与引导
- [ ] 1.1 在 `uiDefine.ts` 增加三屏预制体路径、路由 id、`MapPanel`/`StartBtn` 等节点名常量
- [ ] 1.2 在 `metaDefine.ts` 增加 `META_MENU_ENABLED` 与难度相关常量
- [ ] 1.3 实现 `MetaMenuBootstrap.registerRoutes` 与 `start`；在 `Main.ts` 按开关调用

## 2. 开始界面 MVC
- [ ] 2.1 实现 `StartPanelModel` / `StartPanelView` / `StartPanelController`
- [ ] 2.2 `StartPanelView` 绑定 `StartBtn`，点击后 `push(select-level-panel)`
- [ ] 2.3 验证生命周期：initialize → show → hide → dispose

## 3. 选关界面 MVC
- [ ] 3.1 实现 `SelectLevelPanelModel`（`difficulty`）/ `View` / `Controller`
- [ ] 3.2 绑定 `EscBtn` → `pop`；`Level1Btn`/`Level2Btn`/`Level3Btn` → 生成 `RunSeed` 与 `RunMapState` 后 `push(run-map-panel, payload)`
- [ ] 3.3 派发 `ui.meta.level.selected`

## 4. 跑图视图
- [ ] 4.1 实现 `RunMapLayout`（层→Y、节点→X、边→线段变换）
- [ ] 4.2 实现 `RunMapPanelView`：清理占位节点、实例化 `MapNode`/`LineNode`、`refreshGraph`
- [ ] 4.3 实现 `MapPanel` 视口裁剪、拖动与滚轮滚动及 `setScrollToNode`
- [ ] 4.4 实现 `RunMapPanelModel` / `RunMapPanelController`：绑定 `BackBtn`、节点点击 → `selectNext`、战斗节点 → `goto(Combat)`

## 5. 集成与验收
- [ ] 5.1 手测完整路径：启动 → 开始 → 选关 → 跑图 → Back → Esc → 再选关
- [ ] 5.2 手测跑图：仅可达节点可推进；已访问边显示 `MovedlineNode`；滚轮/拖动有效
- [ ] 5.3 运行 `openspec validate add-main-menu-mvc-panels --strict --no-interactive`
- [ ] 5.4 合入前将 `INTERFACES.md` 复制到 `docs/add-main-menu-mvc-panels-interfaces.md`
