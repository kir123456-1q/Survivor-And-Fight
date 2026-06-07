/**
 * 基于「中国石油大学汇报答辩通用ppt1.pptx」模板生成毕业答辩 PPT
 * 内容来源：docs/答辩PPT大纲.md
 *
 * 版式映射（经模板占位符分析）：
 * - slide 1  : 封面
 * - slide 2  : 六项目录（文本占位符 3/17/31/33/35/37）
 * - slide 9  : 单图 + 右侧要点（图片占位符 5 + 文本框 20）
 * - slide 33 : 五项要点（组合 32–36）
 * - slide 33 : 所有多要点正文（组合 32–36），避免 slide8/32 组合嵌套残留
 * - slide 4  : 致谢
 */
const { Automizer, modify, ModifyImageHelper } = require('pptx-automizer');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const templateFile = '中国石油大学汇报答辩通用ppt1.pptx';
const pngDir = path.join(root, 'thesis', 'Png');
const mediaDir = path.join(root, 'ppt-output', 'media-cache');
const outputDir = path.join(root, 'ppt-output');

fs.mkdirSync(mediaDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });

function mediaAlias(srcName, alias) {
  const src = path.join(pngDir, srcName);
  const dest = path.join(mediaDir, alias);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    return alias;
  }
  console.warn('Missing image:', srcName);
  return null;
}

const IMG = {
  usecase: mediaAlias('图3-1-fig-ch03-usecase.png', 'fig-usecase.png'),
  layers: mediaAlias('图4-1-fig-ch04-01-layers.png', 'fig-layers.png'),
  ecsBind: mediaAlias('图2-2-fig-ch02-ecs-bind.png', 'fig-ecs-bind.png'),
  skillChain: mediaAlias('图5-1-fig-ch05-skill-chain.png', 'fig-skill-chain.png'),
  tabSeq: mediaAlias('图5-2-fig-ch05-tab-sequence.png', 'fig-tab-seq.png'),
  pool: mediaAlias('图6-1-fig-ch06-pool-lifecycle.png', 'fig-pool.png'),
  fpsAtlas: mediaAlias('图6-3-fig-ch06-chart-fps-atlas.png', 'fig-fps-atlas.png'),
  p95Pool: mediaAlias('图6-4-fig-ch06-chart-p95-pool.png', 'fig-p95-pool.png'),
  s01: mediaAlias('图7-1-fig-01-start.png', 'fig-7-1.png'),
  s03: mediaAlias('图7-3-fig-03-combat.png', 'fig-7-3.png'),
};

const mediaFiles = Object.values(IMG).filter(Boolean);

function bulletMulti(bullets) {
  return bullets.map((text) => ({
    paragraph: { bullet: true, alignment: 'l' },
    textRuns: [{ text }],
  }));
}

function setText(slide, name, text) {
  slide.modifyElement(name, [modify.setText(text)]);
}

function clearTexts(slide, names) {
  names.forEach((n) => setText(slide, n, ''));
}

/** slide 2：六项目录 */
function fillSlide2Toc(slide, items) {
  const titleSlots = [
    '文本占位符 3',
    '文本占位符 17',
    '文本占位符 31',
    '文本占位符 33',
    '文本占位符 35',
    '文本占位符 37',
  ];
  const englishSlots = [
    '文本占位符 4',
    '文本占位符 18',
    '文本占位符 32',
    '文本占位符 34',
    '文本占位符 49',
    '文本占位符 50',
  ];
  items.slice(0, 6).forEach((text, i) => setText(slide, titleSlots[i], text));
  clearTexts(slide, englishSlots);
}

/** slide 33：五项要点（组合 32–36），清空第二行残留 */
function fillSlide33(slide, title, bullets) {
  setText(slide, '标题 1', title);
  const groups = ['组合 32', '组合 33', '组合 34', '组合 35', '组合 36'];
  groups.forEach((g, i) => {
    setText(slide, g, bullets[i] || '');
  });
  clearTexts(slide, ['文本框 6', '文本框 41']);
  ['组合 44', '组合 45', '组合 46', '组合 47', '组合 48'].forEach((g) => {
    try {
      slide.removeElement(g);
    } catch (_) {
      setText(slide, g, '');
    }
  });
}

