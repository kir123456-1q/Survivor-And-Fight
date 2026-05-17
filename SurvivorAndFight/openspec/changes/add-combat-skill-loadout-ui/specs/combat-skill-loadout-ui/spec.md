## ADDED Requirements

### Requirement: MainUI 三装备技能栏图标展示

系统 SHALL 在战斗 HUD 的 `SkillBaseBar1`、`SkillBaseBar2`、`SkillBaseBar3` 下挂载 80×80 技能图标，图标纹理 SHALL 来自 `skill_table` 对应行的 `iconPath`。

#### Scenario: 进入战斗后显示已装备技能

- **WHEN** 战斗初始化完成且玩家 `SkillLoadoutState.equippedSkillIds` 前三槽已赋值
- **THEN** 三个 `SkillBaseBar` 子节点必须显示对应技能图标，尺寸为 80×80
- **AND** 空槽不得显示技能图标子节点

#### Scenario: 装配变更后装备栏同步刷新

- **WHEN** 玩家在 `SkillSelectPanel` 中变更装备栏技能并关闭面板
- **THEN** `SkillBaseBar1–3` 图标必须在下一渲染帧内与 `equippedSkillIds` 一致

### Requirement: SkillSelectPanel 初始化隐藏与 Tab 切换

系统 SHALL 在战斗 HUD 初始化时将 `SkillSelectPanel` 设为不可见；用户按下 Tab 键 SHALL 切换面板可见性，并联动战斗暂停状态。

#### Scenario: 初始化隐藏

- **WHEN** `MainUIPanel` 首次挂载到舞台
- **THEN** `SkillSelectPanel.visible` 必须为 `false`
- **AND** `SkillLoadoutState.panelOpen` 必须为 `false`

#### Scenario: Tab 打开面板并暂停

- **WHEN** 战斗进行中用户按下 Tab 且当前面板为关闭状态
- **THEN** `SkillSelectPanel.visible` 必须为 `true`
- **AND** `GameSession.paused` 必须为 `true`
- **AND** 战斗逻辑 System（移动、刷怪、子弹等）必须停止更新

#### Scenario: Tab 关闭面板并继续

- **WHEN** 面板已打开且用户再次按下 Tab
- **THEN** `SkillSelectPanel.visible` 必须为 `false`
- **AND** `GameSession.paused` 必须为 `false`
- **AND** 战斗逻辑 System 必须恢复更新

### Requirement: EffectBox 未装备 Effect 槽动态生成

系统 SHALL 在打开 `SkillSelectPanel` 时隐藏 `EffectBox` 内演示用模板 `EffectBtn`，并动态生成 10 个 `EffectBtn` 实例，横向排布且槽位 SHALL NOT 重叠。

#### Scenario: 打开面板生成十格

- **WHEN** `SkillSelectPanel` 从关闭变为打开
- **THEN** 模板 `EffectBtn` 必须不可见或已移除
- **AND** `EffectBox` 下必须存在恰好 10 个子 `EffectBtn`
- **AND** 相邻槽位间距必须等于 `skillSelectDefine` 中 `EFFECT_BTN_WIDTH + EFFECT_BTN_GAP`

#### Scenario: 空槽不显示 EffectIcon

- **WHEN** 某 `EffectBtn` 对应槽位无 `unequippedEffectIds` 项
- **THEN** 该 `EffectBtn` 下 `EffectIcon` 必须不可见

#### Scenario: 有 Effect 时显示图标

- **WHEN** 槽位绑定 `skill_effect_table` 中某 `id`
- **THEN** `EffectIcon` 必须可见且纹理必须对应该行 `iconPath`

### Requirement: 技能详情 EffectBox 与 SkillBox 槽生成

系统 SHALL 对 `EffectBox_1`、`EffectBox_2`、`EffectBox_3` 分别展示对应装备技能的 Effect 槽；系统 SHALL 在 `SkillBox` 下按持有技能列表生成 `SkillBaseBar` 槽。

#### Scenario: 技能详情页槽位数来自配表

- **WHEN** 打开面板且 `equippedSkillIds[i]` 对应技能行的 `effectSlotCount` 为 N
- **THEN** `EffectBox_{i+1}` 下必须生成 N 个 `EffectBtn`（不含模板演示按钮）
- **AND** `SkillBaseBar{i}_1` 必须显示该技能 80×80 图标

#### Scenario: SkillBox 持有技能列表

- **WHEN** `SkillLoadoutState.ownedSkillIds` 长度为 M
- **THEN** `SkillBox` 下必须生成 M 个 `SkillBaseBar` 子槽
- **AND** 每个槽必须显示对应 `skill_table.iconPath` 图标

### Requirement: 长按拖拽与同类槽限制

系统 SHALL 支持对含有 Effect 的 `EffectBtn` 与含有 Skill 的 `SkillBaseBar` 长按拖拽；落点 SHALL 仅允许同类槽位。

#### Scenario: Effect 拖拽到 EffectBtn

- **WHEN** 用户长按某 `EffectBtn` 超过 `LONG_PRESS_MS` 并将其拖至另一 `EffectBtn`
- **THEN** 系统 SHALL交换或移动 `unequippedEffectIds` / `skillEffectMap` 中对应项
- **AND** 两个槽位的 `EffectIcon` 显示必须立即反映新状态

#### Scenario: Skill 拖拽到 SkillBaseBar

- **WHEN** 用户长按某 `SkillBaseBar` 并将其拖至另一 `SkillBaseBar`（含装备栏与 SkillBox）
- **THEN** 系统 SHALL按 `SkillLoadoutModel` 规则更新 `equippedSkillIds` 或 `ownedSkillIds`
- **AND** 装备栏三格图标必须同步刷新

#### Scenario: 跨类落点拒绝

- **WHEN** 用户将 Effect 拖向 `SkillBaseBar` 或将 Skill 拖向 `EffectBtn`
- **THEN** 系统 SHALL拒绝落点并恢复拖拽前视觉状态
