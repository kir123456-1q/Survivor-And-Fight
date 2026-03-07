# Change: 基于 ECS 的属性系统与 Excel 导表工具链

## Why
项目已有 ECS 核心（Entity/Component/System），但缺少统一的**属性系统**（数值、配置驱动）以及配套的**配表与读表能力**。策划/数值需要通过 Excel 维护配置并导出为 JSON，运行时需要类型安全地读取这些配置。需要先设计 ECS 友好的属性模型、规范 JSON 配表格式与读表 API，再提供 Excel 导表工具（含规范表格格式与多类型解析）。

## What Changes
- 新增 **ECS 属性系统**：在现有 Component 模型上设计属性定义与读写方式，支持从配置驱动组件数据。
- 新增 **JSON 配表规范与生成**：约定配表 JSON 的 schema（如按 id 索引的数组/对象），并可由导表工具生成。
- 新增 **读表工具**：运行时加载并解析 JSON 配表，提供按 id 或索引查询、类型安全的访问接口。
- 新增 **Excel 导表工具**：规范 Excel 表格格式（表头、类型行、数据行），支持 `int`、`float`、`string`、逗号分隔的 `list<int>` / `list<float>` 等类型，将字符串解析后导出为 JSON。

## Impact
- **Affected specs（新增能力）**
  - `ecs-attribute-system`：基于 ECS 的属性定义与配置驱动。
  - `config-json-tables`：JSON 配表格式规范与生成约定。
  - `config-table-loader`：读表 API 与加载方式。
  - `excel-export-tool`：Excel 表格格式规范与导出为 JSON 的工具。
- **Affected code（预期）**
  - `src/ecs/` 或 `src/config/`：属性系统与配置数据结构。
  - 新增读表模块（如 `src/config/TableLoader.ts` 或等价）。
  - 新增导表工具（如脚本或独立小工具，可放在 `tools/` 或 `scripts/`），依赖 Excel 解析库（如 xlsx）将 Excel 转为 JSON。
