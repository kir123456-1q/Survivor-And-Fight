# 摘要与关键词 — 降 AI 改写对照稿

> **对照源文**：用户提供的终稿摘要、Abstract、关键词（中英文）。  
> **用法**：在 Word「摘要」「Abstract」「关键词」处按【位置】定位，用「改写」替换「原文」。  
> **说明**：PDF `AIGC原文对照报告.pdf` 未在仓库中；改写按常见检测句式处理，并保留毕设必要术语。

---

## 中文摘要

### 【位置-ZH-01】摘要第1段 | Word：「摘要」首段

**原文：**

随着 HTML5 与 WebGL 技术的普及，浏览器端实时动作游戏在架构解耦与同屏性能方面面临新的挑战。类吸血鬼幸存者玩法融合 Roguelite 单局构筑与元游戏流程，要求客户端在数据驱动、模块划分与可验证性上具备清晰边界。本文以 Survivor And Fight 毕业设计为研究对象，基于 LayaAir 3.x 与 TypeScript，对 2D 俯视角生存战斗游戏开展从需求分析、总体设计、系统实现到测试验证的完整研究。

**改写：**

HTML5 与 WebGL 普及后，浏览器端动作游戏要在架构解耦和同屏性能之间取舍。类吸血鬼幸存者玩法常叠 Roguelite 单局构筑和元游戏流程，客户端需要在数据驱动、模块划分和可测性上划清边界。本文以毕业设计项目 Survivor And Fight 为对象，使用 LayaAir 3.x 与 TypeScript 实现 2D 俯视角生存战斗原型，工作包括需求分析、总体设计、实现与测试。

---

### 【位置-ZH-02】摘要第2段 | Word：「摘要」第2段

**原文：**

论文主体共分八章：绪论与相关技术奠定选题依据与技术路线；需求分析明确功能、非功能需求及验收映射；总体设计提出五层架构，并从 ECS Gameplay 、MVC界面、对象池与 Web Worker 三方面给出方案；实现与性能章节分别论述核心模块、主循环及优化实践；测试章节通过单元脚本、功能用例与压力实验进行验证； 结论章节归纳成果与不足。原型可稳定支撑菜单、跑图、战斗与技能装配等闭环流程， 对象池与动态图集可改善高同屏负载下的运行表现。

**改写：**

全文八章。绪论和相关技术说明选题与路线；需求章列出功能、非功能指标及验收对应关系；设计章给出五层架构，并分别写 ECS Gameplay、MVC 界面、对象池和 Web Worker；实现章与性能章写核心模块、主循环和优化做法；测试章用单元脚本、功能用例和压测验证。原型可跑通菜单、跑图、战斗和技能装配。实验表明，对象池和动态图集能缓解高同屏时的卡顿。

---

## 中文关键词

### 【位置-ZH-KW】关键词行 | Word：「关键词」

**原文：**

关键词：实体组件系统；类吸血鬼幸存者；系统设计与实现；LayaAir；数据驱动

**改写：**

关键词：实体组件系统；类吸血鬼幸存者；系统设计与实现；LayaAir；数据驱动

> 关键词可保留；若学校要求 3–5 个且无变化，本条不必改。

---

## English Abstract

### 【位置-EN-01】Abstract 第1段 | Word：「Abstract」首段

**原文：**

With the adoption of HTML5 and WebGL, browser-based action games must balance architectural decoupling and runtime performance under large entity counts. Vampire- survivor-like gameplay combined with Roguelite meta progression calls for data-driven content, modular organization, and verifiable engineering practices.  This thesis studies the off-campus project Survivor And Fight:  a 2D top-down survival combat pro- totype on LayaAir 3.x and TypeScript, covering requirements analysis, overall design, implementation, and testing.

**改写：**

HTML5 and WebGL are widely used in browser games. Action titles must keep modules separate while handling many on-screen entities. Vampire-survivor-like games with Roguelite meta loops need data-driven tables, clear module boundaries, and testable code. This thesis presents Survivor And Fight, an off-campus 2D top-down survival prototype built with LayaAir 3.x and TypeScript. The work covers requirements, design, implementation, and testing.

---

### 【位置-EN-02】Abstract 第2段 | Word：「Abstract」第2段

**原文：**

