## ADDED Requirements

### Requirement: MapPanel 下动态挂载 MapNode 与 LineNode
跑图 View SHALL 将 `prefabs/UIItem/MapNode.lh` 与 `prefabs/UIItem/LineNode.lh` 实例化并添加到 `RunMapPanel` 内名为 `MapPanel` 的容器节点下；编辑器内占位用的 `MapNode` 子节点在首次 `refreshGraph` 前 SHALL 被移除或设为不可见。

#### Scenario: 按 RunGraph 生成节点
- **WHEN** `RunMapPanelView.refreshGraph` 在有效的 `RunMapState` 上执行
- **THEN** `MapPanel` 下 SHALL 存在与当前 Act 内 `RunNode` 数量相等的 `MapNode` 实例
- **AND** 每个实例 SHALL 可通过 `nodeId` 映射到图节点 id

#### Scenario: 按边生成连线
- **WHEN** 当前 Act 的层间边非空
- **THEN** `MapPanel` 下 SHALL 为每条边实例化一个 `LineNode`
- **AND** 连线视觉端点 SHALL 对齐对应两个 `MapNode` 的中心

### Requirement: 全图可达 Boss
跑图生成器 SHALL 保证当前 Act 内从入口节点出发，存在至少一条有向路径可达 Boss 节点；生成失败 SHALL 重 roll 直至成功或达到 `RUN_MAP_GENERATION_MAX_RETRIES` 后使用 fallback 图。

#### Scenario: 入口到 Boss 可达
- **WHEN** `RunMapGenerator` 返回图结构
- **THEN** BFS/DFS SHALL 证实从入口节点可达 Boss 节点

### Requirement: MapNode 类型图标与按钮尺寸一致
`MapNode` 的 `normal`/`over`/`down` 子图 SHALL 按节点类型加载下列资源，且宽高 SHALL 与 `GButton` 一致（默认 75×75，禁止拉伸溢出）：

| `RunNodeType` | 资源路径 |
|---------------|----------|
| `Boss` | `atlas/UIPng/MapIcon/BossIcon.png` |
| `Treasure` | `atlas/UIPng/MapIcon/GoldenIcon.png` |
| `Rest` | `atlas/UIPng/MapIcon/RestIcon.png` |
| `Combat` | `atlas/UIPng/MapIcon/NormalMonsterIcon.png` |
| `Unknown` | `atlas/UIPng/MapIcon/UnKnownIcon.png` |

#### Scenario: 普通战斗房图标
- **WHEN** 节点类型为 `Combat`
- **THEN** `MapNode` 三态皮肤 SHALL 使用 `NormalMonsterIcon.png`
- **AND** 按钮 `width`/`height` SHALL 等于图标显示尺寸

### Requirement: MapPanel 拖动与滚轮滚动
系统 SHALL 在跑图屏显示期间响应 `MapPanel` 区域上的拖动与全局滚轮事件以平移 `MapPanel`；实现 SHALL NOT 向 `localToGlobal` 传入无 `setTo` 方法的普通对象。

#### Scenario: 滚轮纵向滚动
- **WHEN** 跑图屏可见且触发 `MOUSE_WHEEL`
- **THEN** `MapPanel.y` SHALL 按滚轮增量变化并 clamp 到合法范围

#### Scenario: 拖动平移
- **WHEN** 玩家在 `MapPanel` 上按下并拖动
- **THEN** `MapPanel` SHALL 随指针纵向位移直至释放

### Requirement: 路径连线高亮规则
`LineNode` 的 `MovedlineNode` 默认 SHALL 为 `visible=false`；仅当存在一次成功的 `selectNext`，且该边为 **本次选择前的 `currentNodeId` → 所选 `nodeId`** 的有向边时，对应 `LineNode.MovedlineNode` SHALL 设为 `visible=true`。

#### Scenario: 选中节点后显示路径线
- **WHEN** 玩家从节点 A 成功 `selectNext` 到节点 B
- **THEN** 边 A→B 的 `MovedlineNode` SHALL 显示
- **AND** 未经过的边 SHALL 保持隐藏

#### Scenario: 未选择边保持隐藏
- **WHEN** 边两端节点均在 `visited` 但该边不在 `traversedEdges` 中
- **THEN** `MovedlineNode` SHALL 仍为隐藏

### Requirement: MapNode 点击与可达性
玩家 SHALL 仅能点击 `RunMapState.availableNext` 中包含的节点 id（或开局确认阶段的 `currentNodeId`）；点击后 Controller SHALL 调用 `selectNext`。

