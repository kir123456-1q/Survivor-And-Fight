# Design: 子弹、血量、血条 UI 与碰撞验证

## Context
- 依赖：add-ecs-gameplay-phase1（实体 Tag、Attribute hp/maxHp、Skill、技能/effect 配表）、config-table-loader、Laya 预制体与 3D UI。
- 目标：玩家与怪物具备基础攻击技能（发射子弹）、基础 hp/maxHp；血条（BloodBar > ProgressBar）随血量更新；子弹仅对目标阵营生效；配置与子弹属性全部进 JSON 配表。

## Goals / Non-Goals
- Goals:
  - 角色表与子弹表结构明确，含预制体路径、Body UI 路径、子弹属性（持续时间、速度、伤害、穿透次数）。
  - 玩家子弹（simple.lh）仅对怪物实体造成伤害；怪物子弹（MonsterButtle.lh）仅对玩家实体造成伤害。
  - 玩家/怪物通过 3D UI 绑定 Body，Body 内 BloodBar > ProgressBar 根据 Attribute hp、maxHp 更新 value。
  - 子弹具备碰撞体，碰撞检测后按阵营过滤再扣血、扣穿透次数。
- Non-Goals:
  - 不实现复杂弹道、AOE、多段伤害；本阶段仅直线飞行与单次碰撞结算。
  - 血条样式、动画、死亡表现由后续变更补充。

## Decisions
- **角色表（Character）**：主键 id。字段须包含 prefabPath（如 prefabs/character/Player.lh）、bodyPrefabPath（如 prefabs/SceneUI/PlayerBody.lh）、默认子弹预制体路径（或由技能/effect 的 bulletSlot 指定）、hp、maxHp；可扩展 atk 等。通过 Tag 或 roleType 区分玩家/怪物，便于筛选器与碰撞阵营判断。
- **子弹表（Bullet）**：主键 id。字段须包含 prefabPath、duration（持续时间秒）、speed（飞行速度）、damage、penetration（穿透次数，0 表示命中即消失）。可选 ownerType：player | monster，用于碰撞时过滤目标；若表中不存则由释放方实体 Tag 推导。
- **碰撞阵营**：子弹携带「来源阵营」（player 或 monster）；碰撞时目标实体须有 MonsterTag 或 PlayerTag；规则为：玩家子弹仅当目标为 MonsterTag 时生效，怪物子弹仅当目标为 PlayerTag 时生效。生效时扣目标 hp（damage）、扣子弹穿透次数，穿透为 0 时移除子弹。
- **血条同步**：实体绑定 ViewComponent（主节点）及可选的 BodyUI 引用（Body 预制体实例）；Body 内约定节点路径 BloodBar/ProgressBar（或等同命名），每帧或 OnAttributeChanged 时用 `hp / maxHp` 更新 ProgressBar 的 value（0–1），maxHp 为 0 时取 1 防除零。
- **预制体路径**：玩家预制体 prefabs/character/Player.lh，Body prefabs/SceneUI/PlayerBody.lh；怪物预制体 prefabs/character/Monster.lh，Body prefabs/SceneUI/MonsterBody.lh；玩家子弹 prefabs/Common/Buttle/simple.lh，怪物子弹 prefabs/Common/Buttle/MonsterButtle.lh。上述路径写入角色表与子弹表，由读表加载。

## Risks / Trade-offs
- 3D UI 与 ProgressBar 的节点查找依赖命名约定（BloodBar > ProgressBar）；若场景结构变化须同步更新查找逻辑或配表路径。
- 碰撞检测依赖 Laya 物理或触发器；须约定子弹预制体上挂载碰撞体，并在子弹系统中注册碰撞回调。

## Migration Plan
- 本变更为新增能力；与 add-ecs-gameplay-phase1 的 Skill/Effect、Attribute 兼容；技能释放子弹时从 effect 或技能表的 bulletSlot 取子弹 id，再查 Bullet 表得到预制体与属性。

## Open Questions
- 无。配表模板与节点路径在设计与 spec 中明确即可。
