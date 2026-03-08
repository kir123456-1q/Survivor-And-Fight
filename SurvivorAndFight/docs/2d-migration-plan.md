# 项目改为 2D 的保留目录与处理方案

## 一、可**直接保留**的代码目录（无 3D 依赖）

| 目录 | 说明 |
|------|------|
| `src/config/` | Data、TableLoader、TablesRegistry，纯配表与加载 |
| `src/defines/` | 全为静态常量，与 2D/3D 无关 |
| `src/ecs/core/` | EntityManager、World、System、ComponentStore，纯 ECS 内核 |
| `src/ecs/components/` | Attribute、Control、Skill、PlayerTag、MonsterTag、BodyUIComponent 等，无引擎 3D API |
| `src/ecs/filters/` | FilterRegistry、NamedFilters |
| `src/ecs/systems/AttributeSystem.ts` | 属性/Modifier 逻辑 |
| `src/ecs/systems/ControlSystem.ts` | 操控逻辑 |
| `src/game/skill/FormulaParser.ts` | 公式解析 |
| `src/game/ui/` | BloodBarSyncSystem，血条逻辑，与 2D 兼容 |
| `src/input/` | InputService、ControlInputAdapter、KeyCode |
| `src/game/monster/MonsterPool.ts` | 节点池，node 为 any，2D 节点同理 |
| `src/game/bullet/BulletPool.ts` | 同上 |

---

## 二、可**保留但需小改**的目录（去 z / 2D 适配）

| 目录/文件 | 改动要点 |
|-----------|-----------|
| `src/ecs/components/TransformComponents.ts` | Position/Velocity 保留 x,y，2D 下 z 恒为 0 即可；ViewComponent 的 node 可改为 `Laya.Sprite`；Rotation 2D 可只保留 yaw 或改为 angle |
| `src/ecs/systems/MovementSystem.ts` | 不再写 `position.z`（或始终 `position.z = 0`） |
| `src/ecs/systems/ViewSyncSystem.ts` | 已有 2D 分支（node.x / node.y）；3D 分支可删或保留并保证 2D 节点走 x/y 分支 |
| `src/ecs/systems/SkillSystem.ts` | 方向/目标位置去掉 z，或传 0 |
| `src/game/skill/Targeting.ts` | 距离计算改为 2D：只用 x、y，忽略 z |
| `src/game/bullet/BulletSystem.ts` | 位置与方向只用 x、y；z 相关字段可保留为 0 或删 |
| `src/game/demo/SimpleEcsDemo.ts` | 去掉 Scene3D、MeshSprite3D；改为 2D 场景 + `Laya.Sprite` 或预制体实例化 2D 节点 |

---

## 三、建议**移除或整体替换**的目录（3D 强相关）

| 目录/文件 | 说明 |
|-----------|------|
| `src/camera/` | CameraController、CameraMoveByInput 依赖 Laya 3D Camera、Vector3，2D 需用 2D 相机或直接操作 Stage/根节点位移 |
| `src/Main.ts` | 当前依赖 Scene3D、3D Camera；改为 2D 后改为挂 2D 场景、可去掉 camera 模块引用 |

---

## 四、方便又快捷的处理方案（推荐顺序）

1. **新建 2D 入口与场景**
   - 在 Laya 里新建 2D 场景/启动场景，入口脚本仍为 `Main.ts`，但 `Main.ts` 内改为使用 2D 场景（如 `Laya.Stage`/根节点），不再取 `Scene3D`、不挂 `CameraController`/`CameraMoveByInput`。

2. **删除或搁置 3D 相机**
   - 从 `Main.ts` 去掉对 `camera/` 的引用；`src/camera/` 可整目录删除或移到 `archive/`，等需要 2D 相机控制时再写一个薄封装（只改 x、y）。

3. **ECS 与逻辑：统一“2D 用法”**
   - **Position / Velocity**：保留现有结构，所有写值处保证 `z = 0`、`vz = 0`（或在 MovementSystem 里不再累加 z）。
   - **ViewSyncSystem**：确认 2D 节点只走 `node.x / node.y` 分支；若有 `transform.position.setValue` 的 3D 分支，对 2D 节点不要走该分支。
   - **BulletSystem / SkillSystem / Targeting**：方向与距离只按 x、y 计算；z 相关参数传 0 或从类型/配表里去掉。

