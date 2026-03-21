## ADDED Requirements

### Requirement: 怪物移动模式组件
系统 SHALL 提供怪物行为模式组件，用于区分 `ranged`、`melee`、`boss` 三种移动行为并携带参数。

#### Scenario: 生成怪物时装配行为模式
- **WHEN** 怪物由刷怪流程创建
- **THEN** 系统 SHALL 根据怪物配置装配 MonsterBehavior 组件
- **AND** `mode` SHALL 为 `ranged`、`melee` 或 `boss` 之一

### Requirement: 近战小怪追击行为
系统 SHALL 支持近战小怪持续向玩家靠近的移动规则。

#### Scenario: 近战小怪朝玩家移动
- **WHEN** 怪物行为模式为 `melee` 且玩家实体存在
- **THEN** 怪物 SHALL 按配置速度朝玩家当前位置移动
- **AND** 该行为每帧持续更新直到模式切换或实体销毁

### Requirement: 远程小怪保持距离并绕圈
系统 SHALL 支持远程小怪围绕玩家的距离控制与环绕移动。

#### Scenario: 远程小怪距离控制
- **WHEN** 怪物行为模式为 `ranged`
- **THEN** 系统 SHALL 使怪物趋近 `desiredDistance` 目标距离
- **AND** 当距离接近目标时 SHALL 施加切向移动以形成绕圈轨迹

### Requirement: Boss 攻近退循环行为
系统 SHALL 支持 Boss 在 `rangedAttack`、`approach`、`retreat` 三阶段之间按固定顺序循环。

#### Scenario: Boss 阶段顺序循环
- **WHEN** 怪物行为模式为 `boss`
- **THEN** Boss 状态 SHALL 按 `rangedAttack -> approach -> retreat -> rangedAttack` 顺序切换
- **AND** 每个阶段持续时长 SHALL 由行为参数配置控制

#### Scenario: Boss 阶段驱动移动策略
- **WHEN** Boss 处于 `approach` 阶段
- **THEN** Boss SHALL 朝玩家方向移动
- **WHEN** Boss 处于 `retreat` 阶段
- **THEN** Boss SHALL 远离玩家方向移动
