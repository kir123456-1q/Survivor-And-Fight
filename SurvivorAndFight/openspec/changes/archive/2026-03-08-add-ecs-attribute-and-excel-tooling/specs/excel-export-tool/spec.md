## ADDED Requirements

### Requirement: Excel 表格格式规范
系统 SHALL 规定用于导表的 Excel 表格格式，使策划与导表工具对表头、类型、数据行有一致约定。

#### Scenario: 表头与类型行约定
- **WHEN** 编辑导表用 Excel
- **THEN** 第 1 行 SHALL 为表头，每个单元格为英文字段名，与导出 JSON 的键名一致
- **AND** 第 2 行 SHALL 为类型行，每个单元格为类型标记：`int`、`float`、`string`、`list<int>`、`list<float>` 等（大小写或别名在实现中统一）

#### Scenario: 数据行从第三行开始
- **WHEN** 导表工具解析 Excel
- **THEN** 第 3 行起为数据行，每行对应导出 JSON 中 list 的一项
- **AND** 空行或整行为空 SHALL 按约定处理：可跳过该行或视为无效行（在实现与文档中明确）

#### Scenario: 主键列存在且可识别
- **WHEN** 导表生成 JSON
- **THEN** 表头中 SHALL 包含主键列（默认列名为 `id`），导表工具 SHALL 能识别并保证每行主键唯一或按约定处理重复
- **AND** 主键列类型 SHALL 为 int 或 string（由类型行指定）

### Requirement: 单元格类型解析与导出
系统 SHALL 按类型行将单元格字符串解析为对应类型，并输出为 JSON 中正确的类型（number、string、array）。

#### Scenario: 标量类型解析
- **WHEN** 类型行为 int 或 float
- **THEN** 单元格内容 SHALL 被解析为数字（空单元格可导出为 0 或按约定）；解析失败时 SHALL 按约定处理（报错、跳过行或使用默认值）
- **AND** 导出 JSON 中该字段 SHALL 为 number 类型

#### Scenario: 字符串类型
- **WHEN** 类型行为 string
- **THEN** 单元格内容 SHALL 原样作为字符串导出，trim 与否在实现中统一
- **AND** 导出 JSON 中该字段 SHALL 为 string 类型

#### Scenario: 逗号分隔列表解析
- **WHEN** 类型行为 list&lt;int&gt; 或 list&lt;float&gt;
- **THEN** 单元格内容 SHALL 按逗号分隔后，每个片段解析为 int 或 float；空白或空单元格可导出为 [] 或按约定
- **AND** 导出 JSON 中该字段 SHALL 为 number[] 类型；若某片段解析失败，按约定处理（跳过该元素、使用 0、或整行报错）

#### Scenario: 其他列表与扩展类型
- **WHEN** 需要支持 list&lt;string&gt; 或更多类型
- **THEN** 导表工具 SHALL 在类型行支持相应标记（如 `list<string>`），解析规则与 JSON 输出类型在实现中明确
- **AND** 本需求至少覆盖 int、float、string、list&lt;int&gt;、list&lt;float&gt;，其余类型可为扩展

### Requirement: Excel 到 JSON 的导表工具
系统 SHALL 提供可将符合格式规范的 Excel 文件导出为 JSON 配表的工具（脚本或可执行程序）。

#### Scenario: 单表导出
- **WHEN** 用户指定一个 Excel 文件（及可选 sheet 名或索引）
- **THEN** 工具 SHALL 读取第 1、2 行作为表头与类型行，从第 3 行起读取数据行
- **AND** 工具 SHALL 按类型解析每个单元格并输出为约定结构的 JSON 文件（含 list 与主键）

#### Scenario: 批量或多 Sheet 导出
- **WHEN** 用户指定多个文件或一个文件中的多个 sheet
- **THEN** 工具 SHALL 对每个表按相同格式规范解析并分别输出 JSON（或按约定合并），输出路径或命名方式在实现中明确
- **AND** 多 sheet 时每个 sheet 可对应一个 JSON 文件，或由配置指定

#### Scenario: 工具可独立于运行时运行
- **WHEN** 导表工具执行
- **THEN** 工具 SHALL 可在 Node 环境中运行（如 `node scripts/export-excel.js` 或通过 npm script），不依赖 Laya 或浏览器
- **AND** 工具 SHALL 使用可读取 Excel 的库（如 xlsx）解析文件，输出为标准 JSON 文件，供运行时读表工具或资源管线使用
