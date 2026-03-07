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

## 读表示例

```ts
import { ConfigTable } from '../config/TableLoader';  // 从 src 下其他目录按相对路径引用

// 假设 json 已通过 Laya.loader 或 fetch 加载得到
const table = ConfigTable.fromJson(json);
const row = table.getById(1);   // 按主键取一行
const all = table.getAll();    // 全表列表
```
