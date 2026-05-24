# ECS 玩法层组件与筛选 — 降 AI 改写对照稿

> **对照源文**：用户提供的单段节选（玩法层组件/系统列举、`FilterRegistry`、玩家与怪物共享组件及组合优于继承）。  
> **论文出处**：`thesis/chapter02.tex` 玩法层段；`docs/论文插图-Png清单.md` 中 **fig-ecs-components** 锚定段。  
> **用法**：在 Word / LaTeX 中按【位置】搜索定位，用「改写」替换「原文」。代码名保留反引号，与正文一致。  
> **说明**：拆为三个可独立替换的位置；若 Word 中为一段，用【位置-04】整段替换。

---

## 组件与系统划分

### 【位置-01】第2章 ECS / 玩法层段 | Word：「玩法层组件含」至「MonsterChaseSystem 等」

**原文：**

玩法层组件含 `PlayerTag`/`MonsterTag`、`Position`/`Velocity`、`Attribute`（含可溯源 modifier）、`Skill`、`SkillLoadoutState` 等；系统含 `MovementSystem`、`AttributeSystem`、`SkillSystem`、`BulletSystem`、`MonsterChaseSystem` 等。

**改写：**

玩法层按 ECS 拆成组件与系统两块。组件一侧：`PlayerTag`、`MonsterTag` 标记实体类型；`Position`、`Velocity` 管坐标与速度；`Attribute` 存基础数值，modifier 带来源字段，结算时可追溯；另有 `Skill`、`SkillLoadoutState` 管技能与栏位。系统一侧：`MovementSystem` 推进位移，`AttributeSystem` 重算有效属性，`SkillSystem`、`BulletSystem` 处理施法与子弹，`MonsterChaseSystem` 负责怪物追击。以上名单为文中举例，并非封闭列表。

---

## FilterRegistry

### 【位置-02】第2章 ECS / 玩法层段 | Word：`FilterRegistry` 句（常接【位置-01】后）

**原文：**

`FilterRegistry` 提供 `Players`、`Monsters` 等命名筛选，避免各 System 重复写交集查询。

**改写：**

`FilterRegistry` 事先注册 `Players`、`Monsters` 等筛选名。各 System 按名取实体，不必各自拼组件交集条件。

---

## 标签共享与组合原则

### 【位置-03】第2章 ECS / 玩法层段 | Word：「怪物与玩家共享」至段末

**原文：**

怪物与玩家共享位移、属性、技能等组件，仅标签不同，体现**组合优于继承**。

**改写：**

玩家实体与怪物实体挂同一套位移、属性、技能组件，差别只在 `PlayerTag` 或 `MonsterTag`。新行为靠增删组件或系统扩展，不拉 `MonsterBase` 一类继承链，符合 ECS 里**组合优于继承**的惯例。

---

## 整段合并版（Word 中为一段时使用）

### 【位置-04】整段替换 | Word / LaTeX：从「玩法层组件含」至「组合优于继承」整段

**原文：**

玩法层组件含 `PlayerTag`/`MonsterTag`、`Position`/`Velocity`、`Attribute`（含可溯源 modifier）、`Skill`、`SkillLoadoutState` 等；系统含 `MovementSystem`、`AttributeSystem`、`SkillSystem`、`BulletSystem`、`MonsterChaseSystem` 等。`FilterRegistry` 提供 `Players`、`Monsters` 等命名筛选，避免各 System 重复写交集查询。怪物与玩家共享位移、属性、技能等组件，仅标签不同，体现**组合优于继承**。

**改写：**

玩法层按 ECS 拆成组件与系统两块。组件一侧：`PlayerTag`、`MonsterTag` 标记实体类型；`Position`、`Velocity` 管坐标与速度；`Attribute` 存基础数值，modifier 带来源字段，结算时可追溯；另有 `Skill`、`SkillLoadoutState` 管技能与栏位。系统一侧：`MovementSystem` 推进位移，`AttributeSystem` 重算有效属性，`SkillSystem`、`BulletSystem` 处理施法与子弹，`MonsterChaseSystem` 负责怪物追击。以上名单为文中举例，并非封闭列表。

`FilterRegistry` 事先注册 `Players`、`Monsters` 等筛选名。各 System 按名取实体，不必各自拼组件交集条件。

玩家实体与怪物实体挂同一套位移、属性、技能组件，差别只在 `PlayerTag` 或 `MonsterTag`。新行为靠增删组件或系统扩展，不拉 `MonsterBase` 一类继承链，符合 ECS 里**组合优于继承**的惯例。

---

## 附：位置索引

| 位置编号 | 替换范围 | 主题 |
|----------|----------|------|
| 01 | 第一句 | 组件与系统列举 |
| 02 | 第二句 | `FilterRegistry` 命名筛选 |
| 03 | 第三句 | 标签区分与组合原则 |
| 04 | 全文 | 整段一次性替换 |

---

## 附：本次改写处理的常见 AI 痕迹

| 痕迹类型 | 原文表现 | 处理 |
|----------|----------|------|
| 对称套式 | 「组件含…；系统含…」并列 | 改为「组件一侧…系统一侧…」，主语错开 |
| 空泛动词 | 「提供」「体现」 | 改为「事先注册」「符合…惯例」 |
| 口号式收束 | 「仅标签不同，体现组合优于继承」 | 补一句可操作对比（不拉继承链），再点原则 |
| 长分号句 | 组件与系统挤在一句 | 拆为 4–5 个短句 |
| 缩略堆砌 | `PlayerTag`/`MonsterTag` 斜杠并列 | 改为顿号分述，减少清单感 |
| 重复用词 | 「等」前后结构雷同 | 末句加「并非封闭列表」，避免机械罗列 |

若需同步进 LaTeX，可在 `thesis/chapter02.tex` 中检索「玩法层组件含」按【位置-04】替换；插图 **fig-ecs-components** 仍锚定在该段之后，替换后插图位置不变。
