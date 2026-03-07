## ADDED Requirements

### Requirement: ECS 属性定义与配置驱动
系统 SHALL 在 ECS 架构下提供「属性」的清晰定义方式，使组件数据可由 JSON 配表驱动初始化，且不改变现有 Entity/Component/System 的存储与调度模型。

#### Scenario: 属性由配表行定义并可映射到组件
- **WHEN** 定义一种需要从配置初始化的组件（如角色属性、技能参数）
- **THEN** 该组件的字段 SHALL 能与配表列名或约定 schema 对应
- **AND** 运行时 SHALL 能够根据配置 id 从读表接口取出一行数据并填充到组件实例（在业务层或工厂中完成，不强制内置到 ECS 内核）

#### Scenario: 属性类型与配表类型一致
- **WHEN** 配表支持 int、float、string、list&lt;int&gt;、list&lt;float&gt; 等类型
- **THEN** 映射到组件时 SHALL 使用与之匹配的 TypeScript 类型（number、string、number[]）
- **AND** 读表 API 返回的行对象 SHALL 与表结构一致，便于类型安全访问

#### Scenario: 与现有 Component 存储兼容
- **WHEN** 使用属性系统为实体添加「从表初始化的组件」
- **THEN** 组件仍通过现有 ComponentStore 按类型存储与按 EntityId 访问
- **AND** 属性系统 SHALL 不引入新的全局存储，仅约定数据来源与初始化方式
