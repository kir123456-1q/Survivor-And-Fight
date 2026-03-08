## ADDED Requirements

### Requirement: Body UI 与血条节点约定
系统 SHALL 约定角色 Body 预制体内的血条结构，并支持通过节点路径定位到须更新的 ProgressBar。

#### Scenario: 血条位于 BloodBar 下的 ProgressBar
- **WHEN** 角色使用 Body 预制体（如 prefabs/SceneUI/PlayerBody.lh、MonsterBody.lh）
- **THEN** Body 内 SHALL 存在节点层级 BloodBar > ProgressBar（或文档约定的等效路径）
- **AND** 系统 SHALL 通过该路径从 Body 实例查找 ProgressBar 组件，用于显示血量进度

#### Scenario: 玩家与怪物 Body 及血条位置一致
- **WHEN** 创建玩家或怪物实体并绑定 Body UI
- **THEN** 玩家与怪物使用各自的 Body 预制体（PlayerBody.lh、MonsterBody.lh），血条在 Body 内的位置与主角一致（同一套 UI 布局约定）
- **AND** 实体与 Body 实例的绑定须可被血条同步逻辑查询（如通过 ViewComponent 或专用 BodyUI 组件）

### Requirement: 血条 ProgressBar 与 Attribute 同步
系统 SHALL 将实体 Attribute 的 hp、maxHp 同步到其 BloodBar 下 ProgressBar 的 value，使血条随血量变化更新。

#### Scenario: 按 hp 与 maxHp 更新 ProgressBar
- **WHEN** 实体拥有 Attribute 且已绑定带 BloodBar/ProgressBar 的 Body
- **THEN** 系统 SHALL 在每帧或属性变更时，将 ProgressBar.value 设为 hp / maxHp（范围 0–1）
- **AND** 当 maxHp 为 0 时 SHALL 按 1 处理，避免除零
- **AND** 须更新的是 BloodBar 下的 ProgressBar，不得更新其他无关 UI 组件

#### Scenario: 碰撞扣血后血条更新
- **WHEN** 子弹碰撞对目标实体扣减 hp 后
- **THEN** 该实体的血条 ProgressBar SHALL 在下一帧或同一帧内反映新的 hp/maxHp 比例
- **AND** 与 AttributeSystem 的 hp 写入顺序兼容（先写 Attribute 再同步 UI）
