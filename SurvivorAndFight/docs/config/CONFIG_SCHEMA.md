# 配表规范与约定

本文档约定 JSON 配表结构、主键与多 Sheet 策略、空行与解析失败处理，供导表工具与读表工具对齐。

## 1. JSON 配表结构

- **根结构**：`{ "list": [ ... ] }`，`list` 为行数组。
- **每一行**：普通对象，键为英文字段名，值与类型行对应（见下表）。
- **主键**：默认字段名为 `id`，类型为 `int` 或 `string`，用于唯一标识一行。读表与导表均默认使用 `id`；主键列在 Excel 中必须存在。

## 2. 策略约定

| 项 | 约定 |
|----|------|
| 主键字段名 | 默认 `id`，读表构造时可配置为其他字段名。 |
| 多 Sheet | 每个 Sheet 导出一份独立 JSON 文件，文件名与 sheet 名对应（或「原文件名_sheet名.json」）。 |
| 空行 | Excel 中整行为空或所有单元格为空时跳过该行，不写入 JSON。 |
| 解析失败 | 数字类型：空单元格或无效字符串导出为 `0`；list 类型：空单元格导出为 `[]`，某片段解析失败则该元素用 `0`；string 保持原样。 |

## 3. 类型与 JSON 对应

| 类型标记 | JSON 类型 | 说明 |
|----------|-----------|------|
| int | number | 整数，解析失败为 0。 |
| float | number | 浮点数，解析失败为 0。 |
| string | string | 原样，前后 trim。 |
| list&lt;int&gt; | number[] | 逗号分隔，每段 parseInt，失败为 0。 |
| list&lt;float&gt; | number[] | 逗号分隔，每段 parseFloat，失败为 0。 |
| list&lt;string&gt; | string[] | 逗号分隔，每段 trim。 |

## 4. Excel 格式（导表用）

- **第 1 行**：表头，英文字段名，与 JSON 键一致。
- **第 2 行**：类型行，单元格为上述类型标记（如 `int`、`float`、`list<int>`），大小写不敏感。
- **第 3 行起**：数据行；空行跳过。
- **主键列**：表头中需包含 `id`（或配置的主键名），类型为 `int` 或 `string`。

## 5. 示例 JSON（角色表示例）

见同目录 `sample_table.json`。

## 6. 从配表初始化 ECS 组件

- **约定**：组件字段名与配表列名（表头）一致时，可直接用读表得到的行对象填充组件。建议为每张表定义 TypeScript 接口（如 `RoleTableRow`），表行类型即该接口；组件构造或工厂函数接受 `RoleTableRow`，按需拷贝字段到组件实例。
- **示例**：若组件有 `maxHp: number`、`attack: number`，配表有列 `hp`、`attack`，则用 `ConfigTableLoader.getById(1)` 得到行后，在业务代码中 `new HealthComponent(row.hp, row.attack)` 或使用 `fillFromTableRow(component, row, { maxHp: 'hp', attack: 'attack' })` 做列名到字段名的映射（辅助函数见 `src/config/tableLoader.ts`）。
- **不内置**：ECS 内核不内置「属性组件」或自动绑定；所有「从表初始化」均在业务层或实体工厂中显式完成。

## 7. 运行时加载（Laya）

- 将配表 JSON 放在 `assets` 或可访问的 URL，使用 Laya.loader 加载（或 fetch）得到 JSON 对象。
- 将得到的对象传入 `ConfigTable.fromJson(loadedObject)` 构建表，再使用 `getById(id)` / `getAll()` 查询。读表工具不直接依赖 Laya API，仅接受已解析的 JSON，便于在任意环境复用。
