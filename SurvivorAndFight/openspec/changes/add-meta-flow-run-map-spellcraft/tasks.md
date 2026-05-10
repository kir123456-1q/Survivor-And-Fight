# Tasks: add-meta-flow-run-map-spellcraft

实现顺序以 `WORKSTREAMS.md` 为准；下列编号对应提案验收。

## WS-A 配表与注册
- [ ] A.1 新增 `run_map_rules.json`、`wand_table.json`、`spell_piece_table.json` 最小 schema 与示例行
- [ ] A.2 更新 `docs/config/tables.registry.json` 登记上述逻辑表与读取名
- [ ] A.3 在 `src/defines/` 增加 `metaDefine.ts`、`runMapDefine.ts`、`spellcraftDefine.ts`（按模块拆分）并在 `index.ts` 导出枚举与错误码前缀常量

## WS-B 元游戏壳层
- [ ] B.1 实现 `MetaGameState` 与 `MetaFlowController`，覆盖 Bootstrap → Title → PreRun → RunMap 的转移
- [ ] B.2 实现开始界面视图与选局界面视图，并与控制器绑定事件 `meta.run.confirm`
- [ ] B.3 在选局确认时生成 `RunSeed` 并派发 `meta.run.confirm`

## WS-C 跑图
- [ ] C.1 实现 `RunMapGenerator`：三大关、层、DAG、终点可达性校验与失败重 roll
- [ ] C.2 实现 `RunMapState` 与 `selectNext` 校验；派发 `run.node.selected`
- [ ] C.3 跑图视图展示当前节点、可达后继；点击非法节点须拒绝并返回 `MAP_*` 错误码

## WS-D 法杖法术
- [ ] D.1 实现 `Loadout` 三槽模型与 `setWand` / `equipPiece` 校验
- [ ] D.2 实现 `SpellEval`，输出 `CastPlan`；非法装配返回 `WAND_*` 或 `CAST_*`
- [ ] D.3 单元或确定性用例覆盖：双修饰器顺序、空槽、超限法杖数

## WS-E 战斗集成
- [ ] E.1 将 `CastPlan` 映射到现有子弹或技能发射入口；无法映射时抛错或记录错误码
- [ ] E.2 战斗入口消费 `combat.enter` 载荷；离开战斗回到跑图状态机

## 合入前检查
- [ ] V.1 运行 `openspec validate add-meta-flow-run-map-spellcraft --strict --no-interactive`
- [ ] V.2 将 `INTERFACES.md` 复制到 `docs/add-meta-flow-run-map-spellcraft-interfaces.md`（归档前或合入时执行）
