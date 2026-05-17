## 1. 规范与配表（WS-A / WS-C）

- [x] 1.1 评审并通过 `add-combat-skill-loadout-ui` 提案
- [x] 1.2 扩展 `skill_table.json`：13 个 Skillicon 各一行（`iconPath`、`effectSlotCount`、`defaultEquipped`）
- [x] 1.3 扩展 `skill_effect_table.json`：74 个 EffectIcon 各一行（`iconPath`、`effect`、`enabled`、数值列）
- [x] 1.4 更新 `tables.registry.json`（若列变更需同步导表模板）
- [x] 1.5 添加 `tools/list-effect-icons.ps1` 枚举 EffectIcon 文件名供配表校验

## 2. 静态配置（WS-B）

- [x] 2.1 新建 `src/defines/skillSelectDefine.ts`（槽数量、尺寸、间距、长按、Tab 键）
- [x] 2.2 扩展 `src/defines/uiDefine.ts`（面板与节点名常量）
- [x] 2.3 `src/defines/index.ts` re-export `skillSelectDefine`

## 3. ECS 装配状态（WS-D）

- [x] 3.1 新建 `SkillLoadoutState` 组件
- [x] 3.2 新建 `SkillLoadoutModel`（槽位校验、同类拖拽规则）
- [x] 3.3 新建 `SkillLoadoutSyncSystem` 并注册到 `SimpleEcsDemo`
- [x] 3.4 玩家创建时初始化默认三技能与演示 Effect 池

## 4. UI 布局与绑定（WS-E / WS-F）

- [x] 4.1 实现 `SkillSlotLayout.layoutHorizontal`
- [x] 4.2 实现 `SkillIconBinder`（80×80 Skill、47×47 Effect）
- [x] 4.3 实现 `SkillSelectPanelView` 节点查找与刷新
- [x] 4.4 实现 `SkillSelectPanelController`：初始化隐藏面板、Tab 切换、暂停联动
- [x] 4.5 打开面板：隐藏模板 `EffectBtn`，生成 EffectBox 10 槽
- [x] 4.6 生成 `EffectBox_1–3` 内 EffectBtn 槽（按 `effectSlotCount`）
- [x] 4.7 生成 `SkillBox` 内 `SkillBaseBar` 槽（按 `ownedSkillIds`）
- [x] 4.8 同步 `SkillBaseBar1–3` 装备栏图标

## 5. 拖拽（WS-G）

- [x] 5.1 实现 `SkillDragService` 长按检测
- [x] 5.2 EffectBtn ↔ EffectBtn 拖拽与状态回写
- [x] 5.3 SkillBaseBar ↔ SkillBaseBar 拖拽与状态回写
- [x] 5.4 非法落点取消并回弹

## 6. 战斗联动（WS-D / WS-H）

- [x] 6.1 装备栏变更后更新 `Skill` / `PlayerAutoCastSystem` 使用的 skillId
- [x] 6.2 至少 3 个默认 Skill 可在战斗中释放（bullet 或 direct_damage）
- [x] 6.3 `enabled: false` 的 Effect 仅显示图标，不进入 `effectIds` 链

## 7. 验证（WS-H）

- [x] 7.1 进入战斗：SkillSelectPanel 不可见
- [x] 7.2 Tab 打开：面板可见、游戏暂停、10 个 Effect 槽无重叠
- [x] 7.3 Tab 关闭：面板隐藏、游戏继续
- [x] 7.4 拖拽 Effect/Skill 后图标与装配状态一致
- [x] 7.5 运行 `openspec validate add-combat-skill-loadout-ui --strict --no-interactive`

## 8. 战斗 Effect 执行（WS-I）

- [x] 8.1 `EffectExecutor`：`buildSkillCastPlan` / `executeSkillCastPlan`
- [x] 8.2 `Skill.pendingCasts` 队列 + `PlayerAutoCastSystem` 三装备栏独立 CD
- [x] 8.3 `BulletSystem`：连锁多目标、`splitCount` 命中分裂、Effect 行伤害/穿透覆盖
- [x] 8.4 配表 `effect` 扩展：`modifier_split` / `modifier_chain` / `modifier_pierce`
- [x] 8.5 `combatEffectDefine.ts` + OpenSpec `combat-effect-execution` 规范
