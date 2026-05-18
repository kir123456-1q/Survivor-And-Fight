# 测试关卡（Level3）FPS 实测记录

> 来源：浏览器控制台 `[TestLevel] FPS` 日志（`TestLevelFpsTracker`）

## 测试条件（两轮共用）

| 项 | 说明 |
|----|------|
| 入口 | 主菜单 → 选关 → **Level3** |
| 波次规则 | 每波固定 **10s** 自动晋级；双方无敌 |
| 法杖（装备栏 1/2/3） | 单发 **10 / 100 / 1000** 枚子弹 |
| 同屏怪物 | 第 1/2/3 波：**10 / 100 / 1000** |
| 统计方式 | `avgFPS = frames / duration`（暂停不计；单帧 Δt 上限 0.25s） |

---

## A. 接入动态图集后（2026-05-18）

**优化项**：启用 `assets/atlas/AtlasConfig.atlascfg` 自动图集（`WeaponIcon` / `EffectIcon` / `MonsterIcon` / `UIPng` / `Skillicon`），`TextureAtlasService` 统一纹理加载，战斗根节点 `COMBAT_DRAW_CALL_OPTIMIZE = true`。

### 分波结果

| 波次 | 同屏怪物 | 单发子弹 | 平均 FPS | 采样帧数 | 波次时长 (s) |
|------|----------|--------------|----------|----------|--------------|
| 1/3 | 10 | 10 | **56.74** | 569 | 10.03 |
| 2/3 | 100 | 100 | **40.72** | 408 | 10.02 |
| 3/3 | 1000 | 1000 | **15.10** | 152 | 10.07 |

### 整场汇总

| 指标 | 数值 |
|------|------|
| 整场平均 FPS | **37.48**（569+408+152 帧 / 30.12s） |
| 总采样帧数 | 1129 |
| 总时长 (s) | 30.12 |

### 原始日志

```text
[TestLevel] wave 1 / 3 spawned 10
[TestLevel] started wave 1/ 3 monsters= 10
[TestLevel] FPS wave 1/3 monsters=10 avgFPS=56.74 frames=569 duration=10.03s
[TestLevel] wave 1 time up 10 s
[TestLevel] wave 2 / 3 spawned 100
[TestLevel] FPS wave 2/3 monsters=100 avgFPS=40.72 frames=408 duration=10.02s
[TestLevel] wave 2 time up 10 s
[TestLevel] wave 3 / 3 spawned 1000
[TestLevel] FPS wave 3/3 monsters=1000 avgFPS=15.10 frames=152 duration=10.07s
[TestLevel] wave 3 time up 10 s
```

---

## B. 接入动态图集前（对照，2026-05-18）

### 分波结果

| 波次 | 同屏怪物 | 平均 FPS | 采样帧数 | 波次时长 (s) |
|------|----------|----------|----------|--------------|
| 1/3 | 10 | 58.68 | 588 | 10.02 |
| 2/3 | 100 | 46.30 | 464 | 10.02 |
| 3/3 | 1000 | 13.32 | 133 | 9.99 |

### 整场汇总

| 整场平均 FPS | 总帧数 | 总时长 (s) |
|--------------|--------|------------|
| **39.46** | 1185 | 30.03 |

---

## C. 对比（动态图集 vs 对照）

| 波次 | 怪物 | 对照 FPS | 动态图集 FPS | 变化 |
|------|------|----------|--------------|------|
| 1 | 10 | 58.68 | 56.74 | −1.94 |
| 2 | 100 | 46.30 | 40.72 | −5.58 |
| 3 | 1000 | 13.32 | **15.10** | **+1.78** |
| 整场 | — | 39.46 | 37.48 | −1.98 |

**解读（论文可写）**：

- 低负载波次（10/100 怪）FPS 略降，可能与图集首次加载、合批路径变化或测试波动有关。
- **高负载波次（1000 怪）FPS 由 13.32 升至 15.10（约 +13.4%）**，更符合动态图集减少 DrawCall/纹理切换、利于同屏大量精灵渲染的预期。
- 测试关主要价值在于**分规模压力曲线**；消融对比宜在相同波次（建议第 3 波）重复多轮取平均。

---

## 说明

- 表 7.2「对象池 / Worker 对比」仍为独立实验，与测试关 / 图集实验分开。
- 相关代码：`src/defines/atlasDefine.ts`、`src/game/render/TextureAtlasService.ts`、`assets/atlas/AtlasConfig.atlascfg`。
