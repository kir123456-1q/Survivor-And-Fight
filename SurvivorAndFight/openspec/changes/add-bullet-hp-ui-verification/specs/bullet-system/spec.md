## ADDED Requirements

### Requirement: 子弹实例化与飞行
系统 SHALL 根据配表（子弹表）实例化子弹预制体，子弹搭载碰撞体，并按 speed 与 duration 进行飞行与生命周期管理。

#### Scenario: 从配表加载子弹预制体并生成实例
- **WHEN** 技能释放需要生成子弹
- **THEN** 系统 SHALL 根据 bulletSlot（或角色表默认子弹）从子弹表取得 prefabPath（如 prefabs/Common/Buttle/simple.lh、MonsterButtle.lh）
- **AND** 系统 SHALL 加载该预制体并生成场景中的子弹节点，子弹预制体须搭载碰撞体
- **AND** 子弹实例须携带从表读取的 duration、speed、damage、penetration、ownerType

#### Scenario: 飞行与超时销毁
- **WHEN** 子弹已生成并每帧更新
- **THEN** 系统 SHALL 按 speed 沿发射方向移动子弹
- **AND** 超过 duration 后 SHALL 销毁或回收子弹节点

### Requirement: 子弹碰撞仅对目标阵营生效
系统 SHALL 在子弹与场景实体发生碰撞时，根据子弹来源阵营与目标实体类型过滤：玩家子弹仅对怪物实体生效，怪物子弹仅对玩家实体生效。

#### Scenario: 玩家子弹仅对怪物造成伤害
- **WHEN** 子弹的 ownerType 为 player 且碰撞到带 MonsterTag 的实体
- **THEN** 系统 SHALL 对该实体结算伤害（扣 Attribute.base.hp，数值为子弹 damage）
- **AND** 系统 SHALL 扣减该子弹的穿透次数；穿透为 0 时移除子弹
- **WHEN** 同一颗玩家子弹碰撞到带 PlayerTag 的实体
- **THEN** 系统 SHALL 不结算伤害，不扣血

#### Scenario: 怪物子弹仅对玩家造成伤害
- **WHEN** 子弹的 ownerType 为 monster 且碰撞到带 PlayerTag 的实体
- **THEN** 系统 SHALL 对该实体结算伤害（扣 Attribute.base.hp，数值为子弹 damage）
- **AND** 系统 SHALL 扣减该子弹的穿透次数；穿透为 0 时移除子弹
- **WHEN** 同一颗怪物子弹碰撞到带 MonsterTag 的实体
- **THEN** 系统 SHALL 不结算伤害，不扣血
