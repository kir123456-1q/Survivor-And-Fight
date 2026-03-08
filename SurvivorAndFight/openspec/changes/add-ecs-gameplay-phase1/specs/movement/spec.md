## ADDED Requirements

### Requirement: 移动组件
系统 SHALL 提供表示位置与速度等移动相关数据的组件，仅存数据、不含逻辑，与 ECS 按类型存储兼容。

#### Scenario: 位置与速度组件可挂载到实体
- **WHEN** 为实体添加移动能力
- **THEN** 系统 SHALL 提供至少 Position（或等价命名）与 Velocity 组件
- **AND** 组件 SHALL 按 ecs-core 的组件存储模型存储，支持按 EntityId 访问

#### Scenario: 移动组件可被筛选器与系统遍历
- **WHEN** MovementSystem 或筛选器需要所有“可移动”实体
- **THEN** 系统 SHALL 支持按“拥有 Position 与 Velocity”等组件组合进行查询或遍历
- **AND** 与 ecs-core 的按组件类型遍历能力一致

### Requirement: 移动系统
系统 SHALL 提供 MovementSystem，每帧根据速度等数据更新位置，与 Laya 主循环中的 ECS 更新顺序一致。

#### Scenario: 每帧根据速度更新位置
- **WHEN** 某实体拥有 Position 与 Velocity 组件且 MovementSystem 执行
- **THEN** 系统 SHALL 在该帧内根据 Velocity 与 deltaTime 更新该实体的 Position
- **AND** 更新顺序 SHALL 在 ECS 的 System 调度中确定，若存在 ViewSync 则 Movement 应在视图同步之前执行

#### Scenario: 仅更新具备移动组件的实体
- **WHEN** MovementSystem 执行 update(deltaTime)
- **THEN** 系统 SHALL 仅遍历拥有移动所需组件组合的实体并更新其位置
- **AND** 不修改不满足该组合的实体
