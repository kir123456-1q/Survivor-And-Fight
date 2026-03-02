## 第 1 期：ECS 核心框架 MVP – 提示词文档

### 总体规划提示词（生成本期整体方案用）

```text
你现在是熟悉 LayaAir 3.x + TypeScript 的资深游戏架构师，请帮我为“ECS 核心框架 MVP”做详细方案设计（暂不直接写代码）。

项目背景：
- 引擎：LayaAir 3.x（WebGL2/WebGPU，H5 目标平台）
- 语言：TypeScript
- 目标：实现一个“类 Unity DOTS 思想”的轻量 ECS 核心，先满足少量实体的清晰结构和可扩展性，再为后续大规模优化打基础。

请输出的内容包括（中文）：
1. **目标与非目标**  
   - 明确本期要实现的能力（例如：Entity 管理、Component 存储、System 调度、与 Laya 节点的基础绑定等）。  
   - 明确本期不会做的事情（例如：多线程、复杂 archetype、极限性能优化等）。

2. **模块划分方案**  
   - ECS 核心模块：Entity、Component、System 的职责边界和依赖关系。  
   - 组件类型设计：DataComponent、TagComponent、SharedComponent 的初始定义和适用场景。  
   - Entity–Laya 绑定模块：如何把 Entity 与 Laya 节点（2D/3D）关联和同步 Transform。  
   - Demo 场景模块：一个最小 Demo（几十个实体移动/旋转）所需的系统和组件列表。

3. **数据结构与接口设计建议**  
   - 建议的 TypeScript 接口/类型结构（只写接口/伪代码，不写完整实现）。  
   - Component 存储方式建议（例如：按组件类型的数组 + entityId 索引）以及后续扩展到更复杂内存布局的预留点。  
   - System 更新顺序、优先级/分组设计思路。

4. **后续扩展建议**  
   - 本期设计如何为“大规模实体管理”和“性能优化期”留出扩展空间。  
   - 哪些地方刻意保持简单，未来再通过新一期来重构或优化。

请尽量结构化输出（使用小节标题和列表），方便后续直接拆成实现任务。
```

### 子任务提示词：ECS 内核与实体管理设计

```text
请只专注于“ECS 内核与实体管理”这一块，对下面问题进行详细设计（不写代码实现，只写接口和方案）：

1. **Entity 系统设计**  
   - Entity 的标识形式（例如：number ID、对象引用等）及优缺点对比，推荐一种。  
   - Entity 创建/销毁流程（包括如何复用 ID，避免内存碎片）。  
   - Entity 上下文中如何查询“某个 Entity 拥有哪些 Component”。

2. **Component 注册与存储设计**  
   - Component 类型如何声明（接口、class、或纯数据对象）。  
   - Component 在内存中的存储结构（例如：每个组件类型维护一个稠密数组 + entityId 索引）。  
   - 常见操作（添加组件、移除组件、按组件类型遍历）的时间复杂度预期。

3. **System 注册与更新循环**  
   - System 的基本接口设计（更新函数签名、依赖注入方式）。  
   - 如何组织 Systems 的执行顺序（例如：按“逻辑/物理/渲染同步”分组加优先级）。  
   - 在 Laya 的主循环里如何挂接 ECS 更新（伪代码层面说明）。

请用 TypeScript 风格的伪接口来说明关键 API（例如 `interface EntityManager { ... }`），但不要写完整实现。
```

### 子任务提示词：Entity–Laya 绑定与 Demo 设计

```text
只针对“Entity 与 Laya 节点绑定 + 最小 Demo 场景”做设计，请回答：

1. **绑定策略设计**  
   - 推荐的绑定结构（例如：在 ECS 里有 `ViewComponent` 记录 Laya 节点引用，或用映射表 `entityId -> Sprite3D` 等）。  
   - Transform 同步流程：  
     - 从 ECS → Laya（例如位置更新）  
     - 是否需要从 Laya → ECS（例如输入/交互），如果需要，如何设计。

2. **Demo 场景需求梳理**  
   - 设计一个“几十个实体在场景中移动/旋转”的 Demo：  
     - 需要哪些组件（例如 Position、Velocity、Rotation、View、Tag_Player/Tag_Enemy 等）。  
     - 需要哪些 Systems（MovementSystem、RotationSystem、ViewSyncSystem 等）。  
   - 该 Demo 用于后续验证 ECS 是否易用和可扩展，说明如何用它来测试/调试。

3. **接口与目录建议**  
   - 给出推荐的目录结构（只写结构，不创建文件）：例如  
     - `src/ecs/core`  
     - `src/ecs/components`  
     - `src/ecs/systems`  
     - `src/game/demo`  
   - 简要说明各目录的职责。

请用清晰的小节与列表形式给出答案，方便后续直接转换成任务和代码实现。
```

