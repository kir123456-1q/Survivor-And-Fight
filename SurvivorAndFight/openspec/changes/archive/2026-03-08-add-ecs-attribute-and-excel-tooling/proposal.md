# Change: 基于 ECS 的属性系统与 Excel 导表工具链

## Why
项目已有 ECS 核心（Entity/Component/System），但缺少统一的**属性系统**（数值、配置驱动）以及配套的**配表与读表能力**。策划/数值需要通过 Excel 维护配置并导出为 JSON，运行时需要类型安全地读取这些配置。需要先设计 ECS 友好的属性模型、规范 JSON 配表格式与读表 API，再提供 Excel 导表工具（含规范表格格式与多类型解析）。

## What Changes
- 新增 **ECS 属性系统**：在现有 Component 模型上设计属性定义与读写方式，支持从配置驱动组件数据。
- 新增 **JSON 配表规范与生成**：约定配表 JSON 的 schema（如按 id 索引的数组/对象），并可由导表工具生成。
- 新增 **读表工具**：运行时加载并解析 JSON 配表，提供按 id 或索引查询、类型安全的访问接口。
- 新增 **Excel 导表工具**：规范 Excel 表格格式（表头、类型行、数据行），支持 `int`、`float`、`string`、逗号分隔的 `list<int>` / `list<float>` 等类型，将字符串解析后导出为 JSON。
- 新增 **表注册配置与 Data 全局读表**：通过一份 JSON 配置文件声明「表名/源文件」与「直接读取名称」的对应关系及多表关联（如道具表+装备表合并为道具总表）；运行时提供全局 `Data.XXX.GetByID(id)` 及按英文表头生成的单列取值方法（如 `GetName(id)`），项目内任意处可统一访问。

## Impact
- **Affected specs（新增能力）**
  - `ecs-attribute-system`：基于 ECS 的属性定义与配置驱动。
  - `config-json-tables`：JSON 配表格式规范与生成约定；**表注册配置文件**（表名/别名与多表关联）的 schema。
  - `config-table-loader`：读表 API 与加载方式；**Data.\*** 全局命名空间与 GetByID / 按列取值 API。
  - `excel-export-tool`：Excel 表格格式规范与导出为 JSON 的工具。
- **Affected code（预期）**
  - `src/ecs/` 或 `src/config/`：属性系统与配置数据结构。
  - 读表模块 `src/config/TableLoader.ts`；新增表注册配置解析与 **Data** 单例（如 `src/config/Data.ts`）。
  - 表注册配置文件（如 `tables.registry.json` 或置于 assets/config）。
  - 导表工具（`tools/excel-export/`）；可选：根据注册表生成类型或封装代码。
