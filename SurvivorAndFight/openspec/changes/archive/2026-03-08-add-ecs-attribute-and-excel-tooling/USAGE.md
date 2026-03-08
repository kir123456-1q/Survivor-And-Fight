# 属性系统与配表使用说明

## 属性系统与 ECS

- 配表以 JSON 形式存在，结构为 `{ "list": [ { "id": 1, ... }, ... ] }`。
- 运行时使用 `ConfigTable.fromJson(loadedJson)` 构建表（见 `src/config/TableLoader.ts`），再通过 `getById(id)`、`getAll()` 查询。
- 组件从配表初始化：在业务层根据配置 id 取行，再填充到组件字段；可用 `fillFromTableRow(component, row, { maxHp: 'hp' })` 做列名到字段名的映射。
- 规范与策略见 `docs/config/CONFIG_SCHEMA.md`。

## Excel 格式

- **第 1 行**：表头（英文字段名）。
- **第 2 行**：类型（`int`、`float`、`string`、`list<int>`、`list<float>`、`list<string>`）。
- **第 3 行起**：数据；列表用逗号分隔，如 `1,2,3`。
- 空行会跳过；主键列默认名为 `id`。

## 导表命令

```bash
cd tools/excel-export
npm install
npm run create-sample        # 生成示例 sample.xlsx
node export-excel.js your.xlsx ./out   # 导出指定 Excel 到 out 目录
npm run export:sample        # 导出示例表到 out/
```

输出 JSON 可直接用 `ConfigTable.fromJson(...)` 加载。

## 读表示例（直接使用 ConfigTable）

```ts
import { ConfigTable } from '../config/TableLoader';

const table = ConfigTable.fromJson(json);
const row = table.getById(1);
const all = table.getAll();
```

## 表注册配置与 Data 全局读表

- 在 config 目录放置 **tables.registry.json**，声明每张逻辑表的 `key`（如 `Item`、`Role`）与 `sources`（JSON 路径数组）；多源表示多表关联合并为一张表（如道具表+装备表→Data.Item）。
- 启动时加载 registry 并调用 `initData`，之后在项目任意处使用 `Data.XXX`：

```ts
import { initData, Data } from '../config/Data';

// 假设已通过 Laya.loader 或 fetch 拿到 registry 与 baseUrl
const registry = await loadJson('config/tables.registry.json');
await initData(registry, (path) => loadJson(baseUrl + path));

// 按 ID 取整行
const row = Data.Item.GetByID(1);

// 按列名取单个元素（通用）
const name = Data.Item.Get('name', 1);

// 按表头生成的单列方法（首字母大写驼峰）
const name2 = Data.Item.GetName(1);
const hp = Data.Role.GetHp(1);
```

- 规范与示例见 `docs/config/CONFIG_SCHEMA.md`、`docs/config/tables.registry.json`。
