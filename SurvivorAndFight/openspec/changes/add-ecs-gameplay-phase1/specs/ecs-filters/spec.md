## ADDED Requirements

### Requirement: 筛选器抽象与命名筛选
系统 SHALL 提供筛选器抽象：按“拥有哪些组件”查询 Entity 列表，并支持命名筛选器以驱动 Movement、Skill、Control 等系统。

#### Scenario: 按组件组合查询实体列表
- **WHEN** 需要获取所有“拥有指定组件组合”的实体
- **THEN** 系统 SHALL 提供筛选器接口：传入所需组件类型集合，返回满足条件的 EntityId 列表（或可迭代集合）
- **AND** 实现 SHALL 与 ecs-core 的按组件类型遍历能力对齐（可封装现有查询 API）

#### Scenario: 命名筛选器便于系统使用
- **WHEN** MovementSystem、SkillSystem、ControlSystem 等需要固定语义的实体集合
- **THEN** 系统 SHALL 提供至少以下命名筛选器（或等价语义）：Players（拥有 PlayerTag）、Monsters（拥有 MonsterTag）、Controllable（拥有 Control 组件）、可移动实体（如拥有 Position + Velocity）
- **AND** 命名筛选器 SHALL 返回与“按组件组合查询”一致的结果，便于各 System 在 update 中获取目标实体

#### Scenario: 筛选器驱动 Entity 数据迭代
- **WHEN** 某 System 使用筛选器获取实体列表
- **THEN** 系统 SHALL 能基于返回的 EntityId 访问该实体的各组件（如 Attribute、Skill、Position）
- **AND** 筛选器结果 SHALL 与当前帧的组件状态一致，不要求跨帧缓存；若实现缓存，须在适当时机刷新