4. **Demo 与表现层**
   - **SimpleEcsDemo**：构造函数不再接收 `Scene3D`，改为接收 2D 容器（如 `Laya.Sprite`）；占位符用 `Laya.Sprite` 或 2D 预制体，不再用 `MeshSprite3D`；生成逻辑仍用 Data.Character + 预制体路径，改为加载 2D 预制体并 `instantiate`。

5. **可选：抽 2D/3D 差异**
   - 若希望后续能切回 3D 或同套逻辑双端运行，可把“创建占位/创建视图节点”“同步位置”抽成小接口（如 `createPlaceholder(nodeContainer)`、`syncPosition(node, x, y, z?)`），2D 实现只写 x、y，3D 实现写 x、y、z。当前为求“方便快捷”，可先不改，直接在现有文件里把 z 固定为 0。

---

## 五、保留文件夹速查（复制用）

可直接保留（或仅做上述小改）的文件夹：

- `src/config/`
- `src/defines/`
- `src/ecs/core/`
- `src/ecs/filters/`
- `src/ecs/components/`（仅 Position/Velocity/View 的 2D 用法）
- `src/ecs/systems/`（除需去 z 的几处）
- `src/game/skill/`（FormulaParser 全保留，Targeting 去 z）
- `src/game/ui/`
- `src/game/bullet/`（BulletPool 全保留，BulletSystem 去 z）
- `src/game/monster/`
- `src/input/`

需替换或删除的：

- `src/camera/`（整目录）
- `src/Main.ts`（改入口与场景，去掉 3D 与 camera）
- `src/game/demo/SimpleEcsDemo.ts`（改 2D 场景与节点创建）

按上述顺序做，即可在**保留大部分代码**的前提下，把项目改为 2D，并保持一条清晰、可逆的迁移路径。

---

## 六、分工：AI 能直接改 vs 需要你动手

### 我可以直接改的（纯代码、不动编辑器/资源）