/** slide 9：单图展示 + 右侧要点（避免 slide8 三圆环重叠） */
function fillSlide9(slide, presRef, title, imageFile, figCaption, bullets) {
  setText(slide, '标题 1', title);
  if (imageFile) {
    slide.modifyElement('图片占位符 5', [
      ModifyImageHelper.setRelationTargetCover(imageFile, presRef),
    ]);
  }
  setText(slide, '文本框 33', figCaption || '');
  slide.modifyElement('文本框 20', [modify.setMultiText(bulletMulti(bullets))]);
}

const automizer = new Automizer({
  templateDir: root,
  outputDir,
  removeExistingSlides: true,
  autoImportSlideMasters: true,
  cleanup: true,
  cleanupPlaceholders: true,
  verbosity: 1,
});

let pres = automizer.loadRoot(templateFile).load(templateFile, 'tpl');
for (const f of mediaFiles) {
  pres = pres.loadMedia(f, mediaDir);
}

// 第 1 页｜封面
pres.addSlide('tpl', 1, (slide) => {
  setText(slide, '标题 4', '基于 ECS 架构的类吸血鬼幸存者游戏开发及优化');
  setText(slide, '副标题 2', 'Survivor And Fight — 毕业设计答辩');
  setText(
    slide,
    '文本占位符 17',
    '答辩人：刘瀚文  ｜  学号：2207020509  ｜  计算机科学与技术',
  );
  setText(
    slide,
    '文本占位符 27',
    '指导教师：董玉坤  ｜  中国石油大学（华东）  ｜  2026 年 5 月',
  );
});

// 第 2 页｜汇报提纲
pres.addSlide('tpl', 2, (slide) => {
  fillSlide2Toc(slide, [
    '研究背景与选题意义',
    '技术路线与系统需求',
    '总体架构与核心设计',
    '关键模块与典型场景',
    '性能优化与测试验证',
    '创新点、不足与展望',
  ]);
});

// 第 3 页｜研究背景与意义
pres.addSlide('tpl', 33, (slide) => {
  fillSlide33(slide, '研究背景与意义', [
    'H5 链接即玩、跨端发布，但浏览器单主线程限制帧预算',
    'Survivor-like：自动攻击、怪潮、局内构筑 + Roguelite 元流程',
    '痛点：同屏实体多，深继承 OOP 耦合高、难维护、易掉帧',
    '目标：验证轻量 ECS + 配表 + 池化/Worker 在 H5 生存战斗可落地',
    '交付：菜单→跑图→战斗→升级装配→死亡重启完整闭环',
  ]);
});

// 第 4 页｜国内外研究现状
pres.addSlide('tpl', 33, (slide) => {
  fillSlide33(slide, '国内外研究现状', [
    '引擎架构：Gregory 分层；Ullmann 子系统耦合与架构退化',
    'ECS 趋势：组合优于继承；课设采用轻量 Map-ECS',
    '怪物运动：追玩家 + Boids 式排斥 + 摆动（非完整社会力）',
    'H5 性能：Worker 卸追逐/分离；碰撞留主线程；可验证',
  ]);
});

// 第 5 页｜项目概述与技术选型
pres.addSlide('tpl', 9, (slide) => {
  fillSlide9(slide, automizer, '项目概述与技术选型', IMG.s01, '图 7-1 游戏主菜单', [
    '浏览器端 2D 俯视角 Roguelite 生存战斗原型',
    '引擎：LayaAir 3.x + TypeScript + UI2',
    '参考：吸血鬼幸存者 + 杀戮尖塔 DAG 跑图',
    '工程：常量 src/defines/，数值 JSON 配表',
    '约束：Laya. 前缀；资源放 assets/',
  ]);
});

