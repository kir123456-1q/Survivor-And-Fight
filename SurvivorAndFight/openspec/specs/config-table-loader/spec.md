# config-table-loader Specification

## Purpose
TBD - created by archiving change add-ecs-attribute-and-excel-tooling. Update Purpose after archive.
## Requirements
### Requirement: 运行时读表 API
系统 SHALL 提供加载 JSON 配表并按主键或索引查询的读表工具，供 ECS 组件初始化或业务逻辑使用。

#### Scenario: 加载配表 JSON
- **WHEN** 运行时需要使用的配表（如角色表、技能表）
- **THEN** 系统 SHALL 提供加载接口：输入为 JSON 路径或已解析的 JSON 对象，输出为可查询的「表」对象
- **AND** 加载过程 SHALL 解析 list 结构并建立主键到行的索引（若主键字段名可配置，则支持默认 `id`）

#### Scenario: 按主键查询单行
- **WHEN** 调用表对象的按主键查询接口（如 getById(id)）
- **THEN** 系统 SHALL 返回主键等于该值的单行数据，若无则返回 undefined 或 null（行为在实现中统一）
- **AND** 返回类型 SHALL 与表结构一致，便于 TypeScript 类型安全使用（泛型或接口）

#### Scenario: 遍历全表
- **WHEN** 需要遍历表中所有行（如刷怪表按权重随机）
- **THEN** 系统 SHALL 提供获取全部行列表的接口（如 getAll() 或 list）
- **AND** 返回顺序 SHALL 与 JSON 中 list 顺序一致，除非文档明确允许乱序

#### Scenario: 与 Laya 资源加载方式兼容
- **WHEN** 配表 JSON 作为游戏资源存放
- **THEN** 读表工具 SHALL 支持从已加载的 JSON 对象构建表，或从 URL/路径加载（具体依赖 Laya.loader 或 fetch 等在实现中选定）
- **AND** 不强制要求读表工具直接依赖 Laya  API，可接受先加载再传入解析结果

### Requirement: Data 全局读表命名空间
系统 SHALL 提供全局单例 Data，根据表注册配置为每张逻辑表挂载表视图，使项目内任意处可通过 `Data.XXX.GetByID(id)` 获取整行数据。

#### Scenario: 按 key 访问表并取整行
- **WHEN** 表注册配置中声明了 key（如 `"Item"`）
- **THEN** 运行时 SHALL 在 Data 上挂载对应表视图，可通过 `Data.Item.GetByID(id)` 获取主键为 id 的一整行
- **AND** 无该 id 时 SHALL 返回 undefined（或实现约定的空值）

#### Scenario: 按列名取单个元素
- **WHEN** 需要根据英文表头获取某一列的值
- **THEN** 系统 SHALL 提供 `Data.XXX.Get(columnName, id)` 返回该行指定列的值
- **AND** 系统 SHALL 根据表头列名生成单列取值方法：对列名 `xxx` 提供 `GetXxx(id)`（首字母大写的驼峰形式，如 GetName(id)、GetHp(id)），可在项目内直接调用

