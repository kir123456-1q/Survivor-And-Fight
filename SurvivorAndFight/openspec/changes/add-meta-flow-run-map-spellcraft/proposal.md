# Change: 元游戏流程、爬塔跑图与法杖法术编程

## Why
当前产品缺少从启动到单局内的完整元游戏闭环，局外无稳定入口与选局流程，局内缺少可组合深度构筑。需要同时定义：标题与选局壳层、随机三大关爬塔式跑图、以及受 Noita 启发的法杖槽位与法术链式编程，使战斗与成长系统可长期扩展。

## What Changes
- 新增元游戏壳层：启动后进入开始界面；经选局界面进入一次新跑；跑图与局内战斗之间状态传递受控。
- 新增跑图系统：每局随机生成三个大关（按序推进），每关含多层有向无环图；节点类型至少包含篝火、商店、普通战斗、精英战斗、未知事件；玩家在已解锁节点上选择路线推进。
- 新增法杖法术编程：单局内同时最多装备三支法杖；每支法杖具备独立槽位表；槽位装配「子弹类法术」与「修饰类法术」等效果，并定义组合解析与施放执行顺序。
- 新增配表与注册项：跑图图式、节点类型、法杖模板、法术与修饰器、兼容规则等 JSON 表及 `tables.registry.json` 登记项。
- 定义多工作流实现边界与对外接口，支持多智能体按工作流并行实现与 handoff，详见 `INTERFACES.md` 与 `WORKSTREAMS.md`。

## Impact
- Affected specs: `meta-game-shell`（新增）、`roguelite-run-map`（新增）、`wand-spellcraft`（新增）、`config-json-tables`（新增登记与 schema 约束条目）
- Affected code（计划落点，以设计评审后路径为准）:
  - `src/game/meta/*`：元游戏状态机、壳层 UI 路由
  - `src/game/run/*`：跑图生成、跑图状态、节点解析
  - `src/game/spellcraft/*`：法杖、槽位、法术图或链求值
  - `src/defines/*`：本变更相关 define 文件与 `index.ts` 导出
  - `docs/config/*`：新增或扩展 JSON 配表与注册
- 接口与多智能体分工：详见本目录下 `INTERFACES.md`、`WORKSTREAMS.md`

## 新建文件清单

| 路径 | 职责 |
|------|------|
| `openspec/changes/add-meta-flow-run-map-spellcraft/INTERFACES.md` | 跨模块数据契约、服务方法签名、事件与配表主键 |
| `openspec/changes/add-meta-flow-run-map-spellcraft/WORKSTREAMS.md` | 多智能体工作流划分、依赖、输入输出 artifact |
| `openspec/changes/add-meta-flow-run-map-spellcraft/design.md` | 架构决策、非目标、风险与默认约定 |
| `docs/add-meta-flow-run-map-spellcraft-art-ui.zh-CN.md` | 本变更所需美术资源与 UI 制作项（中文） |
| `src/game/meta/MetaGameState.ts` | 元游戏状态枚举与转移条件（实现阶段） |
| `src/game/meta/MetaFlowController.ts` | 开始界面、选局界面、进入跑图的生命周期（实现阶段） |
| `src/game/run/RunMapGenerator.ts` | 三大关、层、节点、边生成（实现阶段） |
| `src/game/run/RunMapState.ts` | 当前位置、已访问、可推进集合（实现阶段） |
| `src/game/spellcraft/WandLoadout.ts` | 三法杖上限、槽位装配与校验（实现阶段） |
| `src/game/spellcraft/SpellEval.ts` | 槽位链或图求值，输出施放描述（实现阶段） |
| `docs/config/run_map_rules.json` | 跑图生成规则参数（实现阶段） |
| `docs/config/wand_table.json` | 法杖模板（实现阶段） |
| `docs/config/spell_piece_table.json` | 法术片段（子弹、修饰器）定义（实现阶段） |

对外接口以 `INTERFACES.md` 为权威说明；实现阶段须保持与该文档同步直至归档并入 `docs/` 或 `openspec/specs/` 约定位置。
