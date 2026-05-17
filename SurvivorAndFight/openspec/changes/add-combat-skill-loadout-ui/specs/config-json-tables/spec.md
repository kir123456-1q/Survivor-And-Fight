## ADDED Requirements

### Requirement: 技能与 Effect 表图标列规范

`skill_table.json` 与 `skill_effect_table.json` 的每一行 SHALL 包含 UI 与战斗共用的图标路径列，路径 SHALL 相对于 `assets` 资源根。

#### Scenario: Skill 表 iconPath 列

- **WHEN** 读取 `skill_table` 任意行
- **THEN** 行SHALL包含字符串字段 `iconPath`，格式为 `atlas/Skillicon/{id}.png`
- **AND** 运行时加载失败SHALL记录警告并使用占位图标

#### Scenario: SkillEffect 表 iconPath 列

- **WHEN** 读取 `skill_effect_table` 任意行
- **THEN** 行SHALL包含字符串字段 `iconPath`，格式为 `atlas/EffectIcon/{filename}.png`
- **AND** 文件名SHALL与该行 `id` 及磁盘 PNG 一致

### Requirement: 技能表扩展列

`skill_table` 行 SHALL 包含装配 UI 所需列，供 `SkillLoadoutModel` 读取。

#### Scenario: effectSlotCount 与 defaultEquipped

- **WHEN** 策划配置某技能详情页需要 N 个 Effect 槽
- **THEN** 行SHALL设置整数 `effectSlotCount`，且 N SHALL ≥ 1
- **WHEN** 行 `defaultEquipped` 为 true
- **THEN** 战斗初始化SHALL将该技能 id 写入 `equippedSkillIds` 的下一个空槽

## MODIFIED Requirements

### Requirement: JSON 配表结构规范

JSON 配表 SHALL 以主键索引的 `list` 数组形式存在；类型与 JSON 原生类型对应；多表与文件对应关系 SHALL 在 `tables.registry.json` 中声明。`skill_table` 与 `skill_effect_table` 的行除既有战斗字段外，SHALL 包含本变更定义的 `iconPath` 及装配相关列（`effectSlotCount`、`defaultEquipped`、`enabled`）。

#### Scenario: 配表以主键索引的列表形式存在

- **WHEN** 加载任意已注册 JSON 表
- **THEN** 文件SHALL包含 `list` 数组
- **AND** 每行SHALL包含 registry 指定的 `idKey` 字段

#### Scenario: 类型与 JSON 原生类型对应

- **WHEN** 表行包含数值、字符串、布尔字段
- **THEN** JSON 中SHALL使用 number、string、boolean 原生类型，不得使用字符串包裹的数字

#### Scenario: 多表与文件对应关系明确

- **WHEN** 新增或扩展 `skill_table`、`skill_effect_table`
- **THEN** `tables.registry.json` SHALL保留 `Skill` 与 `SkillEffect` 注册项
- **AND** `sources` SHALL指向更新后的 JSON 文件名
