## ADDED Requirements

### Requirement: 键盘按键状态查询
系统 SHALL 提供对键盘按键状态的封装，使调用方能够查询指定按键在当前帧是否处于按下状态，且不直接依赖引擎具体 API，便于测试与替换输入源。

#### Scenario: 查询按键是否按下
- **WHEN** 调用方查询某键（如 W/A/S/D）是否按下
- **THEN** 系统 SHALL 返回该键当前帧的按下状态（true/false）
- **AND** 键位 SHALL 通过统一常量或枚举暴露（如 KeyCode.W、KeyCode.A），便于相机等模块使用

#### Scenario: 输入与帧同步
- **WHEN** 每帧在固定时机（如帧初）读取输入
- **THEN** 同一帧内多次查询同一按键 SHALL 得到一致结果
- **AND** 实现 SHALL 基于引擎的键盘事件或轮询 API 封装，保证与渲染帧同步

### Requirement: 鼠标滚轮增量查询
系统 SHALL 提供鼠标滚轮增量查询接口，使调用方能够获取本帧或上一帧的滚轮滚动量，用于相机缩放等逻辑。

#### Scenario: 获取滚轮增量
- **WHEN** 调用方请求滚轮增量（如 getMouseWheelDelta）
- **THEN** 系统 SHALL 返回有符号的滚动量（正为向前/放大方向，负为向后/缩小方向）
- **AND** 增量 SHALL 在每帧可被读取一次后清零或按帧累计，避免重复应用

#### Scenario: 无滚轮输入时为零
- **WHEN** 本帧无滚轮事件
- **THEN** 系统 SHALL 返回 0 或等效“无变化”值，不抛出异常
