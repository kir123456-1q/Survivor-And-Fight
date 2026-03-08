## 1. 设计与规范
- [x] 1.1 确认 `design.md` 中 JSON 主键字段名、多 Sheet 导出策略、空行/解析失败时的处理策略，并在 spec 或实现中统一
- [x] 1.2 为 JSON 配表编写一份简短 schema 说明（或示例 JSON），便于导表与读表对齐

## 2. ECS 属性系统（ecs-attribute-system）
- [x] 2.1 定义「从配表初始化组件」的约定文档或示例（组件字段与表列对应关系）
- [x] 2.2 若有通用辅助函数（如根据 id 取表行并填充组件），在 `src/config/` 或 `src/ecs/` 下实现并暴露

## 3. JSON 配表规范与读表工具（config-json-tables + config-table-loader）
- [x] 3.1 实现读表模块：接受 JSON 对象或 list 结构，构建主键索引，提供 getById(id)、getAll()/list
- [x] 3.2 读表接口支持泛型或类型参数，使返回行具备类型提示
- [x] 3.3 与 Laya 资源加载集成：在示例或文档中说明如何加载 JSON 后传入读表工具（或提供封装好的「按路径加载并返回表」的 API）
- [x] 3.4 编写至少一张示例 JSON 配表（符合 list + id 规范），用于测试读表

## 4. Excel 导表工具（excel-export-tool）
- [x] 4.1 规定并文档化 Excel 格式：第 1 行表头、第 2 行类型（int/float/string/list&lt;int&gt;/list&lt;float&gt; 等）、第 3 行起数据
- [x] 4.2 实现类型解析：int、float、string、list&lt;int&gt;、list&lt;float&gt;（逗号分隔字符串解析为数组），并处理空单元格与解析失败
- [x] 4.3 使用 xlsx（或等价库）读取 Excel，按 sheet 或配置导出为一个或多个 JSON 文件，结构为 `{ "list": [ ... ] }`
- [x] 4.4 提供 Node 脚本或 npm script：指定 Excel 路径（及可选输出路径），执行后生成 JSON
- [x] 4.5 提供至少一个示例 Excel 表，导出后与示例 JSON 一致，用于回归验证

## 5. 表注册配置与 Data 全局读表
- [x] 5.3 规定并实现表注册配置 JSON 的 schema（tables[].key、sources、idKey、alias），文档化于 CONFIG_SCHEMA 或独立 registry 说明
- [x] 5.4 实现多源合并逻辑：按 sources 顺序加载多个 JSON，将 list 数组合并为一张逻辑表，主键重复时先出现者生效
- [x] 5.5 实现 Data 单例：加载表注册配置后为每个 key 挂载表视图，提供 GetByID(id)、Get(columnName, id)、GetAll()
- [x] 5.6 根据表头英文列名动态生成单列取值方法 GetXxx(id)（如 GetName、GetHp），首字母大写驼峰
- [x] 5.7 提供示例 tables.registry.json（含单表与多表关联，如 Item 合并道具表+装备表）及 Data 初始化与调用示例

## 6. 验证与文档
- [x] 6.1 跑通流程：示例 Excel → 导表 → JSON → 读表 API 按 id 查询，结果与预期一致
- [x] 6.2 在 README 或 openspec 变更下补充：属性系统与配表的使用方式、Excel 格式说明、导表命令用法
- [x] 6.3 补充表注册配置与 Data.Item.GetByID / GetXxx 的用法说明
