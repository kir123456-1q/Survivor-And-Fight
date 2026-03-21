## ADDED Requirements

### Requirement: 等级与升级能力配表结构
系统 SHALL 提供等级与升级能力相关 JSON 配表结构，用于驱动战斗等级、随机候选与升级效果应用。

#### Scenario: 等级表定义经验阈值
- **WHEN** 配置等级表
- **THEN** 每行 SHALL 包含：`id`、`level`、`needExp`、`tierTag`
- **AND** `needExp` SHALL 表示从当前等级升到下一等级所需经验

#### Scenario: 升级池表定义候选规则
- **WHEN** 配置升级池表
- **THEN** 每行 SHALL 包含：`id`、`effectId`、`weight`、`maxStack`、`preConditions`、`exclusiveGroup`、`uiNameKey`、`uiDescKey`、`iconPath`
- **AND** `preConditions` SHALL 支持对等级、已选升级、子弹类型解锁状态等条件表达

#### Scenario: 升级效果表定义生效参数
- **WHEN** 配置升级效果表
- **THEN** 每行 SHALL 包含：`id`、`effectType`、`targetKey`、`op`、`value`、`durationType`
- **AND** `effectType` SHALL 至少支持 `unlockBulletType`、`bulletCount`、`bulletPenetration`、`bulletDamage`、`bulletSpeed`、`bulletDuration`、`fireInterval`

#### Scenario: 配表注册与读取命名空间
- **WHEN** 项目接入等级与升级能力配表
- **THEN** `tables.registry.json` SHALL 注册新增表并映射到统一读表命名空间
- **AND** 运行时 SHALL 可通过 Data 命名空间按主键查询等级、升级池、升级效果数据
