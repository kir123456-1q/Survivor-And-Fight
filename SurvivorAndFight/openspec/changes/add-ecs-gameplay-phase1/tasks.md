## 1. 实体形态与筛选器基础
- [ ] 1.1 定义 PlayerTag / MonsterTag 等实体形态组件，并在文档中约定与 Position、Attribute 等组合使用方式
- [ ] 1.2 设计并实现筛选器抽象（按组件组合查询 Entity 列表），提供至少 Players、Monsters、Controllable 等命名筛选
- [ ] 1.3 将筛选器与 ecs-core 的按组件类型遍历能力对接，供后续 System 使用

## 2. 移动组件与系统
- [ ] 2.1 定义 Movement 相关组件（如 Position、Velocity），与现有 ECS 存储模型兼容
- [ ] 2.2 实现 MovementSystem：每帧根据 Velocity 等更新 Position
- [ ] 2.3 若有 Laya Transform 同步，确保 MovementSystem 在 ViewSync 之前执行（顺序在 design/tasks 中可配置）

## 3. 属性组件与 Modifier 机制
- [ ] 3.1 定义 Attribute 组件（基础属性键值 + Modifier 列表结构），Modifier 含来源 id、类型、数值
- [ ] 3.2 实现属性合并与溯源逻辑（加算/乘算顺序约定），提供按属性名取最终值及按 modifier 溯源的 API
- [ ] 3.3 实现或挂接 AttributeSystem（如每帧重算缓存、或按需计算），确保与配表初始化兼容（ecs-attribute-system）

## 4. 技能与 Effect 配表及系统
- [ ] 4.1 设计技能表与 effect 子表/结构：执行者、效果类型、参数公式、目标类型；技能表含特效栏位、子弹栏位
- [ ] 4.2 实现公式解析器：支持属性别名（atk、hp 等）从指定实体解析，用于 effect 参数
- [ ] 4.3 实现索敌：auto（威胁度+血量加权，优先低血高威胁）、simple（以鼠标位置为目标）
- [ ] 4.4 定义 Skill 组件（当前技能 id、冷却等），实现 SkillSystem：根据技能配置执行 effect 列表、应用公式与索敌结果
- [ ] 4.5 将技能/effect 与读表 API 对接，确保配表驱动

## 5. 操控组件与系统
- [ ] 5.1 定义 Control 组件，标记实体由玩家控制
- [ ] 5.2 实现 ControlSystem：根据输入抽象（如 input-abstraction）将移动/释放技能等意图写入对应实体组件或命令
- [ ] 5.3 使用筛选器查询“带 Control 的实体”，仅对这些实体应用玩家输入

## 6. 验证与文档
- [ ] 6.1 为 modifier 合并、公式解析、索敌权重编写单元测试或最小用例
- [ ] 6.2 更新或补充 CONFIG_SCHEMA / 表结构文档中的技能与 effect、特效/子弹栏位说明
