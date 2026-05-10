## ADDED Requirements

### Requirement: 三大关随机跑图结构
系统 SHALL 在每局开局基于 `RunSeed` 生成跑图；跑图 SHALL 由恰好三个按序推进的大关组成；每个大关 SHALL 包含至少两层节点；图结构 SHALL 为有向无环图且存在从入口到该大关终端节点的至少一条路径。

#### Scenario: 每局三大关
- **WHEN** 新跑开始且跑图生成成功
- **THEN** `RunGraph.acts.length` SHALL 等于 3

#### Scenario: 可达性与无环
- **WHEN** 跑图生成器完成构建
- **THEN** 校验逻辑 SHALL 证实图为 DAG
- **AND** 每个大关 SHALL 至少存在一条从该大关入口层到该大关终端节点的有向路径

### Requirement: 跑图节点类型集合
跑图节点类型 SHALL 至少包含：`Campfire`、`Shop`、`Combat`、`Elite`、`Unknown`；节点类型 SHALL 由配表或枚举导出，禁止硬编码魔法字符串散落业务逻辑。

#### Scenario: 未知节点绑定载荷
- **WHEN** 节点类型为 `Unknown`
- **THEN** 节点 SHALL 携带 `payloadId` 用于解析事件或战斗模板；若事件池未配置，系统 SHALL 按设计文档 Open Questions 执行降级

### Requirement: 路线选择与状态更新
玩家 SHALL 仅能选择当前 `availableNext` 列表中的节点作为后继；非法选择 SHALL 被拒绝且不修改 `RunMapState`。

#### Scenario: 合法推进
- **WHEN** 玩家选择 `availableNext` 内的节点 id
- **THEN** `currentNodeId` SHALL 更新为该 id
- **AND** 该 id SHALL 加入已访问集合
- **AND** 系统 SHALL 派发 `run.node.selected` 事件

#### Scenario: 非法拒绝
- **WHEN** 玩家选择不在 `availableNext` 内的节点 id
- **THEN** `selectNext` SHALL 返回 `ok: false` 且状态不变

### Requirement: 战斗入口载荷
当所选节点解析为战斗类遭遇时，系统 SHALL 派发 `combat.enter` 并携带 `nodeId` 与 `payloadId`。

#### Scenario: 进入战斗
- **WHEN** 所选节点类型为 `Combat` 或 `Elite`
- **THEN** 元视图 SHALL 切换到 `Combat`
- **AND** `combat.enter` 载荷 SHALL 包含非空的战斗解析引用
