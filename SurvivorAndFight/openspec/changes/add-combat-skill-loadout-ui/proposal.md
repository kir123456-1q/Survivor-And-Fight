# Change: 战斗技能装配 UI（MainUIPanel / SkillSelectPanel）与技能 Effect 配表化

## Why

`MainUIPanel.lh` 已包含 `SkillBaseBar1–3`、`SkillSelectPanel`、`EffectBox`、`EffectBox_1–3`、`SkillBox` 等节点，但运行时仅由 `MainHudSystem` 更新等级/经验文本，未绑定技能图标、未实现 Tab 暂停切换、未实现 Effect/Skill 格子动态生成与拖拽装配。`assets/atlas/Skillicon`（13 张）与 `assets/atlas/EffectIcon`（74 张）尚无完整配表与战斗逻辑映射。

## What Changes

- 新增 **战斗技能装配 UI** 能力：`SkillSelectPanel` 初始化隐藏；Tab 切换显示并暂停/恢复战斗（`GameSession.paused`）；三个装备栏 `SkillBaseBar1–3` 显示 80×80 技能图标。
- 新增 **格子布局与池化**：`EffectBox` 打开时隐藏演示用 `EffectBtn`，动态生成 10 个横向 `EffectBtn`；`EffectBox_1–3` 按技能详情生成 Effect 槽；`SkillBox` 按持有技能列表生成 `SkillBaseBar` 槽；位置由 `uiDefine` / `skillSelectDefine` 常量计算，槽位不得重叠。
- 新增 **长按拖拽**：含 Effect 的 `EffectBtn` 与含 Skill 的 `SkillBaseBar` 支持长按拾起，仅可放入同类槽（Effect→EffectBtn，Skill→SkillBaseBar）。
- 新增 **技能/Effect 目录配表**：为 13 个 Skill 图标与 74 个 Effect 图标各生成 `skill_table` / `skill_effect_table` 行（含 `iconPath`、`effect` 行为类型、数值字段）；注册到 `tables.registry.json`。
- 新增 **装配状态与战斗桥接**：`SkillLoadoutState` 组件记录 3 装备槽、未装备 Effect 池、各技能 Effect 槽、持有技能列表；`SkillLoadoutSystem` 将装配结果同步到 `Skill` / `PlayerAutoCastSystem` / `SkillSystem`。
- 提供 **Multitask 工作流**（`WORKSTREAMS.md`）与 **接口契约**（`INTERFACES.md`）。

## Impact

- Affected specs: `combat-skill-loadout-ui`（新建）, `skill-effect-catalog`（新建）, `config-json-tables`（扩展）, `skill-effect`（扩展战斗释放与装配联动）
- Affected code: `assets/prefabs/MainUI/MainUIPanel.lh`（仅隐藏演示节点，不改结构）、`src/game/ui/`（新建装配控制器/视图/拖拽）、`src/defines/`（`skillSelectDefine.ts`、`uiDefine.ts` 扩展）、`config/skill_table.json`、`config/skill_effect_table.json`、`config/tables.registry.json`、`src/game/demo/SimpleEcsDemo.ts`、`src/ecs/systems/PlayerAutoCastSystem.ts`
- Related active changes: `add-mvc-ui-stack-redpoint-pooling`（拖拽与槽位生成复用 UI 池化约定）、`add-battle-level-and-random-upgrades`（升级与装配 UI 并存，装配优先驱动主动技能）

## 新建文件清单

| 路径 | 职责 |
|------|------|
| `src/defines/skillSelectDefine.ts` | Tab 键、槽尺寸、间距、长按阈值、默认槽数量 |
| `src/ecs/components/SkillLoadoutState.ts` | 玩家装配运行时状态 |
| `src/game/skill/SkillLoadoutModel.ts` | 装配数据模型（读表 + 槽位校验） |
| `src/game/ui/skillselect/SkillSelectPanelView.ts` | 绑定 MainUIPanel 节点、刷新图标 |
| `src/game/ui/skillselect/SkillSelectPanelController.ts` | Tab 切换、暂停、打开时初始化格子 |
| `src/game/ui/skillselect/SkillSlotLayout.ts` | 横向/网格位置计算 |
| `src/game/ui/skillselect/SkillDragService.ts` | 长按拖拽与同类槽落点 |
| `src/game/ui/skillselect/SkillIconBinder.ts` | 80×80 Skill / 47×47 Effect 图标挂载 |
| `src/ecs/systems/SkillLoadoutSyncSystem.ts` | 装配 → ECS Skill 同步 |
| `config/skill_catalog_table.json` | 13 技能图标元数据（可选与 skill_table 合并扩展列） |
| `config/skill_effect_catalog_table.json` | 74 Effect 图标元数据（可选与 skill_effect_table 合并） |
| `tools/excel-export/templates/skill_catalog.xlsx` | 导表模板（与现有导表工具对齐） |

> 实现阶段若将 catalog 列合并进现有 `skill_table.json` / `skill_effect_table.json`，须删除独立 catalog 文件并更新 `INTERFACES.md` 与 registry；提案默认 **扩展现有表列**，不新增第三张逻辑表。

## 接口文档

详见本变更目录 [`INTERFACES.md`](./INTERFACES.md)。归档时复制到 `docs/add-combat-skill-loadout-ui-interfaces.md`。