// 第 6 页｜需求分析概要
pres.addSlide('tpl', 9, (slide) => {
  fillSlide9(slide, automizer, '需求分析概要', IMG.usecase, '图 3-1 玩家用例总览', [
    'ECS、配表、跑图、Tab 装配、对象池、Worker 均已落地',
    'Must：移动、自动施法、碰撞、升级奖励',
    '元游戏：DAG 跑图选关；UI 全屏栈 + Tab 装配',
    '非功能：60 FPS；数百～千怪同屏',
    '验收：MoSCoW + 需求—测试映射表',
  ]);
});

// 第 7 页｜系统总体架构
pres.addSlide('tpl', 9, (slide) => {
  fillSlide9(slide, automizer, '系统总体架构（五层）', IMG.layers, '图 4-1 系统分层架构', [
    '表现层：Laya 节点与 HUD',
    'UI 层：UIStackManager、Controller',
    '逻辑层：SimpleEcsDemo + EcsWorld',
    '服务层：ConfigBootstrap、RunMapGenerator',
    '基础层：defines、对象池、Worker 协议',
  ]);
});

// 第 8 页｜ECS Gameplay
pres.addSlide('tpl', 9, (slide) => {
  fillSlide9(slide, automizer, 'ECS Gameplay 设计', IMG.ecsBind, '图 2-2 ECS 绑定关系', [
    'EntityId + ComponentStore（Map 存储）',
    '组件：Position、Attribute、Skill 等纯数据',
    '系统：Movement、Bullet、MonsterChase 等',
    'FilterRegistry：Players / Monsters 命名筛选',
    '单线程 tick，支撑数百同屏，学习成本低',
  ]);
});

// 第 9 页｜配表驱动与技能链
pres.addSlide('tpl', 9, (slide) => {
  fillSlide9(
    slide,
    automizer,
    '配表驱动与技能效果链',
    IMG.skillChain,
    '图 5-1 技能效果执行链',
    [
      'tables.registry.json → ConfigBootstrap 加载',
      'Skill 管冷却；SkillEffect 管效果链',
      'bullet / modifier_* / direct_damage',
      'modifier 行须在 bullet 行之前',
      'FormulaParser 白名单求值，禁止 eval',
    ],
  );
});

// 第 10 页｜MVC UI 与战斗协同
pres.addSlide('tpl', 9, (slide) => {
  fillSlide9(
    slide,
    automizer,
    'MVC UI 与战斗协同',
    IMG.tabSeq,
    '图 5-2 Tab 技能装配时序',
    [
      'Model 来自 ECS；View 管布局；Controller 管路由',
      'UIStackManager 全屏栈，单页持焦',
      'Tab 打开：GameSession.paused → System 早退',
      '关闭：SkillLoadoutSyncSystem 写回技能',
      'SkillDragService + SkillSlotHitTest 拖拽',
    ],
  );
});

// 第 11 页｜性能优化方案
pres.addSlide('tpl', 9, (slide) => {
  fillSlide9(slide, automizer, '性能优化方案', IMG.pool, '图 6-1 对象池生命周期', [
    'BulletPool / MonsterPool 按预制体分桶',
    'Worker 卸载追逐/分离/摆动重算',
    '失败回退 computeSync；碰撞留主线程',
    'paused 时战斗 System 统一早退',
    'TextureAtlasService 动态图集合批',
  ]);
});

// 第 12 页｜关键模块与典型场景
pres.addSlide('tpl', 33, (slide) => {
  fillSlide33(slide, '关键模块与典型场景', [
    'SimpleEcsDemo 组合根注册 System 与对象池',
    '场景一：配表加载 → 元菜单 → 进战斗首帧 tick',
    '场景二：Tab 改技能 — paused 切断 tick，Sync 写回',
    '场景三：千怪波 — 快照投递 Worker / computeSync',
    '降级：配表双通道、跑图 fallback、重启防重入',
  ]);
});

