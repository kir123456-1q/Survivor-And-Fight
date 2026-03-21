## ADDED Requirements

### Requirement: UI 栈作为界面导航唯一入口
系统 MUST 使用 UI 栈统一管理可导航界面，所有全屏界面切换 MUST 通过栈操作完成。

#### Scenario: 入栈显示新界面
- **WHEN** 当前栈顶界面存在且收到 push 新界面请求
- **THEN** 系统 MUST 将新界面压入栈顶并设置为可见
- **AND** 原栈顶界面 MUST 进入 Hidden 状态

#### Scenario: 出栈返回上级界面
- **WHEN** 栈顶界面收到 pop 请求
- **THEN** 系统 MUST 移除当前栈顶并恢复上一个界面的显示状态
- **AND** 当栈为空时 MUST 返回明确的空栈结果而非抛出未处理异常

### Requirement: UI 栈操作一致性与并发保护
系统 MUST 保证栈操作原子性，并在同一帧或同一事务内保持顺序一致。

#### Scenario: 同帧多次切换请求
- **WHEN** 同一帧内收到多个 push/pop/replace 请求
- **THEN** 系统 MUST 按提交顺序串行处理
- **AND** 栈深与栈顶结果 MUST 可预测且可复现

#### Scenario: 非法跨层可见性操作
- **WHEN** 非栈顶界面尝试直接修改栈顶导航状态
- **THEN** 系统 MUST 拒绝该操作并记录告警日志
