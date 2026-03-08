## ADDED Requirements

### Requirement: 属性组件与 Modifier 机制
系统 SHALL 在 ECS 下提供属性组件，持有基础属性与 Modifier 列表；外来 buff 可通过增删 Modifier 实现属性的可溯源变化。

#### Scenario: 属性组件持有基础属性与 Modifier 列表
- **WHEN** 为实体添加属性能力
- **THEN** 系统 SHALL 提供 Attribute 组件，其中 SHALL 包含“基础属性”键值（如 atk、hp、maxHp）
- **AND** 组件 SHALL 持有 Modifier 列表，每个 Modifier 至少包含：来源 id（如 buffId）、类型（如加算/乘算）、影响的属性名、数值
- **AND** 组件 SHALL 按 ecs-core 的组件存储模型存储

#### Scenario: 最终属性由基础值与 Modifier 合并得出且可溯源
- **WHEN** 读取某实体的某属性最终值（如 atk）
- **THEN** 系统 SHALL 按约定顺序（如先加算后乘算）将基础值与所有 Modifier 合并得到最终值
- **AND** 系统 SHALL 提供可溯源方式：能查询到该最终值由哪些 Modifier 贡献，或能按来源 id 移除/失效 Modifier

#### Scenario: 外来 buff 可增删 Modifier
- **WHEN** 外部系统（如 buff 系统）需要增加或移除对某实体某属性的修改
- **THEN** 系统 SHALL 提供向该实体 Attribute 组件添加 Modifier、以及按来源 id 或条件移除 Modifier 的 API
- **AND** 修改后 SHALL 不影响其他实体的属性，且合并逻辑 SHALL 一致可复现
