## ADDED Requirements

### Requirement: 攻击技能释放子弹并携带子弹表属性
系统 SHALL 在攻击技能释放时，根据技能/effect 的 bulletSlot 从子弹表读取预制体路径与属性（持续时间、速度、伤害、穿透），生成子弹实例并设置来源阵营。

#### Scenario: 从 bulletSlot 与子弹表生成子弹
- **WHEN** 技能或 effect 配置了 bulletSlot（子弹表 id）
- **THEN** 释放时系统 SHALL 从子弹表（如 Data.Bullet.GetByID(id)）取得 prefabPath、duration、speed、damage、penetration、ownerType
- **AND** 系统 SHALL 实例化该预制体作为子弹节点，并应用上述属性（飞行速度、生命周期、碰撞伤害、穿透次数）
- **AND** 子弹的 ownerType SHALL 与释放者实体一致（玩家实体→player，怪物实体→monster）

#### Scenario: 玩家与怪物使用指定子弹预制体
- **WHEN** 配置玩家攻击技能
- **THEN** bulletSlot 对应的子弹表行 SHALL 使用预制体路径 prefabs/Common/Buttle/simple.lh
- **WHEN** 配置怪物攻击技能
- **THEN** bulletSlot 对应的子弹表行 SHALL 使用预制体路径 prefabs/Common/Buttle/MonsterButtle.lh
- **AND** 上述路径写入 JSON 配表，由读表与子弹系统加载
