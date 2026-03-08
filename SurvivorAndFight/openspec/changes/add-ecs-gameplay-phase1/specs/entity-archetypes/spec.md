## ADDED Requirements

### Requirement: 玩家与怪物实体形态
系统 SHALL 提供通过组件组合区分“玩家实体”与“怪物实体”的约定，便于筛选器与各 System 按实体类型迭代。

#### Scenario: 玩家实体由 Tag 标识
- **WHEN** 需要表示一个由玩家控制的角色实体
- **THEN** 该实体 SHALL 拥有 PlayerTag 组件（或等价命名的 Tag 组件）
- **AND** 筛选器 SHALL 能通过“拥有 PlayerTag”查询到所有玩家实体

#### Scenario: 怪物实体由 Tag 标识
- **WHEN** 需要表示一个怪物实体
- **THEN** 该实体 SHALL 拥有 MonsterTag 组件（或等价命名的 Tag 组件）
- **AND** 筛选器 SHALL 能通过“拥有 MonsterTag”查询到所有怪物实体

#### Scenario: 实体形态与通用组件组合
- **WHEN** 创建玩家或怪物实体
- **THEN** 除 Tag 外 SHALL 可组合 Position、Attribute、Skill 等通用组件
- **AND** 文档 SHALL 约定典型组合（如 Player = PlayerTag + Position + Velocity + Attribute + Skill + Control），便于一致创建与筛选