#### Scenario: 非法点击拒绝
- **WHEN** 玩家点击既非 `currentNodeId` 也不在 `availableNext` 的节点
- **THEN** `selectNext` SHALL 返回失败且 `RunMapState` 不变

### Requirement: 开局仅可选底层起点
`RunMapState` 创建后 SHALL 处于 `awaitingStartConfirm=true`；此阶段 `availableNext` SHALL 为空，且仅 `currentNodeId`（Act 内 `gridRow` 最小节点）可点击；玩家点击该起点后 SHALL 将 `awaitingStartConfirm` 置为 `false` 并解锁上一层后继节点。

#### Scenario: 开局仅底层起点可点
- **WHEN** 跑图屏首次展示且尚未确认出发
- **THEN** 仅底层起点 `MapNode` 的 `mouseEnabled` SHALL 为 true
- **AND** 其余节点 SHALL 为不可点击态

#### Scenario: 确认出发后解锁上一层
- **WHEN** 玩家点击底层起点且 `selectNext` 成功
- **THEN** `awaitingStartConfirm` SHALL 变为 false
- **AND** `availableNext` SHALL 仅包含该起点在图中的直接后继节点

#### Scenario: 点击可达节点
- **WHEN** 玩家点击 `availableNext` 内的 `MapNode` 且 `selectNext` 成功
- **THEN** View SHALL `refreshGraph` 并更新路径线与图标状态

### Requirement: 房间类型与战斗入口
`Boss`、`Combat`、`Treasure` 节点在成功 `selectNext` 后 SHALL 触发 `MetaFlowController.goto('Combat')`；`Rest` 节点 SHALL 仅更新跑图状态（首版不进入战斗，预留 10s 自动完成钩子）。

#### Scenario: Boss 房进入战斗
- **WHEN** 玩家选择可达的 `Boss` 节点且 `selectNext` 成功
- **THEN** 系统 SHALL 进入战斗元视图
- **AND** 击杀完成后 SHALL 调用 `advanceActAfterBoss` 进入下一大关（由 `MetaRunSession` 协调）

## MODIFIED Requirements

### Requirement: 网格交点布局
跑图节点 SHALL 放置在离散网格交点上；`RunNode` SHALL 携带 `gridCol` 与 `gridRow`（`gridRow` 0 为底层入口，最大值为 Boss 层）；布局 SHALL 根据当前 Act 实际最小/最大行列，将节点**中心**均匀映射到 `MapPanel` 内容区内，且视觉边界完全落在 `MapPanel` 的 `width`×`height` 内。

#### Scenario: 节点不超出 MapPanel
- **WHEN** `layoutActNodes` 完成
- **THEN** 任意节点中心坐标 SHALL 满足 `margin + nodeSize/2 <= x <= panelWidth - margin - nodeSize/2`
- **AND** 任意节点中心坐标 SHALL 满足 `margin + nodeSize/2 <= y <= panelHeight - margin - nodeSize/2`

#### Scenario: Boss 位于最上层行
- **WHEN** 当前 Act 渲染完成
- **THEN** 类型为 `Boss` 的节点 `gridRow` SHALL 等于该 Act 最大行索引
- **AND** 其本地 Y SHALL 小于所有非 Boss 行节点

#### Scenario: 同层节点列不重叠
- **WHEN** 同一 `gridRow` 存在多个节点
- **THEN** 各节点 `gridCol` SHALL 互不相同

### Requirement: 底到顶纵向布局
跑图布局 SHALL 使用网格 `gridRow` 映射 Y 轴（`gridRow` 大在上、小在下）。

#### Scenario: 层序与 Y 轴方向
- **WHEN** 节点 A 的 `gridRow` 小于节点 B
- **THEN** A 的本地 Y SHALL 大于 B（A 更靠下）

### Requirement: LineNode 几何布局
`LineNode` SHALL 以**左端锚点**对齐起点节点中心，长度 SHALL 等于两节点中心间距减去节点尺寸补偿，禁止以中点放置后再 `scaleX` 导致长度翻倍。

#### Scenario: 连线长度与节点间距一致
- **WHEN** 渲染边 A→B
- **THEN** 线段视觉长度 SHALL 不大于两节点中心直线距离
- **AND** 线段起点 SHALL 与 A 的中心重合（允许 ≤`RUN_MAP_NODE_SIZE/2` 误差）
