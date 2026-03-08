## ADDED Requirements

### Requirement: JSON 配表结构规范
系统 SHALL 约定运行时使用的 JSON 配表结构，使导表工具与读表工具基于同一 schema，便于生成与解析。

#### Scenario: 配表以主键索引的列表形式存在
- **WHEN** 导表工具或手写生成配表 JSON
- **THEN** 表数据 SHALL 以「列表」形式存在，例如 `{ "list": [ { "id": 1, ... }, ... ] }` 或等价结构
- **AND** 每行 SHALL 包含可配置的主键字段（默认字段名为 `id`），用于唯一标识一行

#### Scenario: 类型与 JSON 原生类型对应
- **WHEN** 配表 JSON 被生成
- **THEN** 整型与浮点 SHALL 以 JSON number 存储；字符串以 string 存储；列表以 JSON array 存储（元素为 number 或 string）
- **AND** 列表类型（如 list&lt;int&gt;、list&lt;float&gt;）在 JSON 中 SHALL 体现为 number[]，不采用逗号分隔的字符串

#### Scenario: 多表与文件对应关系明确
- **WHEN** 存在多张逻辑表（如角色表、技能表）
- **THEN** 每张表 SHALL 对应至少一个 JSON 文件（或一个 JSON 文件内多段 key），命名或路径约定在实现与文档中明确
- **AND** 读表工具 SHALL 能够按表名或路径加载对应 JSON 并解析为统一结构

### Requirement: 表注册配置文件
系统 SHALL 提供一份 JSON 配置文件，用于声明逻辑表名与读取名称的对应关系，以及多张源表合并为一张逻辑表的关联关系。

#### Scenario: 表名与读取名配置
- **WHEN** 配置表注册文件（如 tables.registry.json）
- **THEN** 每张逻辑表 SHALL 通过 `key` 指定在全局 Data 上的读取名（如 `"Item"` 对应 `Data.Item`）
- **AND** 每张逻辑表 SHALL 通过 `sources` 指定一个或多个配表 JSON 路径；多个路径时表示多表关联合并为一张逻辑表

#### Scenario: 多表关联合并
- **WHEN** 某逻辑表的 `sources` 包含多个 JSON 路径（如道具表、装备表）
- **THEN** 运行时 SHALL 按顺序加载各 JSON，将其 `list` 数组合并为一张表
- **AND** 主键重复时 SHALL 以先出现的行为准；主键字段名可通过 `idKey` 配置（默认 `id`）
