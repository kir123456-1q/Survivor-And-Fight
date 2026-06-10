# 答辩 PPT 文字优化说明

> 文件：`基于ECS架构的类吸血鬼幸存者游戏开发及优化.pptx`  
> 处理：**套用学校模板背景** + **修正文字**；元素位置与版式未改动。

## 一、发现的主要问题

1. **生成/OCR 错字**：如「国内外研究明版式」「OF PETNO」「Varpire」「Basedon」等。
2. **繁体字**：「中國石油大学」→ 简体「中国石油大学（华东）」。
3. **英文拼写**：CHINA UNIVESITY OF FETROLEM → UNIVERSITY OF PETROLEUM。
4. **术语乱码**：ConfigBoostrap、EcsVbocld、SkilloadoutSync、PlayerDeathSyam 等。
5. **重复与粘连**：多段文字挤在一个文本框、公式重复三次、数据行粘连。
6. **数据与论文不一致**：100 怪 FPS 应为 **46.84**（非 45.50）；P95 数据按表 7-6。
7. **致谢信息**：指导教师 XXX → **董玉坤**；第 18 页乱码标题改为「谢谢聆听」。

## 二、背景套用规则

| 页码 | 模板版式 |
|------|----------|
| 1 | slideLayout1（封面） |
| 2 | slideLayout2（目录） |
| 3–17 | slideLayout11（正文） |
| 18–19 | slideLayout5（致谢） |

同时合并模板 slideMasters / slideLayouts / theme，并移除原稿 `noFill` 背景覆盖。

## 三、逐页修正摘要

- **封面**：规范中英文标题与答辩人信息。
- **目录**：六项提纲与论文结构对齐，去除「总总体设计」等笔误。
- **背景/现状**：补全截断句，文献表述与论文第 2 章一致。
- **选型/需求/五层/ECS**：统一 ConfigBootstrap、ComponentStore、UIStackManager 等术语。
- **MVC/模块/跑图/性能**：删除重复段，数据与论文表 7-5、7-6 对齐。
- **测试/总结/展望**：T-F-01～10、verify.ts、不足与展望分栏保留原排版。
- **致谢**：统一谢辞与指导教师姓名。

---
*由 scripts/apply-template-bg-and-text.cjs 生成*
