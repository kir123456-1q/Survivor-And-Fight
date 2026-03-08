## ADDED Requirements

### Requirement: 角色表与子弹表结构（初步功能验证）
系统 SHALL 提供角色表（Character）与子弹表（Bullet）的 JSON 配表结构及模板，用于驱动玩家/怪物预制体、Body UI、子弹预制体路径及血量与子弹属性。

#### Scenario: 角色表含预制体与血量
- **WHEN** 配置角色表
- **THEN** 每行 SHALL 包含：prefabPath（角色预制体路径，如 prefabs/character/Player.lh）、bodyPrefabPath（Body UI 预制体路径，如 prefabs/SceneUI/PlayerBody.lh）、hp、maxHp（基础血量与上限）
- **AND** 每行 SHALL 包含 roleType（player 或 monster）或等效字段，用于区分阵营与筛选
- **AND** 可选 bulletPrefabPath 或由技能/effect 的 bulletSlot 指定子弹；若表内指定则作为默认子弹预制体

#### Scenario: 子弹表含飞行与伤害属性
- **WHEN** 配置子弹表
- **THEN** 每行 SHALL 包含：prefabPath（子弹预制体路径，如 prefabs/Common/Buttle/simple.lh）、duration（持续时间，秒）、speed（飞行速度）、damage（伤害值）、penetration（穿透次数，0 表示命中即消失）
- **AND** 每行 SHALL 包含 ownerType（player 或 monster），用于碰撞时仅对目标阵营生效
- **AND** 配表 SHALL 与 tables.registry 注册的 Data 读表方式兼容（如 Data.Bullet.GetByID(id)）

#### Scenario: 配表模板与注册
- **WHEN** 项目接入角色与子弹功能
- **THEN** 须提供 Character、Bullet 的 JSON 配表模板（字段说明与示例行）
- **AND** tables.registry.json 须注册 Character、Bullet 表及对应 sources、idKey
