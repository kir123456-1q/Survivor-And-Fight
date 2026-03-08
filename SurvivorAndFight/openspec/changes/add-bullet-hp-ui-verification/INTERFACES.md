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
| `src/game/ui/BloodBarSyncSystem.ts` 或等价 | 血条同步系统：从 Attribute hp/maxHp 更新 BloodBar 下 ProgressBar |
| 可选：`src/ecs/components/BodyUIComponent.ts` | Body UI 引用与 ProgressBar 节点缓存 |

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
- `spawnBullet(...)` — 若注入 **BulletPool**，优先从池取节点，否则 instantiateBullet；回收时若有池则 put，否则 destroy
- `update(deltaTime: number): void` — 更新子弹位置、超时或穿透耗尽时回收/销毁；使用子弹池时回收节点回池
- 依赖：getBulletRow、instantiateBullet、EcsWorld、sceneParent；可选 **bulletPool**（BulletPool）

### BulletPool
- `get(prefabPath): node | null`、`put(prefabPath, node)`、`clear(prefabPath?)`

### MonsterPool
- `get(): node | null`、`put(node)`、`clear()` — 仅管理视图节点；实体创建/销毁由调用方与 ECS 处理

### BloodBarSyncSystem（或等价）
- `update(deltaTime: number): void` — 遍历已绑定 Body 且含 Attribute 的实体，按 hp/maxHp 设置 BloodBar 下 ProgressBar.value（0–1）
- 依赖：Body 内节点路径约定 BloodBar > ProgressBar；实体与 Body/View 的绑定

### 技能释放子弹对接
- 释放攻击技能时：从 effect 或技能的 bulletSlot 取子弹 id → Data.Bullet.GetByID(id) → 将 prefabPath、duration、speed、damage、penetration、ownerType 交给 BulletSystem 生成子弹；ownerType 由释放者实体 Tag 推导（PlayerTag→player，MonsterTag→monster）。

---

## 节点与路径约定

- 玩家预制体：prefabs/character/Player.lh；Body：prefabs/SceneUI/PlayerBody.lh
- 怪物预制体：prefabs/character/Monster.lh；Body：prefabs/SceneUI/MonsterBody.lh
- 玩家子弹：prefabs/Common/Buttle/simple.lh；怪物子弹：prefabs/Common/Buttle/MonsterButtle.lh
- Body 内血条：BloodBar > ProgressBar，须更新的是该 ProgressBar 的 value

---

## 归档后保留约定

- 本接口文档在变更归档时须复制或移动到持久位置（如 `docs/bullet-hp-ui-verification-interfaces.md`），供后续实现与调用方查阅。
