## 1. 规格与契约
- [x] 1.1 完成 `proposal.md`，明确范围、影响与新建文件清单
- [x] 1.2 完成 `design.md`，冻结数据模型与关键决策
- [x] 1.3 完成 `INTERFACES.md`，定义接口字段与错误码约定
- [x] 1.4 完成 `WORKSTREAMS.md`，定义并行工作流和阻塞关系
- [x] 1.5 完成 `specs/wand-spellcraft/spec.md` 与 `specs/config-json-tables/spec.md`

## 2. 配表交付
- [x] 2.1 新建 `docs/config/wand_table.json`，提供至少 15 根法杖
- [x] 2.2 新建 `docs/config/wand_effect_table.json`，提供至少 30 条效果
- [x] 2.3 新建 `docs/config/wand_effect_pool_table.json`，提供权重与出现条件
- [x] 2.4 新建 `docs/config/wand_balance_table.json`，提供基础平衡参数
- [x] 2.5 更新 `docs/config/tables.registry.json`，登记新表

## 3. 美术提示词文档
- [x] 3.1 新建 `docs/wand-art-and-vfx-prompts.zh-CN.md`
- [x] 3.2 覆盖全部法杖与效果 icon 提示词
- [x] 3.3 覆盖近战环绕、反弹、分裂、爆炸、随机弹道等特效提示词
- [x] 3.4 覆盖法杖空位更新 panel 的底图、槽位、高亮、value 层提示词

## 4. 校验
- [x] 4.1 运行 `npx openspec validate add-three-wand-systems-and-config-tables --strict --no-interactive`
- [x] 4.2 修复校验错误直至通过
