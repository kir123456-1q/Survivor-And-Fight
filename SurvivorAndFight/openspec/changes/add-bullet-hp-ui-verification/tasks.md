## 1. 配表与模板
- [x] 1.1 设计并新增角色表（Character）JSON 与配表模板：prefabPath、bodyPrefabPath、bulletPrefabPath（或由技能带出）、hp、maxHp、roleType（player/monster）；示例行：玩家 prefabs/character/Player.lh、prefabs/SceneUI/PlayerBody.lh；怪物 prefabs/character/Monster.lh、prefabs/SceneUI/MonsterBody.lh
- [x] 1.2 设计并新增子弹表（Bullet）JSON 与配表模板：prefabPath、duration、speed、damage、penetration、ownerType（player/monster）；示例：玩家子弹 prefabs/Common/Buttle/simple.lh，怪物子弹 prefabs/Common/Buttle/MonsterButtle.lh
- [x] 1.3 在 tables.registry.json 中注册 Character、Bullet 表；更新 CONFIG_SCHEMA 或表结构文档

## 2. 血条 UI 绑定
- [x] 2.1 约定 Body 预制体内血条节点路径：BloodBar > ProgressBar；实现从实体 Body 引用查找该 ProgressBar 的逻辑
- [x] 2.2 实现血条同步：根据实体 Attribute 的 hp、maxHp 更新 ProgressBar.value（0–1）；maxHp 为 0 时按 1 处理
- [x] 2.3 玩家与怪物创建时按角色表加载预制体与 Body，并建立 Body 与实体的绑定，血条位置与主角一致（同套 UI 布局约定）

## 3. 子弹系统
- [x] 3.1 实现子弹实例化：根据技能/effect 的 bulletSlot 或角色表子弹路径从 Bullet 表取预制体路径与属性，加载并生成子弹节点，挂载碰撞体
- [x] 3.2 实现子弹飞行与生命周期：按 speed 移动、按 duration 超时销毁
- [x] 3.3 实现碰撞检测：子弹与场景中带碰撞体的实体检测；根据子弹 ownerType 与目标实体 Tag 过滤：玩家子弹仅对 MonsterTag 生效，怪物子弹仅对 PlayerTag 生效
- [x] 3.4 碰撞生效时：扣目标 Attribute.base.hp（damage）、扣子弹穿透次数，穿透为 0 时移除子弹

## 4. 技能与子弹对接
- [x] 4.1 攻击技能配置 bulletSlot 指向子弹表 id，释放时读取 Bullet 表并生成子弹，设置 ownerType 为释放者阵营
- [x] 4.2 确保玩家初始技能使用 simple.lh、怪物使用 MonsterButtle.lh，通过配表驱动

## 5. 验证与文档
- [x] 5.1 运行场景验证：玩家发射子弹可扣怪物血、怪物发射子弹可扣玩家血；双方血条 ProgressBar 随 hp 更新
- [x] 5.2 接口文档已提供 INTERFACES.md；归档时须保留到项目文档树（如 docs/bullet-hp-ui-verification-interfaces.md）
