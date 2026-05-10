## ADDED Requirements

### Requirement: 元游戏视图序列
系统 SHALL 在应用完成引导加载后，将玩家置于开始界面作为根元视图；开始界面 SHALL 提供进入选局界面的确定操作。

#### Scenario: 启动进入开始界面
- **WHEN** 应用完成初始化且未处于调试旁路入口
- **THEN** 当前元视图 SHALL 为开始界面

#### Scenario: 进入选局界面
- **WHEN** 玩家在开始界面触发「开始游戏」或等价主操作
- **THEN** 当前元视图 SHALL 切换为选局界面

### Requirement: 选局界面与跑图衔接
系统 SHALL 提供选局界面作为进入随机三大关跑图之前的独立界面；玩家在该界面确认开局参数后 SHALL 生成跑图种子并进入跑图视图。

#### Scenario: 确认开局进入跑图
- **WHEN** 玩家在选局界面确认开局
- **THEN** 系统 SHALL 生成 `RunSeed` 并切换到跑图视图
- **AND** 跑图 SHALL 基于该种子生成 `RunGraph`

### Requirement: 元视图枚举完整性
元视图类型 SHALL 至少包含：`Title`、`PreRun`、`RunMap`、`Combat`、`PauseOverlay`；控制器 SHALL 拒绝未声明的迁移目标。

#### Scenario: 拒绝非法迁移目标
- **WHEN** 调用方请求迁移到未在 `MetaView` 枚举中定义的值
- **THEN** 迁移 SHALL 失败并返回 `META_INVALID_VIEW` 错误码
