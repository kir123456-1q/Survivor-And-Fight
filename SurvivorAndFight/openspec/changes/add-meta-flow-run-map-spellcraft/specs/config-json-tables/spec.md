## ADDED Requirements

### Requirement: 跑图与法术相关逻辑表登记
系统 SHALL 将跑图规则、法杖模板、法术片段三类逻辑表纳入 `tables.registry.json`；每张表 SHALL 对应独立 JSON 源文件或等价分段；读取名 SHALL 在加载器文档中固定。

#### Scenario: 注册项完整
- **WHEN** 运行时初始化配置加载器
- **THEN** 注册文件中 SHALL 存在 `RunMapRules`、`Wand`、`SpellPiece` 三类逻辑键（命名以实际 registry 为准，须在实现注释与 `INTERFACES.md` 同步）

### Requirement: 跑图规则表字段
`RunMapRules` 表 SHALL 至少包含：每大关最少层数、每层的分叉度上下限、各节点类型权重、生成失败最大重试次数；字段类型 SHALL 符合 `config-json-tables` 对 JSON 原生类型的约束。

#### Scenario: 列表字段使用 JSON 数组
- **WHEN** 书写 `RunMapRules` 行内列表类字段
- **THEN** 字段 SHALL 使用 JSON array，禁止使用逗号分隔单一字符串模拟列表

### Requirement: 法杖与法术片段表字段
`Wand` 表 SHALL 至少包含：法杖主键、槽位布局声明（槽顺序与语义）；`SpellPiece` 表 SHALL 至少包含：片段主键、语义分类、兼容标签集合、求值相位或次序键。

#### Scenario: 主键唯一
- **WHEN** 合并加载多张来源 JSON 为同一逻辑表
- **THEN** 主键重复处理规则 SHALL 遵循既有 `config-json-tables` 合并语义
