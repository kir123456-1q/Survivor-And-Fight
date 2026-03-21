# Change: 构建战斗等级与随机升级能力

## Why
当前战斗系统已具备基础子弹、血量与技能释放能力，但缺少可持续成长循环（击杀收益 -> 升级抉择 -> 战斗构筑），导致中后期战斗深度不足。  
同时，现有子弹能力偏静态（依赖固定配表与固定命中半径），需要补齐可扩展的升级驱动机制，支撑“新子弹类型、子弹数量、穿透与数值提升”等成长路径。

## What Changes
- 新增战斗等级系统：击杀怪物获得经验，达到阈值后升级，并支持多级经验曲线配置。
- 新增随机升级能力系统：每次升级弹出随机候选项（默认 3 选 1），支持权重、前置条件、重复上限与互斥约束。
- 新增升级效果类型（升级能力）：
  - 获取新的子弹类型（如分裂弹、散射弹、回旋弹等可扩展类型）
  - 增加每次发射子弹数量（multi-shot）
  - 增加子弹穿透次数（penetration）
  - 提升子弹基础数值（伤害、速度、持续时间、发射间隔等）
- 补充战斗优化约束：将战斗成长关键参数从业务逻辑中抽离到配表/define，避免后续扩展时修改核心系统。
- 补充升级展示与选择交互流程定义（暂停战斗、展示候选、确认后生效、恢复战斗）。

## Impact
- Affected specs:
  - `battle-level-upgrade`（新增）
  - `config-json-tables`（新增升级相关配表结构约束）
- Affected code (planned):
  - `src/game/progression/LevelSystem.ts`（新增）
  - `src/game/progression/UpgradeRollSystem.ts`（新增）
  - `src/game/progression/UpgradeApplySystem.ts`（新增）
  - `src/game/bullet/BulletSystem.ts`（改造：支持升级后的多子弹/穿透/数值缩放）
  - `src/game/skill/*`（改造：技能发射逻辑与升级效果融合）
  - `src/game/ui/*`（新增或改造：升级选择面板与战斗暂停交互）
  - `src/defines/progressionDefine.ts`（新增静态配置）
  - `src/defines/bulletDefine.ts`（补充可配置成长参数）
  - `src/defines/index.ts`（导出新增 define）
  - `docs/config/level_table.json`（新增）
  - `docs/config/upgrade_pool_table.json`（新增）
  - `docs/config/upgrade_effect_table.json`（新增）
  - `docs/config/tables.registry.json`（注册新增表）
- Art resources (planned):
  - 升级面板预制体：`assets/prefabs/SceneUI/LevelUpPanel.lh`
  - 升级卡片/按钮样式资源（3 选 1 UI）
  - 升级图标资源（子弹类型、数量、穿透、伤害、攻速、持续时间）
  - 新子弹类型预制体（如散射弹、分裂弹、回旋弹对应 `.lh`）
  - 子弹命中特效与升级确认反馈特效（可选）
