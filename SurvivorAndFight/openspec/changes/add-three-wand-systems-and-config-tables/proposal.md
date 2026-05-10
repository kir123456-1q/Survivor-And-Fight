# Change: 三类魔杖系统与可落地配表

## Why
当前变更集中在法术编程框架与基础跑图流程，缺少可直接进入实现的三类魔杖内容层规格与完整配表。项目必须提供可直接消费的法杖、效果池与平衡参数，确保策划、美术、程序可并行推进。

## What Changes
- 新增三类魔杖体系：近战环绕法杖、远程射击法杖、远程随机攻击法杖；每类必须包含 5 根法杖与 10 个效果。
- 新增效果规格：效果必须包含稀有度、数值字段、兼容标签、冲突集合与出现条件，支持运行时装配校验与池化抽取。
- 新增四张可直接使用的 JSON 表：`wand_table.json`、`wand_effect_table.json`、`wand_effect_pool_table.json`、`wand_balance_table.json`。
- 更新 `docs/config/tables.registry.json`，注册以上新表，供统一配置加载器按 key 读取。
- 新增中文美术提示词文档，覆盖全部法杖与效果图标、技能特效、法杖空位更新 panel 相关 UI 资产。
- 新增 `INTERFACES.md` 与 `WORKSTREAMS.md`，冻结跨模块契约与多线程执行边界。

## Impact
- Affected specs:
  - `wand-spellcraft`（新增三类魔杖与效果内容约束）
  - `config-json-tables`（新增四张魔杖系统配表及注册约束）
- Affected docs:
  - `docs/config/*.json`
  - `docs/wand-art-and-vfx-prompts.zh-CN.md`
- Affected runtime contracts:
  - 法杖模板读取、效果池抽样、冲突校验、平衡参数查表。

## 新建文件清单

| 路径 | 职责 |
|------|------|
| `openspec/changes/add-three-wand-systems-and-config-tables/proposal.md` | 说明变更动机、范围、影响面与交付边界 |
| `openspec/changes/add-three-wand-systems-and-config-tables/design.md` | 跨模块设计决策、数据模型、风险与迁移策略 |
| `openspec/changes/add-three-wand-systems-and-config-tables/tasks.md` | 实施步骤与验收清单 |
| `openspec/changes/add-three-wand-systems-and-config-tables/INTERFACES.md` | 对外接口契约、字段定义与错误码规则 |
| `openspec/changes/add-three-wand-systems-and-config-tables/WORKSTREAMS.md` | 多工作流并行边界、依赖与产出 |
| `openspec/changes/add-three-wand-systems-and-config-tables/specs/wand-spellcraft/spec.md` | 魔杖系统增量规范（能力行为） |
| `openspec/changes/add-three-wand-systems-and-config-tables/specs/config-json-tables/spec.md` | 配表结构与注册增量规范 |
| `docs/config/wand_table.json` | 法杖模板表（至少 15 根） |
| `docs/config/wand_effect_table.json` | 效果表（至少 30 条） |
| `docs/config/wand_effect_pool_table.json` | 效果池权重与出现条件 |
| `docs/config/wand_balance_table.json` | 平衡参数表 |
| `docs/wand-art-and-vfx-prompts.zh-CN.md` | 图标、特效、UI 面板资产提示词文档 |

以上文件须保持一致命名、一致字段语义、一致稀有度枚举，并通过 `openspec validate --strict --no-interactive`。
