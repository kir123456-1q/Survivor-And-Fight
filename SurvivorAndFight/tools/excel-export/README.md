# Excel 导表工具

将符合规范的 Excel 表导出为 JSON 配表（`{ "list": [ ... ] }`）。

## Excel 格式

- **第 1 行**：表头，英文字段名（与 JSON 键一致）。
- **第 2 行**：类型，可选：`int`、`float`、`string`、`list<int>`、`list<float>`、`list<string>`（大小写不敏感）。
- **第 3 行起**：数据；空行会跳过。
- 列表类型在单元格内用**逗号**分隔，如 `1,2,3`。

## 使用

```bash
cd tools/excel-export
npm install
# 导出指定文件到 out 目录
node export-excel.js path/to/your.xlsx ./out
# 或导出内置示例（需先生成示例 Excel）
npm run create-sample
npm run export:sample
```

输出：每个 Sheet 生成一个 JSON 文件，如 `你的文件名_Sheet1.json`，内容为 `{ "list": [ { "id": 1, ... }, ... ] }`。

## 与读表配合

运行时使用 `src/config/TableLoader.ts` 的 `ConfigTable.fromJson(json)` 加载导出的 JSON，再通过 `getById(id)`、`getAll()` 查询。详见项目根目录下 `docs/config/CONFIG_SCHEMA.md`。
