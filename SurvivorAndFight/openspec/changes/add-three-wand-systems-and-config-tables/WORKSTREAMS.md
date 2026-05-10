# 工作流划分（Multitask 调度）

## 工作流总览

| ID | 名称 | 所有权范围 | 阻塞条件 |
|----|------|------------|----------|
| WS-A | OpenSpec 文档冻结 | `proposal.md`、`design.md`、`tasks.md`、`INTERFACES.md`、`specs/*` | 无 |
| WS-B | 法杖与效果配表 | `docs/config/wand_table.json`、`wand_effect_table.json` | WS-A 完成字段冻结 |
| WS-C | 效果池与平衡配表 | `docs/config/wand_effect_pool_table.json`、`wand_balance_table.json` | WS-A 完成字段冻结 |
| WS-D | 注册表与校验 | `docs/config/tables.registry.json`、`openspec validate` | WS-B、WS-C 完成 |
| WS-E | 美术提示词文档 | `docs/wand-art-and-vfx-prompts.zh-CN.md` | WS-A 完成命名冻结 |

## 依赖图

```
WS-A ──┬──> WS-B ──┐
       ├──> WS-C ──┼──> WS-D
       └──> WS-E   ┘
```

## 交付定义

### WS-A
- 输入：现有 `openspec/specs` 与 `openspec/changes`。
- 输出：可通过审阅的变更规范。
- 完成条件：所有规范性语句使用 SHALL/MUST/必须，不使用模糊词。

### WS-B
- 输入：`INTERFACES.md` 的 `WandRow` 与 `WandEffectRow` 契约。
- 输出：15 根法杖、30 条效果完整数据。
- 完成条件：每条效果具备 `rarity`、数值字段、`compatible_tags`、`conflict_effect_ids`。

### WS-C
- 输入：`WandEffectPoolRow` 与 `WandBalanceRow` 契约。
- 输出：权重池与基础平衡参数完整数据。
- 完成条件：每个类别和稀有度存在对应数据行。

### WS-D
- 输入：四张新表。
- 输出：更新后的 `tables.registry.json` 与严格校验报告。
- 完成条件：`npx openspec validate <change-id> --strict --no-interactive` 通过。

### WS-E
- 输入：法杖与效果命名。
- 输出：中文提示词文档。
- 完成条件：覆盖全部法杖、全部效果、关键特效与 UI 面板分层提示词。

## 合并规则
- 同一文件仅允许一个工作流写入。
- 字段命名与枚举只能在 WS-A 修改。
- 若发现契约冲突，必须先更新 WS-A 文档再继续。
