# Design: 第 1 期 ECS 核心框架 MVP

## Context
- 引擎：LayaAir 3.x（WebGL2/WebGPU，H5 目标平台）
- 语言：TypeScript
- 目标：实现一个“类 Unity DOTS 思想”的轻量 ECS 核心，先满足少量实体的清晰结构和可扩展性，再为后续大规模优化打基础。
- 本设计文档只覆盖 **第 1 期 MVP 能力**，不追求极致性能与复杂内存布局。

## Goals / Non-Goals
- Goals:
  - 提供一个简单、清晰的 ECS 内核（Entity / Component / System），便于理解和扩展。
  - 支持少量实体（几十到几百）的稳定运行和基本的组件组合玩法。
  - 定义与 Laya 主循环的挂接方式，为后续系统扩展与性能优化打基础。
  - 提供一个“几十个实体移动/旋转”的最小 Demo，用于验证易用性和调试体验。
- Non-Goals:
  - 不实现 Job System、多线程或 Worker 等并行框架。
  - 不实现复杂 archetype / chunk-based 内存布局，仅在设计中预留扩展点。
  - 不追求几万实体级别的极致性能，仅要求结构合理、便于后续优化。
  - 不引入额外重量级框架（例如复杂依赖注入容器）。

## Decisions
- Entity 标识：
  - 使用 **number 类型的 EntityId** 作为唯一标识，来自一个自增计数器，并通过空闲列表实现 ID 复用。
- Entity 管理：
  - 提供 `EntityManager`（或等价命名）负责创建/销毁实体、追踪实体拥有的组件类型集合。
- Component 模型与存储：
  - Component 类型以 TypeScript 接口 + 具体实现对象（或简单数据对象）表示，强调“只存数据，不含游戏逻辑”。
  - 每种组件类型维护一个按 EntityId 索引的稠密数组或 Map，支持按组件类型高效遍历。
  - 在设计中预留后续切换为结构化内存布局（如 SoA / archetype chunk）的空间。
- System 模型与调度：
  - System 以具有 `update(deltaTime: number)` 的接口表示，必要时可以注入 `EntityManager` / 查询器。
  - System 通过“分组 + 优先级”组织（例如：输入 → 逻辑 → 物理 → 视图同步），第 1 期只实现简单的顺序链表。
  - 在 Laya 的主循环中挂接一个统一的 `EcsWorld.update(deltaTime)` 入口。
- Entity–Laya 绑定：
  - 使用 `ViewComponent`（或等价命名）在 ECS 中记录 Laya 节点引用，或维护 `entityId -> Sprite3D` 的映射。
  - 第 1 期只实现 **ECS → Laya** 的 Transform 同步；如需从 Laya → ECS 的输入/交互，作为扩展点记录在 spec 中。

## Risks / Trade-offs
- 简化组件存储为“按类型的数组/映射”会限制极致性能：
  - 但第 1 期的目标是清晰结构与易用性，可接受。
  - 在设计和接口命名中应避免过度绑定到当前数据结构，以便后续替换实现。
- 仅提供单线程主循环更新：
  - 可读性和调试友好，但无法利用多核。
  - 将在后续阶段通过新的变更引入 Job System / Worker 等机制。
- 将 Laya 节点引用直接存在组件中：
  - 简化 Demo 实现，但增加 ECS 与引擎耦合度。
  - 通过接口抽象与清晰的组件命名减少影响，为后续“渲染层适配层”预留空间。

## Migration Plan
- 第 1 期实现后，后续阶段可以逐步演进：
  - 将当前的“按组件类型数组/映射”替换为 archetype/chunk 结构，但保留公开的查询/迭代接口。
  - 将简单的顺序 System 调度替换为具备依赖图或 Job 调度的系统。
  - 将直接引用 Laya 节点的方式迁移为通过抽象的 `RenderHandle` 或桥接层。

## Open Questions
- 是否需要在第 1 期就提供基础调试工具（例如：Inspector 面板显示实体和组件列表）？
- Demo 场景是否需要支持简单的输入（键盘/鼠标）控制以验证“从 Laya → ECS”方向的数据流？

