# Design: ECS 属性系统与 Excel 导表工具链

## Context
- 引擎与运行时：LayaAir 3.x + TypeScript，已有 ECS 核心（EntityManager、ComponentStore、System 与 Laya 绑定）。
- 需求：策划用 Excel 维护数值/配置，导出为 JSON；运行时按 id 或键安全读取，并可与 ECS 组件（如血量、攻击力、技能参数）绑定。
- 约束：不引入重量级框架；导表工具可独立于运行时（Node 脚本或本地工具），Excel 格式需简单明确以便策划填写。

## Goals / Non-Goals
- Goals:
  - 在 ECS 下定义「属性」的抽象（可来自配置表或代码），便于组件从配表初始化。
  - 统一 JSON 配表的结构约定（如 `{ list: [{ id, ... }] }` 或 `{ [id]: row }`），便于生成与读取。
  - 提供运行时读表 API：加载 JSON、按 id/索引查询、类型明确（避免到处手写 `as number`）。
  - 提供 Excel 导表工具：规定表头/类型行/数据行，支持 int、float、string、list&lt;int&gt;、list&lt;float&gt; 等，逗号分隔字符串解析后输出 JSON。
- Non-Goals:
  - 不实现完整的可视化配表编辑器（仅规范 Excel + 导出脚本）。
  - 不在此阶段实现热更或远程拉表；先支持本地 JSON 加载。
  - 不规定具体游戏属性名（如 hp、atk），由后续玩法 spec 定义，本设计只规定机制与类型系统。

## Decisions
- **属性与 ECS 的关系**
  - 属性以「配置行」形式存在（JSON 的一行 = 一条配置），运行时通过读表 API 获取。
  - ECS 组件可从配置初始化：例如「根据配置 id 取一行，填充 HealthComponent.maxHp、attack 等」。不在 ECS 内核里内置「属性组件」，而是由业务组件持有从表里读出的数据。
  - 属性系统在本变更中定义为：**配表 schema 约定 + 读表 API +（可选）与组件字段的映射约定**，不新增独立「AttributeComponent」除非后续 spec 需要。
- **JSON 配表格式**
  - 采用「数组 + 主键」：`{ "list": [ { "id": 1, "name": "xxx", ... }, ... ] }` 或等价；主键字段名可配置（默认 `id`），便于按 id 查。
  - 导表工具输出 JSON 时，类型由 Excel 类型行决定：int/float 输出为 number，list&lt;int&gt;/list&lt;float&gt; 输出为 number[]，string 输出为 string。
- **Excel 表格格式**
  - 第 1 行：英文字段名（表头），与 JSON 键一一对应。
  - 第 2 行：类型标记，如 `int`、`float`、`string`、`list<int>`、`list<float>` 等。
  - 第 3 行起：数据行；空行或全空表可跳过或视为无数据。
  - 列表类型：单元格内用逗号分隔，如 `1,2,3` → list&lt;int&gt; 为 `[1,2,3]`，`1.5,2.0` → list&lt;float&gt; 为 `[1.5,2.0]`；字符串解析失败时按规范报错或使用默认值（在 spec 中明确）。
- **读表工具**
  - 提供「表加载」：给定 JSON 路径或已解析对象，返回可查询的 Table 对象。
  - 提供按主键查询：`getById(id)` 返回单行（类型安全由泛型或接口约定）。
  - 提供遍历：`getAll()` 或 `list` 用于需要全表遍历的场景。
  - 运行时可依赖 Laya 的加载方式（如 `Laya.loader`）或 `fetch` + `JSON.parse`，具体在实现阶段决定。
- **Excel 导表工具**
  - 实现方式：Node 脚本（TypeScript/JavaScript），使用 xlsx 等库读取 Excel。
  - 输入：Excel 文件路径（或目录批量）；输出：一个或多个 JSON 文件（可与表名或 sheet 名对应）。
  - 类型解析：严格按第 2 行类型标记解析；list 类型对单元格做 trim + split(',')，再按元素类型 parseInt/parseFloat；无效值处理策略在 spec 中规定（如跳过、默认 0、或报错）。
- **表注册配置（tables.registry.json）**
  - 用途：声明「逻辑表名/读取名」与「源 JSON 文件」的对应关系，以及多表关联（多源合并为一张逻辑表）。
  - 结构：根对象包含 `tables` 数组；每项包含 `key`（如 `"Item"`，对应 `Data.Item`）、`sources`（JSON 路径数组，多源时按顺序合并 list）、可选 `idKey`（主键列名，默认 `id`）、可选 `alias`（内部别名，如 `Data_Item`）。
  - 多表关联：同一逻辑表对应多个 source 时，运行时按顺序加载各 JSON，将其 `list` 数组合并（concat）为一张表；主键重复时以先出现的为准。
  - 放置：与配表 JSON 同目录或项目约定的 config 目录，由 Data 初始化时加载。
- **Data 全局读表 API**
  - 单例 `Data`：根据表注册配置加载所有源 JSON，为每个 `key` 挂载一个表视图对象，项目内通过 `Data.Item`、`Data.Role` 等统一访问。
  - 表视图提供：`GetByID(id)` 返回整行（或 undefined）；`Get(columnName, id)` 返回该行指定列的值；按英文表头生成「单列取值」方法：对每列 `xxx` 提供 `GetXxx(id)`（首字母大写的驼峰形式），如 `GetName(id)`、`GetHp(id)`，由运行时根据表头动态生成或由后续代码生成补充。
  - 初始化：在游戏启动时加载表注册配置，再按 `sources` 加载各 JSON，合并后构建 ConfigTable，注册到 Data[key]，并生成各列的 GetXxx 方法。

## Risks / Trade-offs
- Excel 格式一旦定死，后续加列或改类型需要兼容：通过「类型行」和可选「忽略未识别列」策略降低风险；大改可视为新表或版本。
- 读表若在运行时同步加载大表可能卡顿：本阶段先做同步加载，异步加载与分表作为后续扩展。

## Migration Plan
- 无既有配表系统需要迁移；新表从零按规范建立即可。若后续有旧 JSON 格式，可写一次性转换脚本映射到新格式。

## Open Questions
- 多 Sheet 是否每个 Sheet 导出一份 JSON，还是合并（由 tasks/实现时约定）。
- 主键是否允许多列联合（本设计先采用单列主键 `id`）。
- Data 单例的初始化时机（首屏前一次性加载 vs 按需懒加载）由实现与性能需求决定。
