## ADDED Requirements

### Requirement: 四角随机怪物出生点
系统 SHALL 提供怪物出生点系统，并将怪物出生位置限定在地图四个角点坐标集合中。

#### Scenario: 刷怪时出生点来自四角集合
- **WHEN** 刷怪系统请求生成一个怪物
- **THEN** 出生点 SHALL 从左上、右上、左下、右下四个角点中随机选择
- **AND** 生成后的怪物实体 Position SHALL 等于被选择的角点坐标

#### Scenario: 四角集合可配置
- **WHEN** 地图尺寸或边界发生变化
- **THEN** 系统 SHALL 支持更新四个角点坐标
- **AND** 后续新生成怪物 SHALL 使用更新后的四角坐标集合

### Requirement: 出生系统与刷怪流程集成
系统 SHALL 在怪物创建流程中调用出生点系统，并在怪物创建当帧完成初始位置写入。

#### Scenario: 生成当帧完成位置初始化
- **WHEN** 怪物实体被创建
- **THEN** 出生点系统 SHALL 在该实体进入移动/行为系统前写入 Position
- **AND** 同一实体在本次生成流程中 SHALL 只写入一次初始出生位置