The thesis is organized in eight chapters.   The  introduction  and  related work establish motivation and technology choices; requirements analysis defines functional and non-functional criteria; overall design presents a layered architecture with ECS gameplay, MVC-based UI, object pooling, and Web Worker offloading; implementa- tion and performance chapters describe core modules, the main loop, and optimization practice; testing covers unit scripts, functional cases, and stress experiments; the con- clusion summarizes contributions and limitations. The prototype supports a full loop of menus,  run-map navigation,  combat,  and skill loadout.   Experiments  show that pooling and dynamic atlasing improve stability under high on-screen load.

**改写：**

The thesis has eight chapters. The introduction and related work explain the topic and stack. Requirements list functional and non-functional items and how they are verified. Design describes a five-layer structure, ECS gameplay, MVC UI, object pools, and Web Worker offloading. Implementation and performance chapters cover core modules, the main loop, and optimizations. Testing uses unit scripts, functional cases, and stress runs. The conclusion lists results and limits. The prototype runs menus, run-map flow, combat, and skill loadout in one loop. Pooling and dynamic texture atlases reduce frame drops when many entities are on screen.

---

## English Keywords

### 【位置-EN-KW】Keywords 行 | Word：「Keywords」

**原文：**

Keywords：ECS；vampire-survivor-like；system design；LayaAir；data-driven

**改写：**

Keywords: ECS; vampire-survivor-like; system design and implementation; LayaAir; data-driven

> 英文关键词建议用半角冒号、分号分隔；`system design` 可与中文「系统设计与实现」对齐为 `system design and implementation`（按院系格式二选一）。

---

## 附：本段原文中较典型的 AI 痕迹

| 位置 | 原表述 | 处理 |
|------|--------|------|
| ZH-01 | 「面临新的挑战」 | 改为具体约束「取舍」 |
| ZH-02 | 分号串六章、句式完全平行 | 拆短句，章名顺序保留 |
| ZH-02 | 「可稳定支撑」「可改善」 | 改为「可跑通」「能缓解卡顿」 |
| EN-01 | adoption / calls for / verifiable engineering practices | 换用更直白的动词 |
| EN-02 | 多空格、连字符断行 pro- totype | 改正拼写与排版 |
| EN-02 | 分号长并列从句 | 拆成独立短句 |

---

## 纯改写稿（便于整段复制）

### 中文摘要（改写合并）

HTML5 与 WebGL 普及后，浏览器端动作游戏要在架构解耦和同屏性能之间取舍。类吸血鬼幸存者玩法常叠 Roguelite 单局构筑和元游戏流程，客户端需要在数据驱动、模块划分和可测性上划清边界。本文以毕业设计项目 Survivor And Fight 为对象，使用 LayaAir 3.x 与 TypeScript 实现 2D 俯视角生存战斗原型，工作包括需求分析、总体设计、实现与测试。

全文八章。绪论和相关技术说明选题与路线；需求章列出功能、非功能指标及验收对应关系；设计章给出五层架构，并分别写 ECS Gameplay、MVC 界面、对象池和 Web Worker；实现章与性能章写核心模块、主循环和优化做法；测试章用单元脚本、功能用例和压测验证。原型可跑通菜单、跑图、战斗和技能装配。实验表明，对象池和动态图集能缓解高同屏时的卡顿。

**关键词：** 实体组件系统；类吸血鬼幸存者；系统设计与实现；LayaAir；数据驱动

### Abstract（改写合并）

HTML5 and WebGL are widely used in browser games. Action titles must keep modules separate while handling many on-screen entities. Vampire-survivor-like games with Roguelite meta loops need data-driven tables, clear module boundaries, and testable code. This thesis presents Survivor And Fight, an off-campus 2D top-down survival prototype built with LayaAir 3.x and TypeScript. The work covers requirements, design, implementation, and testing.

The thesis has eight chapters. The introduction and related work explain the topic and stack. Requirements list functional and non-functional items and how they are verified. Design describes a five-layer structure, ECS gameplay, MVC UI, object pools, and Web Worker offloading. Implementation and performance chapters cover core modules, the main loop, and optimizations. Testing uses unit scripts, functional cases, and stress runs. The conclusion lists results and limits. The prototype runs menus, run-map flow, combat, and skill loadout in one loop. Pooling and dynamic texture atlases reduce frame drops when many entities are on screen.

**Keywords:** ECS; vampire-survivor-like; system design and implementation; LayaAir; data-driven
