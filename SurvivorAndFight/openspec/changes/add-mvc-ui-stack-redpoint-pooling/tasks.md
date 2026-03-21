## 1. Specification
- [ ] 1.1 确认 `ui-mvc-lifecycle`、`ui-stack-management`、`ui-redpoint-tree`、`ui-object-pool` 四个能力边界与术语定义
- [ ] 1.2 完成四个能力的 OpenSpec delta 文档并补全场景覆盖（正常流、异常流、并发流）
- [ ] 1.3 通过 `openspec validate add-mvc-ui-stack-redpoint-pooling --strict --no-interactive`

## 2. Framework Implementation
- [ ] 2.1 新增 MVC UI 基类与生命周期接口（初始化、显示、隐藏、销毁、重置）
- [ ] 2.2 实现 UI 栈管理器（push/pop/replace/clearToRoot）及栈操作保护
- [ ] 2.3 实现红点树服务（节点注册、父子聚合、事件通知、解绑清理）
- [ ] 2.4 实现 UI 对象池服务（自动回收、复用重置、容量与过期策略）

## 3. Integration & Validation
- [ ] 3.1 选取至少 2 个典型界面接入 MVC + UI 栈流程并验证返回链路
- [ ] 3.2 选取至少 1 条菜单链路接入红点树并验证父节点聚合正确性
- [ ] 3.3 在高频开关界面验证对象池命中与状态重置无泄漏
- [ ] 3.4 补充自动化或脚本化验证：生命周期顺序、栈一致性、红点更新、池复用
