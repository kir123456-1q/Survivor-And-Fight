## ADDED Requirements

### Requirement: 同时装备法杖上限
玩家在单局战斗状态下 SHALL 至多同时持有三支已装备法杖；系统 SHALL 使用固定三槽位容器表示，未解锁槽位以空占位表达。

#### Scenario: 第四支拒绝
- **WHEN** 当前已存在三支非空法杖装备
- **THEN** 再次调用 `setWand` 引入第四支非空法杖的请求 SHALL 返回错误码 `WAND_LIMIT`

### Requirement: 法杖槽位装配
每支法杖实例 SHALL 绑定一个法杖模板；模板 SHALL 声明有序槽位列表；槽位 SHALL 分类为 `Projectile`、`Modifier`、`Utility` 至少三类语义；装配 SHALL 校验片段与槽语义及兼容标签。

#### Scenario: 兼容装配成功
- **WHEN** `equipPiece` 传入的 `SpellPieceId` 与该槽声明的语义及兼容集合一致
- **THEN** 操作 SHALL 返回 `ok: true` 且槽位内容更新

#### Scenario: 不兼容装配失败
- **WHEN** `equipPiece` 传入的片段与该槽语义或兼容集合冲突
- **THEN** 操作 SHALL 返回 `ok: false` 且槽位内容保持不变

### Requirement: 施放求值输出
系统 SHALL 提供 `evalCast(loadout, wandIndex)`；成功时 SHALL 输出包含有序步骤列表的 `CastPlan`；步骤顺序 SHALL 由槽位顺序与片段声明的执行相位合并规则唯一确定。

#### Scenario: 求值确定性
- **WHEN** 输入 `Loadout` 与 `wandIndex` 不变且片段配置不变
- **THEN** 连续两次求值产生的 `CastPlan.steps` SHALL 完全一致

### Requirement: 战斗消费契约
战斗帧或技能系统 SHALL 仅通过 `CastPlan` 驱动物理发射与修饰应用；禁止绕过 `CastPlan` 直接拼接子弹参数而造成与装配快照不一致。

#### Scenario: 缺失映射须失败 loud
- **WHEN** `CastPlan` 某一步引用 id 在战斗侧不存在映射
- **THEN** 系统 SHALL 报错或返回 `CAST_*` 错误码；禁止静默忽略该步骤