| 项目 | 说明 |
|------|------|
| **Main.ts** | 去掉对 `CameraController`、`CameraMoveByInput`、`camera/` 的引用；不再取 `Scene3D`、不取「Main Camera」；入口用 `this.owner` 作为 2D 容器传给 Demo（或传 null，由 Demo 内用 Stage）。 |
| **删除/归档 src/camera/** | 整目录移除或移到 `archive/`，避免 3D 相机代码参与编译。 |
| **MovementSystem.ts** | 不再写 `position.z`（2D 下 z 恒为 0）。 |
| **ViewSyncSystem.ts** | 只保留/优先走 2D 分支：用 `node.x`、`node.y` 同步位置；3D 的 `transform.position.setValue(x,y,z)` 可删或仅保留给 3D 节点。 |
| **BulletSystem.ts** | 位置、方向只用 x、y；z 相关字段在读写时固定为 0。 |
| **SkillSystem.ts** | 施法方向、目标位置传 2D（z 传 0 或不再使用）。 |
| **Targeting.ts** | 距离计算只按 x、y（忽略 z）。 |
| **SimpleEcsDemo.ts** | 构造函数改为接收「2D 容器」（如 `Laya.Sprite` 或 `any`），不再用 `Laya.Scene3D`；占位符用 `Laya.Sprite` + 绘图或简单纹理，不再用 `MeshSprite3D`；`new Position(x, y, 0)`、`new Velocity(0,0,0)` 等保证 z=0。 |

以上都是**改 TS 源码**即可，不依赖 Laya 编辑器、场景文件或美术资源。

---

### 需要你动手的（编辑器 / 资源 / 项目配置）

| 项目 | 说明 |
|------|------|
| **Laya 项目改为 2D** | 在 Laya 编辑器中把项目类型/运行模式设为 2D（或新建 2D 项目，把现有代码迁入）。否则默认可能是 3D 场景、3D 相机。 |
| **启动场景** | 当前启动的是 3D 场景；需要**换成 2D 场景**作为启动场景，并且该场景上挂的脚本能拿到「2D 根节点」作为 `this.owner`（例如一个 `Laya.Sprite` 容器），供 Main 传给 SimpleEcsDemo。 |
| **2D 预制体** | 若现在用的是 3D 预制体（如 `Player.lh`、`Monster.lh` 为 3D），需要**在编辑器里做 2D 版本**（或改用 2D 预制体路径），并在配表里把 `prefabPath` 指到 2D 预制体；否则 Prefab.instantiate 会拉出 3D 节点。 |
| **2D 相机/画布** | 2D 下若有单独相机或画布设置（如设计宽高、缩放模式），需在**编辑器/项目设置**里配置，代码里不负责创建 2D 场景结构。 |

总结：**逻辑、系统、Demo 构造与占位符**我可以全部在代码里改成 2D 用法；**场景是 2D、用哪个场景启动、预制体是 2D 资源**必须你在 Laya 里配置或制作。

---

## 七（必做）、项目设置改为纯 2D（官方文档要求）

**Laya 官方文档**（项目设置 → 引擎模块）：若项目为**纯 2D 项目**，需**取消 3D 模块勾选**，否则会加载 3D 管线，出现 `_addRenderObject`、`cullInfoCamera`、`transform` 等 3D 相关报错。

| 配置文件 | 修改内容 |
|----------|----------|
| **settings/PlayerSettings.json** | **关闭 3D 模块**：删除或设为 false — `laya.d3`（3D 核心）、`laya.physics3D`、`laya.particle3D`。仅保留 2D 所需模块如 `laya.ui`；若用 2D 物理再勾选 `laya.physics2D`。参考同目录下 LayaProject2 的 PlayerSettings.json。 |

修改后需**重新编译/运行**一次，引擎才会按 2D 模式加载。

---

## 八、常见报错与处理

| 报错 | 原因 | 处理 |
|------|------|------|
| `Unexpected token '<', "<!DOCTYPE "... is not valid JSON` | 配表路径在运行环境下返回了 404 的 HTML 页。 | 已做：Main 会先试 `docs/config/` 再试 `config/`，且只有 `Content-Type` 含 json 才当 JSON 解析。请把配表放到发布目录（如把 `docs/config` 复制到运行时的 `config/`），或保证 `CONFIG_BASE` 在浏览器里能访问到真实 JSON。 |
| `_addRenderObject is not a function`、`cullInfoCamera`、`ComponentDriver transform` | **项目仍启用 3D 引擎模块**，加载了 BaseRender 等 3D 管线。 | **必做**：在 `settings/PlayerSettings.json` 中关闭 3D 模块（去掉 `laya.d3`、`laya.physics3D`、`laya.particle3D`），保存后重新编译运行。并确保场景为 2D（Main 挂在 Area2D 子节点，无 Scene3D）。 |
| `Cannot read properties of undefined (reading 'transform')` | 某处读到 undefined 的 `transform`（多为 3D 节点或已销毁节点）；或 3D 模块未关导致 ComponentDriver 按 3D 处理。 | 先关闭 3D 模块（见上）；ViewSyncSystem、BulletSystem 中已对 `transform` 做存在性判断与 try/catch。 |
| `unknown shaderName: SkyPanoramic`、`PBR`、`load the laya.d3 lib`、`Failed to load Material/red.lmat (in MonsterButtle.lh)`、`missing node type 'Scene3D'/'Camera'/'Sprite3D'`、`_cache_/xxx.lh` 3D 场景 | 仍有资源在加载 3D 预制体/材质（MonsterButtle.lh、simple.lh 为 3D；或某预制体引用了 3D 依赖）。 | **已做**：子弹表与 `bulletDefine` 中 3D 路径在 BulletSystem 内会映射到 `buttle2d.lh`，不再请求 3D 子弹。**你需做**：① 清理 Laya 缓存：删除项目下 `library/cache`（或 IDE 内清理缓存）后重新运行。② 确保 PlayerBody.lh、MonsterBody.lh、buttle2d.lh 在编辑器中为纯 2D，无嵌套 3D 节点/材质。③ 可选：将 `assets/prefabs/Common/Buttle/MonsterButtle.lh`、`simple.lh` 移出资源目录或删掉，避免被依赖加载。 |
