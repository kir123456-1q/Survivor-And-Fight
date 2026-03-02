## 1. 设计与对齐
- [ ] 1.1 评审 `ecs-core` 与 `ecs-laya-binding-demo` 的 ADDED Requirements，确认第 1 期目标与非目标一致
- [ ] 1.2 根据 phase1 提示词文档，补充或调整本次变更的 spec 中的术语与描述，使之便于大模型使用

## 2. ECS 核心内核实现（ecs-core）
- [ ] 2.1 创建 `src/ecs/core` 目录与基础文件骨架
- [ ] 2.2 实现 Entity 标识与管理（创建/销毁、ID 复用、组件集合查询接口）
- [ ] 2.3 实现 Component 注册与存储（按组件类型维度的容器与按组件类型遍历能力）
- [ ] 2.4 实现 System 抽象与注册机制（含分组/优先级模型的最小版本）
- [ ] 2.5 在 Laya 主循环中挂接 `world.update(deltaTime)` 入口

## 3. Entity–Laya 绑定与 Demo 实现（ecs-laya-binding-demo）
- [ ] 3.1 设计并实现 `ViewComponent` 或等价绑定结构（含 `entityId -> Sprite3D` 等映射）
- [ ] 3.2 实现 Transform 同步 System（ECS → Laya）
- [ ] 3.3 在 `src/game/demo` 下创建最小 Demo 场景（几十个实体移动/旋转）
- [ ] 3.4 为 Demo 定义并实现所需的组件集（Position / Velocity / Rotation / View / Tag 等）
- [ ] 3.5 为 Demo 定义并实现所需的 Systems（MovementSystem / RotationSystem / ViewSyncSystem 等）

## 4. 验证与调试
- [ ] 4.1 为 ECS 核心编写基础单元测试或最小验证脚本（覆盖 Entity/Component/System 的主要路径）
- [ ] 4.2 运行 Demo 场景，验证实体移动/旋转行为与视图同步是否符合预期
- [ ] 4.3 根据验证结果调整 spec 或实现，必要时补充调试辅助接口

