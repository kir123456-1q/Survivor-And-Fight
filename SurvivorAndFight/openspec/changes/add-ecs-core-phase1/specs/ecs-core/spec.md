## ADDED Requirements

### Requirement: ECS 核心内核与实体管理（第 1 期 MVP）
系统 SHALL 提供一个轻量、单线程的 ECS 核心，用于管理少量实体（数量级：几十到几百）及其组件与系统更新，为后续性能优化阶段打基础。

#### Scenario: Entity 使用数字 ID 标识并可复用
- **WHEN** 游戏运行过程中创建多个 Entity
- **THEN** 每个 Entity SHALL 使用 `number` 类型的唯一 ID 标识  
- **AND** 系统 SHALL 支持在 Entity 被销毁后复用其 ID，避免 ID 无限增长

#### Scenario: 支持创建与销毁 Entity
- **WHEN** 调用创建实体的 API
- **THEN** 系统 SHALL 分配一个新的 EntityId 并将其纳入管理
- **AND** 系统 SHALL 能够在销毁实体时移除其所有组件并从内部索引中清理

#### Scenario: 查询 Entity 拥有的组件类型
- **WHEN** 调用查询某个 Entity 拥有组件的接口
- **THEN** 系统 SHALL 能够返回该 Entity 当前绑定的组件类型列表（或等效查询能力）

### Requirement: Component 类型与存储模型（第 1 期 MVP）
系统 SHALL 提供以数据为中心的 Component 模型，并按组件类型组织存储，以便按组件维度高效遍历和操作。

#### Scenario: 以组件类型为维度的存储结构
- **WHEN** 为某个 Entity 添加某种组件类型
- **THEN** 系统 SHALL 将该组件实例存储在与该组件类型对应的容器中（例如：稠密数组或 Map）
- **AND** 该容器 SHALL 支持通过 EntityId 访问或定位对应组件实例

#### Scenario: 按组件类型遍历实体
- **WHEN** 需要在某个 System 中遍历所有拥有特定组件组合的实体
- **THEN** 系统 SHALL 至少提供按单一组件类型遍历的能力  
- **AND** 在设计上 SHALL 预留扩展点，以便后续支持多组件组合查询或更复杂的内存布局

#### Scenario: 组件的添加与移除
- **WHEN** 为某个 Entity 添加组件
- **THEN** 系统 SHALL 在该组件类型的存储容器中建立条目，并更新 Entity 的组件集合信息
- **AND** 当移除组件时 SHALL 从存储容器与 Entity 的组件集合中同步移除

### Requirement: System 注册与更新循环（第 1 期 MVP）
系统 SHALL 提供可注册的 System 抽象以及确定性的更新顺序，并与 Laya 主循环集成。

#### Scenario: System 接口与依赖注入
- **WHEN** 定义一个业务 System（例如 MovementSystem）
- **THEN** System SHALL 至少暴露一个形如 `update(deltaTime: number)` 的更新接口
- **AND** System SHALL 通过构造参数或注入方式获取所需的 `EntityManager` 或查询入口

#### Scenario: System 执行顺序与分组
- **WHEN** 注册多个 Systems
- **THEN** 系统 SHALL 支持通过简单的分组和优先级（例如：输入 → 逻辑 → 物理 → 视图同步）的概念来控制执行顺序  
- **AND** 第 1 期可以以“顺序列表 + 可选优先级”的实现满足该需求

#### Scenario: 在 Laya 主循环中挂接 ECS 更新
- **WHEN** Laya 的主循环或帧更新事件触发
- **THEN** 系统 SHALL 提供统一的 `world.update(deltaTime)`（或等价命名）入口  
- **AND** 所有已注册的 Systems SHALL 在该入口内部按定义好的顺序依次执行

