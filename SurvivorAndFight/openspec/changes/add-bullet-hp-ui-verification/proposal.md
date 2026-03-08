# Change: 初步功能验证 — 子弹攻击、血量与血条 UI、碰撞

## Why
在 add-ecs-gameplay-phase1 基础上，需进行初步功能验证：为玩家与怪物增加基础攻击技能（释放子弹）、基础血量与血量上限，以及血条 UI（BloodBar 下 ProgressBar）与碰撞逻辑；玩家子弹仅对怪物生效、怪物子弹仅对玩家生效；上述配置与子弹属性均通过 JSON 配表驱动。

## What Changes
- 新增**角色与子弹配表**：角色表（玩家/怪物预制体路径、Body UI 路径、子弹预制体路径、基础 hp/maxHp 等）；子弹表（预制体路径、持续时间、飞行速度、伤害、穿透次数等）；配表模板与 tables.registry 注册。
- 新增**子弹能力**：按配表实例化子弹（玩家用 prefabs/Common/Buttle/simple.lh、怪物用 prefabs/Common/Buttle/MonsterButtle.lh），子弹搭载碰撞体；飞行与生命周期（持续时间）；碰撞检测时仅对目标阵营生效（玩家子弹→怪物，怪物子弹→玩家）。
- 新增**血条 UI 绑定**：玩家预制体（prefabs/character/Player.lh）通过 3D UI 关联 Body（prefabs/SceneUI/PlayerBody.lh），管理 BloodBar；怪物预制体（prefabs/character/Monster.lh）、Body（prefabs/SceneUI/MonsterBody.lh）同理；血条位置与主角一致；**须更新的是 BloodBar 下的 ProgressBar**，根据实体 Attribute 的 hp、maxHp 同步进度值。
- 扩展**技能/效果与子弹**：攻击技能释放时从配表读取子弹预制体与子弹属性（持续时间、速度、伤害、穿透），生成子弹实例并应用碰撞阵营规则。

## New Files and Interfaces

本变更须新增的配表与代码文件、对外接口见同目录下 **`INTERFACES.md`**。归档后须将该接口文档保留到项目文档树（如 `docs/bullet-hp-ui-verification-interfaces.md`），供后续实现与调用方使用。

### 新建文件清单
- **配表**：角色表 JSON（如 `docs/config/character_table.json`）、子弹表 JSON（如 `docs/config/bullet_table.json`）；tables.registry 注册 Character、Bullet。
- **子弹**：`src/game/bullet/BulletSystem.ts`（及可选子弹数据组件/实例类）。
- **血条**：`src/game/ui/BloodBarSyncSystem.ts` 或等价，从 Attribute hp/maxHp 更新 BloodBar 下 ProgressBar。
- **可选**：BodyUI 组件或 Body 引用组件，用于缓存 ProgressBar 节点。

### 接口概要（详见 INTERFACES.md）
- **配表**：Character 表行含 prefabPath、bodyPrefabPath、hp、maxHp、roleType；Bullet 表行含 prefabPath、duration、speed、damage、penetration、ownerType。
- **BulletSystem**：update(deltaTime)；实例化子弹、飞行、碰撞按阵营过滤、扣血与穿透。
- **BloodBarSync**：update(deltaTime)；遍历绑定 Body 的实体，设 ProgressBar.value = hp/maxHp。
- **节点约定**：Body 内 BloodBar > ProgressBar；玩家/怪物/子弹预制体路径见 INTERFACES.md。

## Impact
- **Affected specs**
  - `config-json-tables`：ADDED 角色表、子弹表结构约定与配表模板。
  - `bullet-system`（新增）：子弹实例化、飞行、碰撞、阵营过滤。
  - `hp-bloodbar-binding`（新增）：Body UI 绑定、BloodBar/ProgressBar 与 hp/maxHp 同步。
  - `skill-effect`：ADDED 释放子弹时使用子弹预制体与子弹表属性，与碰撞阵营对接。
- **Affected code**
  - 新建文件见上文「New Files and Interfaces」及 `INTERFACES.md`。
