# Design: 战斗技能装配 UI 与配表化

## Context

- UI 类型：**Laya UI2**（`GPanel` / `GBox` / `GImage`），预制体 `assets/prefabs/MainUI/MainUIPanel.lh`。
- 战斗暂停：已有 `GameSession.paused`，各 System 通过 `isPaused()` 早退。
- 技能释放：已有 `Skill` 组件、`SkillSystem`、`PlayerAutoCastSystem`，当前仅 `player_auto_shot` 一条配表。
- 资源：`Skillicon` 13 张、`EffectIcon` 74 张 PNG，文件名即稳定 id 来源（kebab-case）。

## Goals / Non-Goals

### Goals

- Tab 键打开/关闭 `SkillSelectPanel`，打开时暂停、关闭时恢复。
- 三装备栏与装配面板数据一致；图标尺寸 Skill 80×80、Effect 47×47。
- EffectBox 10 槽横向无重叠；EffectBox_1–3 / SkillBox 按配置槽数动态生成。
- 长按拖拽，同类槽互换/放置。
- 13 Skill + 74 Effect 全量配表化，战斗逻辑通过 `effect` 类型字段映射到现有 `SkillSystem` / `BulletSystem` 能力子集。

### Non-Goals

- 本变更不实现全部 74 种 Effect 的独立 VFX 预制体；每种 Effect 须映射到已有或占位 `bullet` / `direct_damage` / `modifier` 行为。
- 不修改 `MainUIPanel.lh` 节点层级结构（仅代码控制 `visible` 与动态子节点）。
- 不实现网络同步或存档持久化（装配状态仅本局 ECS 内存）。

## Decisions

### D1: 配表扩列而非新建 Catalog 表

- **决策**：在现有 `skill_table.json`、`skill_effect_table.json` 增加列：`iconPath`、`displayName`、`effectSlotCount`（仅 Skill）、`sortOrder`、`tags`。
- **理由**：与 `Data.Skill` / `Data.SkillEffect` 读表路径一致，避免重复注册表。
- **id 规则**：Skill id = 图标文件名（如 `chain-lightning`）；Effect id = 图标文件名去掉 `fx_` 前缀（如 `fx_shot_split_two_icon` → `shot_split_two_icon`）。

### D2: 装配状态存于 ECS 组件

- **决策**：新增 `SkillLoadoutState` 挂在 Player 实体；UI 只读写该组件，经 `SkillLoadoutSyncSystem` 写入 `Skill` 与自动施法配置。
- **理由**：与 ECS 战斗循环一致，Tab 暂停时 System 不更新战斗但 UI Controller 仍可运行。

### D3: 槽位布局纯计算

- **决策**：`SkillSlotLayout` 根据 `EFFECT_BOX_SLOT_COUNT=10`、`EFFECT_BTN_WIDTH/HEIGHT`、`EFFECT_BTN_GAP` 计算 x；公式：`x_i = i * (width + gap)`，`y = 0`（相对父 `GBox`）。
- **理由**：满足「通过计算大小得出、不重叠」；禁止在业务代码硬编码每个槽坐标。

### D4: 拖拽同类限制

- **决策**：`SkillDragService` 维护 `DragKind: 'effect' | 'skill'`；落点须为注册的同类 `DropTarget`。
- **长按阈值**：`LONG_PRESS_MS = 300`（`skillSelectDefine.ts`）。

### D5: Effect 行为类型映射（已实现）

| `effect` 字段 | 战斗实现 |
|---------------|----------|
| `bullet` | `EffectExecutor` → `BulletSystem.spawnBulletWithOptions`（`damage`/`penetration`/`chainCount`/`splitCount` 来自行） |
| `modifier_split` | 为下一条 `bullet` 设置 `splitCount`，命中后扇形分裂 |
| `modifier_chain` | 为下一条 `bullet` 设置 `chainCount`，同次命中连锁额外目标 |
| `modifier_pierce` | 为下一条 `bullet` 增加 `penetration` |
| `direct_damage` | 公式直伤（`params` / `damage` 列） |

连锁半径：`CHAIN_HIT_RADIUS`（`combatEffectDefine.ts`）。多技能施法：`PlayerAutoCastSystem` 对三装备栏分别 `pendingCasts`。

### D6: Tab 输入与 MainHud 解耦

- **决策**：新建 `SkillSelectPanelController`，在 `SimpleEcsDemo` 或 `MainHudSystem` 初始化面板后注册 `Laya.stage` 键盘监听；Tab `keydown`/`keyup` 防抖切换。
- **理由**：`MainHudSystem` 保持 HUD 刷新职责，装配 UI 独立 Controller。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 74 Effect 全实现工作量大 | 首版全部配表 + 图标展示；战斗仅保证每 Skill 至少 1 条可释放 Effect；其余标记 `enabled: false` 或 fallback 子弹 |
| UI2 拖拽事件与 GBox 子节点冲突 | 拖拽层使用顶层 `GPanel` 代理图标跟随指针 |
| 动态生成 10+ 槽与对象池 | 复用 `add-mvc-ui-stack-redpoint-pooling` 的 UI 池化；`EffectBtn` 从 prefab `b0c7f4b6-...` 实例化 |

## Migration Plan

1. 扩展 JSON 配表与 registry，运行 `initData` 验证 `Data.Skill.GetAll()` 行数 ≥ 13。
2. 部署 UI 代码；进入战斗后 Tab 打开面板，确认 `SkillSelectPanel.visible === false` 于初始化帧。
3. 默认装备 3 个 Starter Skill（配表 `defaultEquipped: true`）；旧 `player_auto_shot` 保留为 fallback id。

## Open Questions

| 项 | 当前决策 |
|----|----------|
| 每个技能的 Effect 槽数量 | 默认 8，由 `skill_table.effectSlotCount` 配置 |
| SkillBox 最大持有技能数 | 默认 12，由 `skillSelectDefine.SKILL_INVENTORY_MAX` 配置 |
| 关闭面板是否自动保存装配 | 是；每次落点拖拽结束即写 `SkillLoadoutState` |
