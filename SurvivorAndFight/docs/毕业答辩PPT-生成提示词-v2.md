# 毕业答辩 PPT 生成提示词 v2

> **依据**：`docs/thesis-from-docx.md`（论文全文）  
> **模板**：`中国石油大学汇报答辩通用ppt1.pptx`  
> **方法**：融合 [frontend-slides](https://github.com/zarazhangrui/frontend-slides) · [huashu-design](https://github.com/alchaincyf/huashu-design) · [open-slide](https://github.com/1weiho/open-slide) · [ppt-master](https://github.com/hugohe3/ppt-master) 的工作流  
> **产物**：`ppt-html-v2/` 浏览器排练 → `ppt-output/毕业答辩PPT-v2.pptx`（套学校模板）

---

## 一、四项目能力融合（怎么用、不混用）

| 项目 | 借鉴点 | 本项目用法 |
|------|--------|------------|
| **frontend-slides** | 单文件 HTML、`viewport-base.css` 1920×1080 整页缩放、反 AI 审美、分步入场动画 | `ppt-html-v2/css/viewport-base.css` + 键盘翻页 |
| **huashu-design** | HTML 为唯一源稿；先 2 页 showcase 定 grammar；性能数据**禁止 AI 编数**；可导出 PPTX | 论文表 7-5/7-6 数字原样粘贴进 prompt；导出走截图或 html2pptx |
| **open-slide** | 固定 **1920×1080** 画布；每页一个「观点」；字号阶梯与留白规则 | 幻灯片 DOM 按像素排版，禁止百分比流式撑破版式 |
| **ppt-master** | 架构/流程用 **内联 SVG**（可编辑形状语义）；最终进 PPT 的是矢量或高清 PNG，不用 Mermaid | `diagrams.js` 手绘 SVG；禁止 mermaid-cli |

**不采用的旧做法**：Gamma 一键 PPT、Mermaid 导出 PNG 贴图、`答辩PPT大纲.md` 里的 Mermaid 源码块。

---

## 二、学校模板硬约束（实测 `中国石油大学汇报答辩通用ppt1.pptx`）

| 模板页 | 版式 | 用于 v2 页码 |
|--------|------|--------------|
| slide 1 | 封面 | 第 1 页 |
| slide 2 | 六栏目录 | 第 2 页 |
| slide 9 | 标题 + 主图区 89%×45% + 图注 + 底栏 5 要点 | 第 6–11、13–18 页 |
| slide 33 | 标题 + 左半弧 5 要点 + 右装饰区 | 第 3–5、12、19–20 页 |
| slide 4 | 致谢 | 第 21 页 |

**配色（从模板提取，禁止改色系）**

- 主色深蓝：`#0d2b5e` / `#1a4a8a`
- 强调橙：`#e87722`
- 正文底：浅灰蓝 `#f4f7fb`，卡片白 `#ffffff`

**排版硬约束**

- 画布：**1920 × 1080 px**（16:9）
- 每页要点 **≤5 条**，单条 **≤28 汉字**（版式 A 底栏 ≤26 字）
- 主图区节点 **≤8 个**；序列步骤 **≤7 步**
- 禁止：占位符、英文大标题、整段段落、紫色渐变 AI 风

---

## 三、论文数据源（生成前必读）

生成内容**只许**来自以下文件，不得臆造：

| 用途 | 文件 |
|------|------|
| 全文结构 / 创新点 / 结论 | `docs/thesis-from-docx.md` |
| 性能数字（禁止改） | 同上 §7.4，表 7-5、7-6 |
| 插图截图 | `thesis/Png/图7-*.png` |
| 架构图语义 | 论文图 4-1、5-1、5-2、5-3、5-5 |

### 性能数据硬编码（答辩必背）

```
表7-5 五波 FPS：10怪 58.62 → 100怪 46.84 → 1000怪 15.14；整场均值 34.48
表7-4 图集：千怪 FPS 13.32 → 15.10（+13.4%）
表7-6 消融（1000怪/10s）：无池无Worker P95 76.50 ms → 仅开池 P95 48.60 ms（约 -36.5%）
       第4/5波均值 FPS 相近：26.16 vs 25.98
```

---

## 四、全局生成提示（复制给 AI / Agent）

```
请生成本科毕业设计答辩材料，交付物为 HTML 幻灯片（ppt-html-v2/）并可导出套学校模板的 PPTX。

【身份】
题目：基于 ECS 架构的类吸血鬼幸存者游戏开发及优化（校外）
学生：刘瀚文，2207020509，计算机科学与技术，指导教师董玉坤
学校：中国石油大学（华东），2026年5月

【方法】
1. HTML-first：1920×1080 固定画布，inline CSS/JS，参考 frontend-slides 的 viewport 缩放。
2. 图表：内联 SVG 或 HTML 卡片（参考 ppt-master），禁止 Mermaid。
3. 先定 2 页 showcase（封面 + 五层架构页）确认 grammar，再批量生成其余页（huashu-design）。
4. 性能页数字严格按 thesis-from-docx 表7-5/7-6，禁止编造。
5. 最终用学校模板 pptx 还原：封面/目录/致谢用模板原生页，技术页主图区贴 HTML 导出 SVG/PNG。

【技术主线】（论文摘要）
LayaAir 3.x + TypeScript；轻量 Map-ECS；JSON 配表技能链；MVC 全屏 UI 栈；对象池 + Web Worker 追逐卸载；Tab 暂停装配。

【页序 21 页】
1封面 2目录 3背景 4现状 5创新点 6技术选型 7五层架构 8ECS 9主循环与暂停
10技能效果链 11公式树FormulaParser 12MVC Tab 13性能优化 14三大场景
15测试策略 16性能数据 17池消融 18运行效果 19可靠性 20总结 21致谢

【版式】
- 版式A（模板 slide9）：技术图 + 5底栏要点
- 版式B（模板 slide33）：左5要点 + 右辅助图/卡片
- 讲解 15 分钟；第 18 页预留现场演示

【动画】
入场：stagger fade-up；流程图：stroke-dashoffset 画线；柱图：growBar。导出 PPT 时截动画完成帧。

【反模式】
不用 Mermaid、不用 Gamma 默认紫渐变、不用整页截图糊模板、不让左侧要点 opacity:0 无动画兜底。
```

---

## 五、逐页内容（21 页，对齐论文八章）

### 第 1 页｜封面 [模板 slide1]

- 主标题：基于 ECS 架构的类吸血鬼幸存者游戏开发及优化
- 副标题：本科毕业设计（论文）答辩 · Survivor And Fight
- 答辩人：刘瀚文｜2207020509｜计算机科学与技术
- 指导教师：董玉坤｜中国石油大学（华东）｜2026 年 5 月
- 关键词：ECS · LayaAir · 类幸存者 · 数据驱动 · 性能优化

### 第 2 页｜目录 [模板 slide2]

1. 研究背景与意义  
2. 技术路线与系统需求  
3. 总体架构与核心设计  
4. 关键模块与典型场景  
5. 性能优化与测试验证  
6. 创新点、不足与展望  

### 第 3 页｜研究背景 [版式B]

要点（论文 §1.1）：
- H5/WebGL 普及，浏览器**单主线程**限制帧预算
- Survivor-like + Roguelite：自动攻击、怪潮、局内构筑
- 深继承 OOP 同屏数百实体时**耦合高、难维护**
- 目标：轻量 ECS + 配表 + 池化/Worker 可落地
- 交付：菜单→跑图→战斗→装配→死亡重启

右图：OOP vs ECS 双列对比（HTML compare-panel，非 Mermaid）

### 第 4 页｜研究现状 [版式B]

要点（论文 §1.2）：
- Gregory 引擎分层；Ullmann 子系统耦合
- ECS 组合优于继承；课设**轻量 Map-ECS**
- 怪物：追玩家 + Boids 式排斥；**非完整** Helbing 社会力
- Worker 卸追逐/分离；碰撞与渲染留主线程
- 结论：模块化 + 重算分离 + 可验证

右图：4 张文献卡片 → 本课题四条技术线（lit-grid）

### 第 5 页｜创新点 [版式B]

要点（论文 §1.3 + 工程扩展）：
- 轻量 ECS：EcsWorld tick；ViewComponent 只绑 Laya
- 性能：对象池 + Worker + 动态图集（可消融）
- UI 协同：UIStackManager + Tab/paused 切断战斗
- 数据驱动：JSON 配表 + verify 脚本 + 需求—测试映射

### 第 6 页｜技术选型 [版式A]

主图：LayaAir frameLoop → EcsWorld → System → 渲染（SVG 横向流程）
底栏：LayaAir 3.x+TS；defines/JSON 分离；Roguelite DAG；UI2；assets/ 约束

### 第 7 页｜五层架构 [版式A] ⭐ showcase 页

主图：表现→UI→逻辑→服务→基础（五块 SVG，逻辑层高亮）
底栏：各层一句职责（论文 §4.2 图 4-1）

### 第 8 页｜ECS Gameplay [版式A]

主图：EcsWorld 三件套 + 组件区 + 系统区
底栏：Map 存储；纯数据组件；FilterRegistry；单线程 tick

### 第 9 页｜主循环与暂停 [版式A]

主图：frameLoop → input → EcsWorld → System 组序 → HUD
底栏：**GameSession.paused** 时 System 早退（非停 frameLoop）

### 第 10 页｜技能效果链 [版式A]

主图：冷却 → effectIds → modifier/bullet/direct_damage 三分支
底栏：行序语义；FormulaParser 禁 eval；EffectExecutor

### 第 11 页｜公式树 FormulaParser [版式A] ⭐ 论文重点

主图：白名单 → tokenize → parseFormula(AST) → evaluateFormula
辅：AST 示例 `(atk+5)*2=50`；数据流 modifier→context→扣 hp
底栏：direct_damage；ALLOWED_PATTERN；formulaParser.verify.ts

### 第 12 页｜MVC 与 Tab 装配 [版式B]

左要点：Model=ECS；UIStackManager；paused；SkillLoadoutSyncSystem
右图：Tab 时序 6 步列表

### 第 13 页｜性能优化 [版式A]

主图：左对象池生命周期 + 右 Worker 单帧（碰撞留主线程）
底栏：BulletPool/MonsterPool；computeSync 降级；TextureAtlasService

### 第 14 页｜三大典型场景 [版式B]

场景一：配表→菜单→首帧 tick（T-F-01/09）  
场景二：Tab→拖拽→Sync 写回（T-F-05/06）  
场景三：千怪波 Worker / computeSync（表 7-6）  
右图：战斗帧 System 时序

### 第 15 页｜测试策略 [版式B]

单元：ecsCore / formulaParser / attributeModifier  
功能：T-F-01～10  
性能：Level3 五波；1920×1080 Chromium  
右图：测试金字塔

### 第 16 页｜性能数据 [版式A]

主图：五波 FPS 柱图（58.62/46.84/15.14/26.16/25.98）+ 图集对比小字
底栏：环境；规模曲线；图集 +13.4%；整场均值 34.48

### 第 17 页｜对象池消融 [版式A]

主图：P95 柱图 76.50 vs 48.60，标注 **-36.5%**
底栏：均值 FPS 相近；削 GC 尖峰；以第 4–5 波为准

### 第 18 页｜运行效果 [版式A]

主图：元游戏闭环流程 + 可嵌 thesis/Png 图7-1～7-3 缩略
底栏：菜单/跑图/战斗/装配/重启；**建议现场演示**

### 第 19 页｜可靠性 [版式B]

isGameConfigReady 回退；Worker→computeSync；跑图 generateFallback；扩展：加组件/System

### 第 20 页｜工作总结 [版式B]

需求✓ 设计✓ 实现✓ 验证✓（论文第 8 章）

### 第 21 页｜致谢 [模板 slide4]

谢谢聆听 + 三段致谢

---

## 六、单页 Agent 提示模板

```
任务：生成答辩 PPT 第 {N} 页 HTML（1920×1080），套中国石油大学深蓝+橙模板风。

【版式】{A=主图+5底栏 | B=左5要点+右图 | cover | toc | thanks}
【标题】{≤18字}
【要点】（每条≤28字，共≤5条）
{列表}

【主图】{用内联SVG描述节点与箭头，禁止Mermaid；节点≤8}
【论文依据】thesis-from-docx.md §{章节}
【数据】{若有，粘贴原文数字，禁止修改}

【CSS 选择器】版式类写在 section 自身：class="slide layout-a"，动画用 .slide.layout-a.active
【导出】完成后可 node scripts/build-defense-ppt-v2.cjs
```

---

## 七、工程命令

```bash
# 预览（浏览器排练）
npm run ppt:v2:preview

# HTML 截图 → 套学校模板 → PPTX
npm run ppt:v2:build

# 输出
# ppt-output/毕业答辩PPT-v2.pptx
# ppt-output/v2-slide-shots/
```

---

## 八、与 v1（旧大纲）差异

| 项目 | v1 | v2 |
|------|----|----|
| 页数 | 19 | **21**（补公式树、测试策略、可靠性） |
| 图表 | Mermaid PNG | **SVG / HTML 卡片** |
| 数据 | 部分混用 | **锁定 thesis 表 7-5/7-6** |
| 模板 | Gamma + 事后 fix | **HTML 定稿 → 模板还原** |
| CSS | `.slide.active .layout-b` 子选择器 bug | **`.slide.layout-b.active`** |

---

*维护：论文定稿更新后，同步修改第五节逐页要点与第六节数据块。*