// 第 13 页｜性能测试（专用图表页）
pres.addSlide('tpl', 9, (slide) => {
  fillSlide9(slide, automizer, '性能测试与数据解读', IMG.fpsAtlas, '图 6-3 动态图集 FPS 对比', [
    '环境：1920×1080，Level3 五波脚本',
    '10→100→1000 怪：FPS 58.62 降至 15.14',
    '图集：千怪 FPS 13.32→15.10（+13.4%）',
    '对象池：P95 76.50→48.60 ms（-36.5%）',
    '池化削尖峰；图集改善绘制',
  ]);
});

// 第 14 页｜P95 消融（第二图）
pres.addSlide('tpl', 9, (slide) => {
  fillSlide9(slide, automizer, '对象池消融实验', IMG.p95Pool, '图 6-4 P95 帧时间对比', [
    '第 4 波基线：关池关 Worker，P95 76.50 ms',
    '第 5 波仅开池：P95 48.60 ms',
    '均值 FPS 相近，池化主要降低 GC 尖峰',
    '功能：T-F-01/05/06/09 全部通过',
    '单元：formulaParser / ecsCore / attributeModifier',
  ]);
});

// 第 15 页｜系统运行效果
pres.addSlide('tpl', 9, (slide) => {
  fillSlide9(slide, automizer, '系统运行效果展示', IMG.s03, '图 7-3 局内战斗场面', [
    '元游戏：主菜单、三幕 DAG 跑图',
    '局内：多怪弹幕、Tab 装配、升级奖励',
    '闭环：菜单→跑图→战斗→装配→死亡重启',
    'Must 需求已覆盖',
    '部分 Effect 仅逻辑生效、无独立 VFX',
  ]);
});

// 第 16 页｜主要创新点
pres.addSlide('tpl', 33, (slide) => {
  fillSlide33(slide, '主要创新点与工程特色', [
    '轻量 ECS：EcsWorld 驱动 tick；ViewComponent 只绑 Laya 节点',
    '性能组合拳：对象池 + Worker + 动态图集 + paused，均可消融',
    'UI 战斗协同：全屏栈 + Tab 装配与 GameSession.paused 统一切断',
    '数据驱动：JSON 配表 + verify 脚本 + 需求—测试追溯表',
    '可靠性：配表 / Worker / 跑图均有降级路径',
  ]);
});

// 第 17 页｜不足与展望
pres.addSlide('tpl', 33, (slide) => {
  fillSlide33(slide, '不足与展望', [
    '内容与表现：法杖三槽 UI、部分 Effect 特效/音效未补齐',
    '架构演进：Archetype/Chunk 存储；碰撞可加空间哈希',
    '测试：需 E2E UI 自动化与更长定期回归',
    '产品化：局外存档、元进度、帧率/同屏上限设置',
    '合规：虚构战斗、不采敏感数据；上网须标适龄与时长',
  ]);
});

// 第 18 页｜工作总结
pres.addSlide('tpl', 33, (slide) => {
  fillSlide33(slide, '工作总结', [
    '需求：MoSCoW + 测试映射，Must 级功能全部落地',
    '设计：五层架构 + ECS/MVC/Worker 协同设计',
    '实现：SimpleEcsDemo 组合根 + 三典型场景可演示',
    '验证：五波实验 + verify 脚本 + 运行截图 7-1～7-6',
    '论文与仓库源码、测试数据保持一致，具备可追溯性',
  ]);
});

// 第 19 页｜致谢
pres.addSlide('tpl', 4, (slide) => {
  setText(slide, '标题 1', '谢谢聆听');
  setText(
    slide,
    '文本占位符 3',
    '感谢指导教师董玉坤老师的指点\n' +
      '感谢学院师长、同学与家人的支持\n\n' +
      '请各位老师批评指正',
  );
});

const outFile = 'SurvivorAndFight-毕业答辩PPT.pptx';

pres
  .write(outFile)
  .then(() => {
    const dest = path.join(root, outFile);
    fs.copyFileSync(path.join(outputDir, outFile), dest);
    console.log('Generated:', dest);
    console.log('Slides: 19 (18 正文 + 性能图补页)');
  })
  .catch((err) => {
    console.error('Generation failed:', err);
    process.exit(1);
  });
