# Change: 引入 MVC UI 栈式系统与红点树池化机制

## Why
当前 UI 组织方式缺少统一生命周期与栈式管理约束，导致界面切换、状态回收和跨界面通知（红点）缺乏一致性。需要定义可落地的 MVC UI 能力规格，支撑后续稳定扩展。

## What Changes
- 新增 `ui-mvc-lifecycle` 规格，定义 Model/View/Controller 职责边界、初始化流程和生命周期阶段。
- 新增 `ui-stack-management` 规格，定义 UI 栈的入栈、出栈、遮罩、返回和并发操作约束。
- 新增 `ui-redpoint-tree` 规格，定义红点树节点注册、聚合计算、事件驱动更新和界面解绑行为。
- 新增 `ui-object-pool` 规格，定义 UI 对象自动池化、复用与清理策略，并与生命周期联动。
- 通过 `design.md` 描述架构决策、状态机边界和分阶段落地策略。

## Impact
- Affected specs: `ui-mvc-lifecycle`, `ui-stack-management`, `ui-redpoint-tree`, `ui-object-pool`
- Affected code: UI 基础框架层（界面基类、控制器基类、UI 路由/栈管理器、红点服务、对象池服务）及与界面切换相关的调用点
