## ADDED Requirements

### Requirement: 三装备栏独立自动施法

系统 SHALL 对 `SkillLoadoutState.equippedSkillIds` 中每个非空技能独立维护冷却，并在冷却完成时向 `Skill.pendingCasts` 追加施放请求。

#### Scenario: 三把法杖同时冷却轮转

- **WHEN** 装备栏三格均装配不同 `skillId` 且各自 `cooldownRemain` 为 0
- **THEN** 同一帧或随后帧内 `SkillSystem` 必须分别处理三条 `pendingCasts`
- **AND** 每个技能必须使用各自的 `getCombatEffectIds(loadout, skillId)` 结果

### Requirement: Effect 链顺序构建施放计划

`EffectExecutor` SHALL 按 Effect 槽顺序扫描装配链，并生成 `SkillCastPlan`：

| effect 类型 | 行为 |
|-------------|------|
| `modifier_split` | 为**下一条** `bullet` 增加 `splitCount` |
| `modifier_chain` | 为**下一条** `bullet` 增加 `chainCount` |
| `modifier_pierce` | 为**下一条** `bullet` 增加 `penetration` |
| `bullet` | 生成子弹（可携带上述待生效修饰） |
| `direct_damage` | 对目标施加公式伤害 |

#### Scenario: 分裂修饰下一条子弹

- **WHEN** Effect 链为 `[modifier_split, bullet]` 且 `splitCount >= 1`
- **THEN** 紧随其后的 `bullet` 必须带 `splitCount` 与 `splitRemaining`
- **AND** 命中敌人后 `BulletSystem` 必须扇形分裂子子弹

#### Scenario: 连锁子弹多目标伤害

- **WHEN** `bullet` 携带 `chainCount >= 1` 且命中主目标
- **THEN** 同一次命中事件必须对主目标及半径 `CHAIN_HIT_RADIUS` 内最多 `chainCount` 个额外敌人造成伤害
- **AND** 穿透次数仅消耗一次

### Requirement: 配表数值覆盖子弹表

`skill_effect_table` 行的 `damage`、`penetration`、`chainCount`、`splitCount` SHALL 覆盖或合并进 `BulletSystem.spawnBulletWithOptions`。

#### Scenario: Effect 伤害覆盖子弹表默认伤害

- **WHEN** Effect 行 `damage: 12` 且 `bulletSlot` 指向 `player_bullet_fast_1`
- **THEN** 生成子弹的实际伤害必须以 12 为基准（再乘 UpgradeState 伤害系数）
