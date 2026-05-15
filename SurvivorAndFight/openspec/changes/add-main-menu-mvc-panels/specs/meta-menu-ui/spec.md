## ADDED Requirements

### Requirement: 主菜单预制体路径与路由注册
系统 SHALL 在 `src/defines/uiDefine.ts` 中声明 `StartPanel`、`SelectLevelPanel`、`RunMapPanel` 的预制体路径常量及对应 `UIStackManager` 路由 id；`MetaMenuBootstrap.registerRoutes` SHALL 为三个路由各注册一个 `UiControllerBase` 工厂。

#### Scenario: 启动时注册三屏路由
- **WHEN** `MetaMenuBootstrap.registerRoutes` 执行完成
- **THEN** `UIStackManager` SHALL 能通过 `start-panel`、`select-level-panel`、`run-map-panel` 三个 id 创建 Controller

#### Scenario: 预制体路径与 assets 一致
- **WHEN** 加载开始界面 View
- **THEN** 使用的路径 SHALL 为 `prefabs/MainUI/StartPanel.lh`
- **AND** 选关与跑图屏路径 SHALL 分别为 `prefabs/MainUI/SelectLevelPanel.lh` 与 `prefabs/MainUI/RunMapPanel.lh`

### Requirement: 启动后显示开始界面
当 `META_MENU_ENABLED` 为真且应用完成初始化时，系统 SHALL 通过 `UIStackManager.push('start-panel')` 显示开始界面；开始界面 SHALL 绑定名为 `StartBtn` 的控件的点击事件。

#### Scenario: 元菜单模式启动
- **WHEN** 应用入口启用元菜单且 Bootstrap 完成
- **THEN** 栈顶 Controller 的 id SHALL 为 `start-panel`
- **AND** `StartPanel` 预制体实例 SHALL 处于 Shown 状态

#### Scenario: StartBtn 进入选关
- **WHEN** 玩家点击 `StartBtn`
- **THEN** 系统 SHALL `push` 路由 `select-level-panel`
- **AND** 开始界面 Controller SHALL 进入 Hidden
- **AND** 选关界面 Controller SHALL 进入 Shown

### Requirement: 选关界面按钮与返回
选关界面 SHALL 绑定 `EscBtn`、`Level1Btn`、`Level2Btn`、`Level3Btn`；`EscBtn` SHALL 返回开始界面；三个 Level 按钮 SHALL 分别对应难度 `1`、`2`、`3` 并进入跑图界面。

#### Scenario: Esc 返回开始界面
- **WHEN** 玩家在选关界面点击 `EscBtn` 且栈顶为 `select-level-panel`
- **THEN** 系统 SHALL `pop` 选关屏
- **AND** 开始界面 SHALL 恢复 Shown

#### Scenario: 选择难度进入跑图
- **WHEN** 玩家点击 `Level2Btn`
- **THEN** 系统 SHALL 生成携带 `difficulty: 2` 的 `RunMapPanelPayload`
- **AND** SHALL `push` 路由 `run-map-panel` 并传入该 payload
- **AND** SHALL 派发 `ui.meta.level.selected` 事件

### Requirement: 主菜单 MVC 职责分离
开始界面、选关界面、跑图界面的 Controller、View、Model SHALL 遵循 `ui-mvc-lifecycle`：View 不得直接修改 `RunMapState` 或调用 `MetaFlowController`；用户输入 SHALL 由 Controller 处理并驱动栈或领域服务。

#### Scenario: View 仅转发点击
- **WHEN** `SelectLevelPanelView` 收到 `Level1Btn` 点击
- **THEN** View SHALL 仅调用 Controller 注入的回调
- **AND** View SHALL NOT 执行 `UIStackManager.push`

#### Scenario: 未初始化不得显示
- **WHEN** 对尚未 `initialize` 的 `StartPanelController` 调用 `show`
- **THEN** 系统 SHALL 拒绝并符合 `UiControllerBase` 抛错约定

### Requirement: 跑图屏返回选关
跑图界面 SHALL 绑定 `BackBtn`；点击后 SHALL 从栈中移除跑图屏并恢复选关屏，且不得销毁尚未结束的 `RunMapState` 实例（由 Controller/Model 持有至选关确认新开局或显式重置）。

#### Scenario: Back 返回选关
- **WHEN** 玩家在跑图界面点击 `BackBtn` 且栈顶为 `run-map-panel`
- **THEN** 系统 SHALL `pop` 跑图屏
- **AND** 选关界面 SHALL 恢复 Shown
