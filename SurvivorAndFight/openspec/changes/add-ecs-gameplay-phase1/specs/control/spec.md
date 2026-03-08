## ADDED Requirements

### Requirement: 操控组件
系统 SHALL 提供用于标记“由玩家控制”的实体的组件，仅存数据或标记，不含输入逻辑。

#### Scenario: Control 组件标记玩家控制实体
- **WHEN** 某实体需要接受玩家输入控制
- **THEN** 该实体 SHALL 拥有 Control 组件（或等价命名）
- **AND** 筛选器 SHALL 能通过“拥有 Control 组件”查询到所有受控实体
- **AND** 同一时刻可约定仅一个或少量实体拥有 Control（由业务或配置约定，非强制唯一）

#### Scenario: 操控组件与其它组件组合
- **WHEN** 实体拥有 Control 组件
- **THEN** 该实体 SHALL 通常同时拥有 Position、Velocity、Skill 等组件，以便操控系统写入移动意图与技能释放意图
- **AND** 文档 SHALL 约定典型组合，便于筛选器与 ControlSystem 一致使用

### Requirement: 操控系统
系统 SHALL 提供 ControlSystem，根据输入抽象将玩家操作转换为对受控实体的移动与技能释放等意图。

#### Scenario: 根据输入驱动移动意图
- **WHEN** 玩家通过键盘/摇杆等输入移动指令
- **THEN** ControlSystem SHALL 仅对拥有 Control 组件的实体（或当前选中的受控实体）写入移动意图（如写入 Velocity 或移动命令组件）
- **AND** 输入来源 SHALL 依赖输入抽象接口（如 input-abstraction），不直接依赖引擎输入 API

#### Scenario: 根据输入驱动技能释放意图
- **WHEN** 玩家通过按键或鼠标触发技能释放
- **THEN** ControlSystem SHALL 将释放技能意图写入对应受控实体的 Skill 组件或命令缓冲
- **AND** 实际 CD 与 Effect 执行由 SkillSystem 处理，ControlSystem 仅负责意图写入

#### Scenario: 使用筛选器获取受控实体
- **WHEN** ControlSystem 执行 update(deltaTime)
- **THEN** 系统 SHALL 通过筛选器（如 Controllable）获取当前应接受输入的实体列表
- **AND** 仅对这些实体应用本帧的输入状态，不修改其它实体
