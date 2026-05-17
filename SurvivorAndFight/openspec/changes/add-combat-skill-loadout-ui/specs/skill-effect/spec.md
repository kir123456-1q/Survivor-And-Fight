## ADDED Requirements

### Requirement: 装配面板打开时战斗暂停

当技能装配面板打开时，系统 SHALL 禁止战斗逻辑 System 推进，UI 与装配状态读写 SHALL 仍可执行。

#### Scenario: 暂停期间子弹不推进

- **WHEN** `SkillSelectPanel` 可见且 `GameSession.paused` 为 true
- **THEN** `BulletSystem.update` 必须立即返回且不修改子弹位置
- **AND** `MonsterChaseSystem.update` 必须立即返回

#### Scenario: 关闭面板后恢复

- **WHEN** 面板关闭且 `GameSession.paused` 为 false
- **THEN** 上述 System 必须恢复每帧更新

### Requirement: 多 Effect 槽位顺序施放

当技能通过装配绑定了多个已启用 Effect 时，`EffectExecutor` SHALL 按槽位顺序构建 `SkillCastPlan` 并由 `SkillSystem` 执行。

#### Scenario: 顺序执行 bullet 与 direct_damage

- **WHEN** 技能 effect 链为 `[bullet_effect, direct_damage_effect]` 且均为 `enabled: true`
- **THEN** 单次施放必须先完成 bullet 生成逻辑再执行直伤逻辑
- **AND** 配表缺失的 Effect 行必须跳过且不影响后续行

#### Scenario: modifier 仅作用于下一条 bullet

- **WHEN** Effect 链为 `[modifier_split, bullet]`
- **THEN** 仅紧随其后的 bullet 获得分裂参数
- **AND** 后续 bullet 不再继承该 modifier（除非再次遇到 modifier 行）

## MODIFIED Requirements

### Requirement: 攻击技能释放子弹并携带子弹表属性

系统 SHALL 在攻击技能释放时，根据技能/effect 的 bulletSlot 从子弹表读取预制体路径与属性（持续时间、速度、伤害、穿透），生成子弹实例并设置来源阵营。`bulletSlot` 与数值字段 SHALL 优先读取 `skill_effect_table` 行；若技能通过装配仅引用 Effect id 列表，则 SHALL 以装配后的 Effect 链为准，SHALL NOT 仅依赖单一默认 `player_auto_shot` 行。

#### Scenario: 从 bulletSlot 与子弹表生成子弹

- **WHEN** 技能或 effect 配置了 bulletSlot（子弹表 id）
- **THEN** 释放时系统 SHALL从子弹表（如 Data.Bullet.GetByID(id)）取得 prefabPath、duration、speed、damage、penetration、ownerType
- **AND** 系统 SHALL实例化该预制体作为子弹节点，并应用上述属性（飞行速度、生命周期、碰撞伤害、穿透次数）
- **AND** 子弹的 ownerType 必须与释放者实体一致（玩家实体→player，怪物实体→monster）

#### Scenario: 玩家与怪物使用指定子弹预制体

- **WHEN** 配置玩家攻击技能
- **THEN** bulletSlot 对应的子弹表行必须使用预制体路径 prefabs/Common/Buttle/simple.lh 或配表指定的 2D 子弹路径
- **WHEN** 配置怪物攻击技能
- **THEN** bulletSlot 对应的子弹表行必须使用预制体路径 prefabs/Common/Buttle/MonsterButtle.lh 或等价配表路径
- **AND** 上述路径写入 JSON 配表，由读表与子弹系统加载

#### Scenario: 装配 Effect 覆盖默认子弹属性

- **WHEN** `skill_effect_table` 行提供 `damage` 或 `penetration` 列
- **THEN** 生成的子弹实例必须使用配表行数值覆盖子弹表默认值
- **AND** 未提供的列必须回退到 `bullet_table` 对应字段
