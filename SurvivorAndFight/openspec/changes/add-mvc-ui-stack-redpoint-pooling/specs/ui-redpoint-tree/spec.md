## ADDED Requirements

### Requirement: 红点树节点模型与聚合规则
系统 MUST 提供红点树能力，支持叶子节点状态上报与父节点聚合计算。

#### Scenario: 叶子节点变更触发父节点更新
- **WHEN** 任一叶子节点状态从无红点变为有红点
- **THEN** 系统 MUST 沿父链路执行聚合更新
- **AND** 所有受影响父节点 MUST 在同一更新周期内得到一致结果

#### Scenario: 聚合模式切换
- **WHEN** 节点配置为布尔聚合或计数聚合
- **THEN** 系统 MUST 按配置计算父节点输出
- **AND** 未配置时 MUST 使用默认聚合策略并可被文档化说明

### Requirement: 红点树与 UI 生命周期联动
系统 MUST 在 UI 绑定与解绑过程中自动管理红点订阅关系，避免悬挂监听。

#### Scenario: 界面显示时绑定红点
- **WHEN** UI 模块进入 Shown 状态并声明红点路径
- **THEN** 系统 MUST 自动建立红点订阅并触发一次初始渲染

#### Scenario: 界面销毁时解除绑定
- **WHEN** UI 模块进入 Disposed 状态
- **THEN** 系统 MUST 自动解除红点订阅
- **AND** 后续红点更新 MUST 不再触发该界面的回调
