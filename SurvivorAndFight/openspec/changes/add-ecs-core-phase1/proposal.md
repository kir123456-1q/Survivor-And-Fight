# Change: 为第 1 期 ECS 核心框架 MVP 定义能力与边界

## Why
当前项目计划在 LayaAir 3.x + TypeScript 上实现一个“类 Unity DOTS 思想”的轻量 ECS 核心，用于后续玩法开发与性能优化迭代。
需要通过 OpenSpec 明确第 1 期（MVP）的目标与非目标、能力边界和模块划分，避免一开始就过度设计或偏离重点。

## What Changes
- 定义第 1 期 **ECS 核心能力**（实体管理、组件存储、系统调度）及与 Laya 主循环的集成方式。
- 定义第 1 期 **Entity–Laya 绑定与最小 Demo 场景能力**，用于验证 ECS 可用性和扩展性。
- 明确第 1 期的 **非目标**（多线程、复杂 archetype、极致性能优化等），将其作为后续阶段的扩展方向。
- 提供一套与大模型协作的 **提示词约束与输出结构期望**，方便后续通过 AI 生成设计与实现任务。

## Impact
- **Affected specs（新增能力）**
  - `ecs-core`：ECS 内核与实体管理的最小可用能力。
  - `ecs-laya-binding-demo`：Entity–Laya 绑定与最小 Demo 场景能力。
- **Affected code（预期涉及的主要区域，后续实现阶段使用）**
  - `src/ecs/core`：ECS 内核与实体管理实现。
  - `src/ecs/components`：基础组件定义。
  - `src/ecs/systems`：核心系统与更新调度。
  - `src/game/demo`：用于验证 ECS 核心的 Demo 场景与集成逻辑。

