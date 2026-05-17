# 工作流划分（Multitask 调度）

本变更按 **文件所有权** 切分，供 Cursor Multitask / 并行 Agent 执行。每个工作流仅修改其「所有权范围」内文件；跨流依赖通过 `INTERFACES.md` 与 WS-A 冻结的字段为准。

## 工作流总览

| ID | 名称 | 所有权范围 | 阻塞条件 |
|----|------|------------|----------|
| WS-A | 规范与契约冻结 | `proposal.md`、`design.md`、`tasks.md`、`INTERFACES.md`、`WORKSTREAMS.md`、`specs/*` | 无 |
| WS-B | 静态常量与 UI 节点名 | `src/defines/skillSelectDefine.ts`、`src/defines/uiDefine.ts`、`src/defines/index.ts` | WS-A 完成 |
| WS-C | 技能/Effect 配表与注册 | `config/skill_table.json`、`config/skill_effect_table.json`、`config/tables.registry.json`、`tools/list-effect-icons.ps1` | WS-A 完成字段冻结 |
| WS-D | 装配 ECS 状态与战斗同步 | `src/ecs/components/SkillLoadoutState.ts`、`src/ecs/systems/SkillLoadoutSyncSystem.ts`、`src/game/skill/SkillLoadoutModel.ts`、`SimpleEcsDemo.ts` 注册片段 | WS-C 完成（需 skill id） |
| WS-E | 槽位布局与图标绑定 | `src/game/ui/skillselect/SkillSlotLayout.ts`、`SkillIconBinder.ts` | WS-B 完成 |
| WS-F | SkillSelectPanel 视图与 Tab 暂停 | `src/game/ui/skillselect/SkillSelectPanelView.ts`、`SkillSelectPanelController.ts`、`MainHudSystem.ts` 或 `SimpleEcsDemo.ts` 挂载 | WS-B、WS-D 完成 |
| WS-G | 长按拖拽 | `src/game/ui/skillselect/SkillDragService.ts` | WS-E、WS-F 完成 |
| WS-H | 集成验证与 OpenSpec 校验 | `tasks.md` 勾选、`openspec validate`、手动战斗 Tab 测试记录 | WS-C–G 完成 |

## 依赖图

```
WS-A ──┬──> WS-B ──┬──> WS-E ──┐
       │           │           ├──> WS-G ──> WS-H
       ├──> WS-C ──┼──> WS-D ──┤
       │           │           │
       │           └──> WS-F ──┘
       └──> (WS-A 自身由提案评审完成)
```

## 并行策略（Multitask）

| 阶段 | 可并行工作流 | 说明 |
|------|----------------|------|
| 1 | WS-A | 单人完成提案评审 |
| 2 | WS-B ∥ WS-C | 常量与配表无文件冲突 |
| 3 | WS-D ∥ WS-E | D 写 ECS，E 写纯 UI 工具 |
| 4 | WS-F | 依赖 B、D |
| 5 | WS-G | 依赖 E、F |
| 6 | WS-H | 全量集成 |

**禁止并行**：WS-C 与 WS-D 同时修改 `SimpleEcsDemo.ts`；由 WS-D 单独负责 Demo 注册，WS-C 仅改 `config/`。

## 各工作流交付定义

### WS-A
- **输出**：通过 `openspec validate add-combat-skill-loadout-ui --strict --no-interactive` 的提案包。
- **完成条件**：所有 Requirement 含 `#### Scenario:`；无模糊词。

### WS-B
- **输出**：`skillSelectDefine.ts` 含 `EFFECT_BOX_SLOT_COUNT=10`、`SKILL_ICON_SIZE=80`、`EFFECT_ICON_SIZE=47`、`LONG_PRESS_MS=300`、`TAB_KEY_CODE`。
- **完成条件**：`defines/index.ts` 已 re-export。

### WS-C
- **输出**：`skill_table` ≥ 13 行、`skill_effect_table` ≥ 74 行；每行含 `iconPath`。
- **完成条件**：`initData` 后 `Data.Skill.GetAll().length >= 13`。

### WS-D
- **输出**：Player 实体创建时挂载 `SkillLoadoutState`；`SkillLoadoutSyncSystem` 将 slot0 同步到 `Skill`。
- **完成条件**：装备 `chain-lightning` 后战斗日志可见对应 skillId。

### WS-E
- **输出**：`layoutHorizontal(10, …)` 无重叠；`bindEffectIcon` 空槽隐藏 `EffectIcon`。
- **完成条件**：单元测试或调试截图验证 10 槽间距。

### WS-F
- **输出**：初始化 `SkillSelectPanel.visible=false`；Tab 切换暂停。
- **完成条件**：打开面板时 `GameSession.paused===true`，关闭为 `false`。

### WS-G
- **输出**：Effect 仅在 EffectBtn 间拖拽；Skill 仅在 SkillBaseBar 间拖拽。
- **完成条件**：跨类落点被拒绝。

### WS-H
- **输出**：`tasks.md` 全部 `[x]`；validate 通过。
- **完成条件**：评审可合并。

## Agent 调度提示词模板

```
你负责 WS-{X}（add-combat-skill-loadout-ui）。
只修改 WORKSTREAMS.md 中 WS-{X} 的所有权文件。
契约以 openspec/changes/add-combat-skill-loadout-ui/INTERFACES.md 为准。
不得修改其他 WS 的文件。完成后列出变更文件与验证命令。
```
