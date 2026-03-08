# 接口文档（add-bullet-hp-ui-verification）

归档后本文件须保留在项目内（如 `docs/bullet-hp-ui-verification-interfaces.md`），供后续实现与调用方使用。

---

## 新建文件清单与路径

| 路径 | 说明 |
|-----|------|
| `docs/config/character_table.json` | 角色表 JSON（或项目约定路径） |
| `docs/config/bullet_table.json` | 子弹表 JSON（或项目约定路径） |
| `src/game/bullet/BulletSystem.ts` | 子弹系统：实例化或从子弹池取节点、飞行、碰撞与阵营过滤 |
| `src/game/bullet/BulletPool.ts` | 子弹节点对象池：按 prefabPath 分桶，get/put 复用节点 |
| `src/game/monster/MonsterPool.ts` | 怪物视图节点对象池：get/put 复用怪物视图节点 |
| `src/game/ui/BloodBarSyncSystem.ts` | 血条同步系统：从 Attribute hp/maxHp 更新 BloodBar 下 ProgressBar |
| `src/ecs/components/BodyUIComponent.ts` | Body UI 引用（bodyNode），供血条查找 BloodBar > ProgressBar |

---

## 配表结构（接口形态）

### Character 表行
- `id`：主键
- `prefabPath`：string，角色预制体路径（如 prefabs/character/Player.lh）
- `bodyPrefabPath`：string，Body UI 预制体路径（如 prefabs/SceneUI/PlayerBody.lh）
- `hp`：number，基础血量
- `maxHp`：number，血量上限
- `roleType`：string，`"player"` | `"monster"`
- `bulletPrefabPath` 或由技能 bulletSlot 指定：可选

### Bullet 表行
- `id`：主键
- `prefabPath`：string，子弹预制体路径（如 prefabs/Common/Buttle/simple.lh）
- `duration`：number，持续时间（秒）
- `speed`：number，飞行速度
- `damage`：number，伤害值
- `penetration`：number，穿透次数
- `ownerType`：string，`"player"` | `"monster"`

---

## 系统与逻辑接口

### BulletSystem
- `spawnBullet(bulletId: string, position: {x,y,z?}, direction: {x,y,z?}, ownerType: string): void` — 根据子弹表 id 生成子弹并加入场景；若注入 **BulletPool**，则优先从池中取节点，不足再 instantiateBullet
- `update(deltaTime: number): void` — 更新子弹位置、超时或穿透耗尽时回收或销毁；若使用 **子弹池**，回收时 put(prefabPath, node)，否则 destroy 节点
- 依赖：getBulletRow、instantiateBullet、EcsWorld、sceneParent；可选 **bulletPool**（BulletPool）

### BulletPool
- `get(prefabPath: string): any | null` — 从该 path 的池中取一个节点，无则返回 null
- `put(prefabPath: string, node: any): void` — 将节点回收到该 path 的池中（会先从父节点移除）
- `clear(prefabPath?: string): void` — 清空指定 path 或全部池

### MonsterPool
- `get(): any | null` — 从池中取一个怪物视图节点
- `put(node: any): void` — 回收节点（会先从父节点移除）；实体创建/销毁由调用方根据 ECS 与 Character 表处理
- `clear(): void` — 清空池

### BloodBarSyncSystem
- `update(deltaTime: number): void` — 遍历已绑定 BodyUIComponent 且含 Attribute 的实体，按 hp/maxHp 设置 BloodBar 下 ProgressBar.value（0–1）
- 依赖：Body 内节点路径约定 BloodBar > ProgressBar；AttributeSystem

### 技能释放子弹对接
- SkillSystem 构造函数可注入 bulletSystem、getBulletRow；effect 行配置 bulletSlot（子弹表 id）时调用 bulletSystem.spawnBullet(bulletSlot, casterPos, direction, ownerType)；ownerType 由释放者实体 Tag 推导（PlayerTag→player，MonsterTag→monster）。

---

## 节点与路径约定

- 玩家预制体：prefabs/character/Player.lh；Body：prefabs/SceneUI/PlayerBody.lh
- 怪物预制体：prefabs/character/Monster.lh；Body：prefabs/SceneUI/MonsterBody.lh
- 玩家子弹：prefabs/Common/Buttle/simple.lh；怪物子弹：prefabs/Common/Buttle/MonsterButtle.lh
- Body 内血条：BloodBar > ProgressBar，须更新的是该 ProgressBar 的 value

---

## 归档后保留约定

- 本接口文档在变更归档时须复制或移动到持久位置（如 `docs/bullet-hp-ui-verification-interfaces.md`），供后续实现与调用方查阅。
