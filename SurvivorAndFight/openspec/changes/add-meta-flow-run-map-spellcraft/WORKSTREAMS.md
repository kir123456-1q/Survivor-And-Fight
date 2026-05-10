# 工作流划分（Multitask 调度）

本文档定义并行智能体的**粒度边界**、**依赖**与**交付 artifact**，供 Cursor Multitask 或同等多会话调度使用。执行任一工作流前须完整阅读 `INTERFACES.md`。

## 工作流总览

| ID | 名称 | 所有权范围 | 阻塞条件 |
|----|------|------------|----------|
| WS-A | 配表与注册骨架 | `docs/config/*`、`tables.registry.json`、define 枚举骨架 | 无 |
| WS-B | 元游戏壳层与流程 | 开始界面、选局界面、`MetaFlowController`、元状态转移 | `INTERFACES.md` 中 `RunSeed`、`MetaView` 字段冻结 |
| WS-C | 跑图生成与跑图状态 | `RunMapGenerator`、`RunMapState`、节点推进与校验 | WS-A 完成注册文件骨架；`RunGraph` 类型冻结 |
| WS-D | 法杖与法术求值 | `WandLoadout`、`SpellEval`、装配校验、施放描述 | WS-A 完成法术相关表骨架；`CastPlan` 类型冻结 |
| WS-E | 战斗集成 | 将 `CastPlan` 接入现有子弹或技能发射路径 | WS-D 输出 `CastPlan`；既有战斗系统代码可读 |

## 依赖图（须遵守的执行顺序）

```
WS-A ──┬──> WS-B
       ├──> WS-C
       └──> WS-D
WS-D ───────> WS-E
WS-C ──┐
WS-B ──┼──> （集成验收：完整跑图一局 + 战斗施放）
```

说明：WS-B 与 WS-C 在 WS-A 交付后可并行；WS-E 仅在 WS-D 交付后开始。

## 各工作流入站 / 出站 artifact

### WS-A
- **输入**：`openspec/changes/add-meta-flow-run-map-spellcraft/specs/*/spec.md` 中对配表字段的约束。
- **输出**：空表或最小示例行的 JSON；已更新的 `tables.registry.json`；`define` 中与枚举对应的常量导出。
- **完成定义**：`openspec validate add-meta-flow-run-map-spellcraft --strict --no-interactive` 通过；启动加载器无报错。

### WS-B
- **输入**：`MetaView`、路由事件名、`RunSeed` 生成规则。
- **输出**：可演示的界面流转：Bootstrap → Title → PreRun → Handoff 到跑图视图占位。
- **完成定义**：无跑图真实数据时允许 Stub `RunMapState`，Stub 类型签名与 `INTERFACES.md` 一致。

### WS-C
- **输入**：`run_map_rules.json` schema；节点类型枚举。
- **输出**：可生成 DAG；玩家选择后继节点后状态一致；非法点击被拒绝。
- **完成定义**：单元级或确定性种子回放生成同一图结构。

### WS-D
- **输入**：`wand_table.json`、`spell_piece_table.json`；兼容标签定义。
- **输出**：三支上限 enforced；装配非法返回错误码；合法装配产出 `CastPlan`。
- **完成定义**：给定输入装配快照，求值输出字节级稳定或可文档化的确定性顺序规则。

### WS-E
- **输入**：`CastPlan`；现有 `BulletSystem` 或技能入口函数签名。
- **输出**：战斗内按输入触发发射或效果；缺失映射时报错并拒绝静默吞掉。
- **完成定义**：最小关卡内三支法杖轮换施放可见反馈。

## Multitask 调度指令模板（供编排复制）

1. **会话 1**：执行 WS-A；禁止修改 `MetaFlowController` 业务逻辑。
2. **会话 2**：在 WS-A 合并后执行 WS-B；仅触碰 `src/game/meta/` 与壳层 UI。
3. **会话 3**：在 WS-A 合并后执行 WS-C；仅触碰 `src/game/run/`。
4. **会话 4**：在 WS-A 合并后执行 WS-D；仅触碰 `src/game/spellcraft/`。
5. **会话 5**：在 WS-D 合并后执行 WS-E；触碰战斗集成点须附带最小回归场景。

合并冲突处理：**同一文件禁止多工作流并行修改**；文件所有权以上表为准；若必须交叉修改，先合并契约 PR 再实现。
