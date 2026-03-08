# ECS 实体形态约定（add-ecs-gameplay-phase1）

- **玩家实体**：拥有 `PlayerTag` 组件。典型组合：PlayerTag + Position + Velocity + Attribute + Skill + Control。
- **怪物实体**：拥有 `MonsterTag` 组件。典型组合：MonsterTag + Position + Velocity + Attribute + Skill。
- 筛选器通过“拥有 PlayerTag”/“拥有 MonsterTag”查询对应实体列表。
