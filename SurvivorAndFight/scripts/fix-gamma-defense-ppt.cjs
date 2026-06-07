/**
 * 修正 AI 生成的答辩 PPT 版式：插入 Mermaid 导出图，按「标题+引导+图+图注+解读」排版。
 *
 * 输入：项目根目录下「基于ECS架构的类吸血鬼幸存者游戏开发及优化 (1).pptx」
 * 输出：同目录「基于ECS架构的类吸血鬼幸存者游戏开发及优化-已排版.pptx」
 *
 * 用法：node scripts/fix-gamma-defense-ppt.cjs
 */
const { Automizer, modify, ModifyImageHelper } = require('pptx-automizer');
const { imageSize } = require('image-size');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const inputFile = fs.readdirSync(root).find((f) => f.endsWith('.pptx') && f.includes('(1)'));
if (!inputFile) {
  console.error('未找到输入文件：基于ECS架构的类吸血鬼幸存者游戏开发及优化 (1).pptx');
  process.exit(1);
}

const outputFile = inputFile.replace(' (1).pptx', '-已排版.pptx');
const cacheDir = path.join(root, 'ppt-output', 'diagram-cache');
const outputDir = path.join(root, 'ppt-output');

fs.mkdirSync(cacheDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });

const SW = 12192000;
const SH = 6858000;
const emu = (px, py, pw, ph) => ({
  x: Math.round((SW * px) / 100),
  y: Math.round((SH * py) / 100),
  w: Math.round((SW * pw) / 100),
  h: Math.round((SH * ph) / 100),
});

/** 版式 A：标题 → 引导语 → 主图 → 图注 → 底部解读（参考答辩 PPT「每页一观点、上图下文」） */
const ZONES = {
  title: emu(5.3, 6.5, 89.2, 5),
  intro: emu(5.3, 12, 89.2, 7),
  centerImage: emu(5.4, 20, 89.2, 40),
  caption: emu(28, 62.5, 44, 4.5),
  bottomBar: emu(5.3, 68.5, 89.2, 12.5),
};

const DIAGRAM_EXPORTS = [
  { key: 'main-loop', mmd: 'thesis/diagrams/fig-ch02-main-loop.mmd', args: ['-w', '2400', '-H', '800', '-s', '2'] },
  { key: 'usecase', mmd: 'thesis/diagrams/fig-ch03-usecase.mmd', args: ['-w', '2400', '-H', '900', '-s', '2'] },
  { key: 'layers', mmd: 'thesis/figures/system-layers.mmd', args: ['-w', '2000', '-H', '600', '-s', '2'] },
  { key: 'ecs-bind', mmd: 'thesis/diagrams/fig-ch02-ecs-bind.mmd', args: ['-w', '2000', '-H', '1400', '-s', '2'] },
  { key: 'skill-effect', mmd: 'thesis/figures/skill-effect-flow.mmd', args: ['-w', '2000', '-H', '1800', '-s', '2'] },
  { key: 'tab-seq', mmd: 'thesis/figures/skill-tab-sequence.mmd', args: ['-w', '2000', '-H', '1400', '-s', '2'] },
  { key: 'pool', mmd: 'thesis/figures/pool-lifecycle.mmd', args: ['-w', '2200', '-H', '600', '-s', '2'] },
  { key: 'fps-chart', mmd: 'thesis/diagrams/fig-ch06-chart-fps-atlas.mmd', args: ['-w', '1600', '-H', '900', '-s', '2'] },
  { key: 'p95-chart', mmd: 'thesis/diagrams/fig-ch06-chart-p95-pool.mmd', args: ['-w', '1600', '-H', '900', '-s', '2'] },
];

function exportDiagrams() {
  const pngMap = {};
  let hasMmdc = false;
  try {
    execSync('npx --yes @mermaid-js/mermaid-cli --version', { stdio: 'pipe' });
    hasMmdc = true;
  } catch (_) {
    console.warn('未检测到 mermaid-cli，将仅使用已有 PNG。');
  }

  for (const item of DIAGRAM_EXPORTS) {
    const src = path.join(root, item.mmd);
    const out = path.join(cacheDir, `${item.key}.png`);
    pngMap[item.key] = out;
    if (!fs.existsSync(src)) {
      console.warn('缺少 Mermaid 源文件:', item.mmd);
      continue;
    }
    if (fs.existsSync(out) && fs.statSync(out).mtimeMs > fs.statSync(src).mtimeMs) {
      continue;
    }
    if (!hasMmdc) continue;
    console.log('导出 Mermaid:', item.key);
    try {
      execSync(
        `npx --yes @mermaid-js/mermaid-cli -i "${src}" -o "${out}" -b transparent ${item.args.join(' ')}`,
        { stdio: 'pipe', cwd: root },
      );
    } catch (err) {
      console.warn('Mermaid 导出失败:', item.key, err.message?.slice(0, 120));
    }
  }
  return pngMap;
}

function bulletMulti(bullets) {
  return bullets.map((text) => ({
    paragraph: { bullet: true, alignment: 'l' },
    textRuns: [{ text }],
  }));
}

function makeRemover(existingNames) {
  const set = new Set(existingNames);
  return (slide, name) => {
    if (set.has(name)) slide.removeElement(name);
  };
}

function clearContentCards(slide, remove) {
  for (let i = 10; i <= 40; i++) remove(slide, `AutoShape ${i}`);
  for (let i = 5; i <= 30; i++) remove(slide, `Freeform ${i}`);
  [
    'Connector 9', 'Connector 13', 'Connector 17', 'Connector 19',
    'Connector 21', 'Connector 23', 'Connector 25', 'Picture 11', 'Picture 28',
  ].forEach((n) => remove(slide, n));
}

function clearSectionDecorations(slide, remove) {
  for (let i = 5; i <= 30; i++) remove(slide, `Freeform ${i}`);
  remove(slide, 'Picture 28');
}

function resetImageCrop() {
  return (element) => {
    const srcRect = element.getElementsByTagName('a:srcRect')[0];
    if (srcRect) {
      ['l', 't', 'r', 'b'].forEach((k) => srcRect.setAttribute(k, '0'));
    }
    const locks = element.getElementsByTagName('a:picLocks');
    for (let i = 0; i < locks.length; i++) locks[i].removeAttribute('noChangeAspect');
  };
}

function fitImageToZone(pngPath, zone) {
  let dim = { width: zone.w, height: zone.h };
  try {
    dim = imageSize(pngPath);
  } catch (_) {
    return zone;
  }
  if (!dim.width || !dim.height) return zone;
  const imageAr = dim.width / dim.height;
  const zoneAr = zone.w / zone.h;
  let w = zone.w;
  let h = zone.h;
  if (imageAr > zoneAr) h = Math.round(zone.w / imageAr);
  else w = Math.round(zone.h * imageAr);
  return {
    x: zone.x + Math.round((zone.w - w) / 2),
    y: zone.y + Math.round((zone.h - h) / 2),
    w,
    h,
  };
}

function insertTitle(slide, text) {
  slide.addElement('src', 10, 'AutoShape 10', [modify.setPosition(ZONES.title), modify.setText(text)]);
}

function insertIntro(slide, lines) {
  slide.addElement('src', 10, 'AutoShape 13', [
    modify.setPosition(ZONES.intro),
    modify.setMultiText(bulletMulti(lines)),
  ]);
}

function insertCaption(slide, text) {
  slide.addElement('src', 14, 'AutoShape 16', [
    modify.setPosition(ZONES.caption),
    modify.setText(text),
  ]);
}

function insertDiagram(slide, pngPath, zone) {
  if (!pngPath || !fs.existsSync(pngPath)) {
    console.warn('跳过插图（文件不存在）:', pngPath);
    return;
  }
  const alias = path.basename(pngPath);
  const fit = fitImageToZone(pngPath, zone);
  slide.addElement('src', 20, 'Picture 11', [
    resetImageCrop(),
    ModifyImageHelper.setRelationTarget(alias),
    modify.setPosition(fit),
  ]);
}

function insertBottomBullets(slide, bullets) {
  slide.addElement('src', 14, 'AutoShape 25', [
    modify.setPosition(ZONES.bottomBar),
    modify.setMultiText(bulletMulti(bullets)),
  ]);
}

/** 就地更新已有卡片/标题，不删除版式骨架 */
function applyCardLayout(slide, plan, existing) {
  const has = new Set(existing);
  if (plan.title && has.has('AutoShape 10')) {
    slide.modifyElement('AutoShape 10', [modify.setText(plan.title)]);
  }
  for (const card of plan.cards || []) {
    if (card.title && card.titleEl && has.has(card.titleEl)) {
      slide.modifyElement(card.titleEl, [modify.setText(card.title)]);
    }
    if (card.body && card.bodyEl && has.has(card.bodyEl)) {
      slide.modifyElement(card.bodyEl, [modify.setText(card.body)]);
    }
  }
  const summaryEl = plan.summaryEl || 'AutoShape 28';
  if (plan.summary && has.has(summaryEl)) {
    slide.modifyElement(summaryEl, [modify.setText(plan.summary)]);
  }
}

const SLIDE_PLAN = {
  3: { layout: 'section' },
  5: {
    layout: 'stack-four',
    title: '国内外研究现状',
    cards: [
      {
        titleEl: 'AutoShape 12', bodyEl: 'AutoShape 14',
        title: '01. 引擎分层：五层架构理论支撑',
        body: '参考 Gregory《Game Engine Architecture》分层思想，本项目划分表现、UI、逻辑、服务、基础设施五层，模块低耦合，便于扩展与维护。',
      },
      {
        titleEl: 'AutoShape 16', bodyEl: 'AutoShape 18',
        title: '02. 轻量 ECS：组合优于继承',
        body: '采用 Map 存储的轻量 ECS，单线程 tick 驱动；Entity 聚合组件，System 读写数据，降低 H5 课设周期的集成与学习成本。',
      },
      {
        titleEl: 'AutoShape 20', bodyEl: 'AutoShape 22',
        title: '03. 怪物运动：追逐 + 局部排斥',
        body: 'MonsterChaseSystem 实现追玩家、Boids 式邻域排斥与正弦摆动；分离项参考 Helbing 对密集场景稳定性的认识，未实现完整社会力模型；高同屏时由 Worker 卸载 O(n²) 重算。',
      },
      {
        titleEl: 'AutoShape 24', bodyEl: 'AutoShape 26',
        title: '04. H5 性能：Worker 线程分流',
        body: '实体达标后将追逐、分离、摆动快照送 Worker，主线程写回速度并保留碰撞与渲染；与文献中「重算与画面分离」的工程思路一致。',
      },
    ],
  },
  6: { layout: 'section' },
  9: { layout: 'section' },
  13: { layout: 'section' },
  16: { layout: 'section' },
  19: { layout: 'section' },
  7: {
    layout: 'center',
    title: '项目概述与技术选型',
    intro: [
      '本页说明 H5 Roguelite 原型的技术栈与主循环路线。',
      '核心：LayaAir 驱动 → EcsWorld 调度 → System 读写组件 → ViewSync 渲染。',
    ],
    diagram: 'main-loop',
    caption: '图1  技术路线总览（主循环 → ECS → 渲染）',
    bullets: [
      '浏览器端 2D 俯视角 Roguelite 生存战斗原型',
      '引擎：LayaAir 3.x + TypeScript + UI2',
      '参考：吸血鬼幸存者 + 杀戮尖塔 DAG 跑图',
      '工程：常量 defines 模块，数值 JSON 配表',
      '约束：Laya. 前缀；资源放 assets/',
    ],
  },
  8: {
    layout: 'center',
    title: '需求分析概要',
    intro: [
      '本页用用例图概括玩家路径与 MoSCoW 优先级。',
      'Must 级功能已映射测试用例，支撑验收追溯。',
    ],
    diagram: 'usecase',
    caption: '图2  玩家用例总览（菜单 → 战斗 → 装配 → 重启）',
    bullets: [
      'ECS、配表、跑图、Tab 装配、对象池、Worker 均已落地',
      'Must：移动、自动施法、碰撞、升级奖励',
      '元游戏：DAG 跑图选关；UI 全屏栈 + Tab 装配',
      '非功能：60 FPS；数百～千怪同屏',
      '验收：MoSCoW + 需求—测试映射',
    ],
  },
  10: {
    layout: 'center',
    title: '系统总体架构（五层）',
    intro: [
      '本页展示自顶向下的五层依赖：上层只依赖下层。',
      '目标：高内聚低耦合，防止逻辑与表现相互渗透。',
    ],
    diagram: 'layers',
    caption: '图3  系统五层架构（表现 → UI → 逻辑 → 服务 → 基础）',
    bullets: [
      '表现层：Laya 节点与 HUD',
      'UI 层：UIStackManager、Controller',
      '逻辑层：SimpleEcsDemo + EcsWorld',
      '服务层：ConfigBootstrap、RunMapGenerator',
      '基础层：defines、对象池、Worker 协议',
    ],
  },
  11: {
    layout: 'center',
    title: 'ECS Gameplay 设计',
    intro: [
      '本页说明轻量 Map-ECS：Entity 聚合组件，System 单线程 tick。',
      'ViewComponent 桥接 Laya 节点，实现数据与表现分离。',
    ],
    diagram: 'ecs-bind',
    caption: '图4  ECS 实体与组件绑定关系',
    bullets: [
      'EntityId + ComponentStore（Map 存储）',
      '组件：Position、Attribute、Skill 等纯数据',
      '系统：Movement、Bullet、MonsterChase 等',
      'FilterRegistry：Players / Monsters 命名筛选',
      '单线程 tick，支撑数百同屏',
    ],
  },
  12: {
    layout: 'center',
    title: '配表驱动与技能效果链',
    intro: [
      '本页说明 JSON 配表如何驱动技能释放与效果链执行。',
      '策划改表即可调参，程序通过白名单公式解析保障安全。',
    ],
    diagram: 'skill-effect',
    caption: '图5  技能效果执行链（冷却 → 遍历 effect → 子弹/伤害）',
    bullets: [
      'tables.registry.json → ConfigBootstrap 加载',
      'Skill 管冷却；SkillEffect 管效果链',
      'bullet / modifier_* / direct_damage',
      'modifier 行须在 bullet 行之前',
      'FormulaParser 白名单求值，禁止 eval',
    ],
  },
  14: {
    layout: 'center',
    title: 'MVC UI 与战斗协同',
    intro: [
      '本页说明 Tab 暂停装配如何与 ECS 战斗 tick 协同。',
      'paused 切断战斗逻辑，关闭面板后 Sync 写回技能。',
    ],
    diagram: 'tab-seq',
    caption: '图6  Tab 技能装配时序（暂停 → 拖拽 → 写回 → 恢复）',
    bullets: [
      'Model 来自 ECS；View 管布局；Controller 管路由',
      'UIStackManager 全屏栈，单页持焦',
      'Tab 打开：GameSession.paused → System 早退',
      '关闭：SkillLoadoutSyncSystem 写回技能',
      'SkillDragService + SkillSlotHitTest 拖拽',
    ],
  },
  15: {
    layout: 'center',
    title: '性能优化方案',
    intro: [
      '本页汇总对象池、Worker、动态图集三项优化组合拳。',
      '池化削 GC 尖峰；Worker 卸载追逐；图集降 DrawCall。',
    ],
    diagram: 'pool',
    caption: '图7  对象池生命周期（spawn → 飞行 → 回收复用）',
    bullets: [
      'BulletPool / MonsterPool 按预制体分桶',
      'Worker 卸载追逐/分离/摆动重算',
      '失败回退 computeSync；碰撞留主线程',
      'paused 时战斗 System 统一早退',
      'TextureAtlasService 动态图集合批',
    ],
  },
  17: {
    layout: 'center',
    title: '性能测试与数据解读',
    intro: [
      '本页展示 Level3 五波压测：怪量递增观察 FPS 变化。',
      '千怪场景下动态图集带来约 13.4% 帧率提升。',
    ],
    diagram: 'fps-chart',
    caption: '图8  Level3 五波 FPS + 动态图集对比',
    bullets: [
      '环境：1920×1080，Level3 五波脚本',
      '10→100→1000 怪：FPS 58.62 降至 15.14',
      '图集：千怪 FPS 13.32→15.10（+13.4%）',
      '对象池：P95 76.50→48.60 ms（-36.5%）',
      '池化削尖峰；图集改善绘制',
    ],
  },
  18: {
    layout: 'center',
    title: '对象池消融实验',
    intro: [
      '本页用消融实验验证对象池对 P95 帧时间的改善。',
      '均值 FPS 相近，池化主要消除 GC 导致的帧时间尖峰。',
    ],
    diagram: 'p95-chart',
    caption: '图9  对象池消融 P95 帧时间（1000 怪 / 10s）',
    bullets: [
      '第 4 波基线：关池关 Worker，P95 76.50 ms',
      '第 5 波仅开池：P95 48.60 ms',
      '均值 FPS 相近，池化主要降 GC 尖峰',
      '功能：T-F-01/05/06/09 全部通过',
      '单元：formulaParser / ecsCore / attributeModifier',
    ],
  },
  20: {
    layout: 'ring-four',
    title: '主要创新点与工程特色',
    cards: [
      {
        titleEl: 'AutoShape 13', bodyEl: 'AutoShape 14',
        title: '轻量 ECS 架构',
        body: 'EcsWorld 驱动 tick；ViewComponent 只绑 Laya 节点，逻辑与表现彻底解耦，维护成本低。',
      },
      {
        titleEl: 'AutoShape 16', bodyEl: 'AutoShape 17',
        title: '性能组合拳',
        body: '对象池 + Web Worker + 动态图集 + paused 早退，均可消融验证，适配 H5 高并发。',
      },
      {
        titleEl: 'AutoShape 19', bodyEl: 'AutoShape 20',
        title: 'UI 与战斗协同',
        body: 'MVC 全屏栈 + Tab/paused 统一切断；JSON 配表 + verify 脚本，需求可追溯到测试。',
      },
    ],
    summary: '构建了可维护、高性能的 H5 Roguelite 原型，为同类项目提供架构与实践参考。',
    summaryEl: 'AutoShape 21',
  },
  21: {
    layout: 'ring-four',
    title: '不足与展望',
    cards: [
      {
        titleEl: 'AutoShape 20', bodyEl: 'AutoShape 21',
        title: '不足：内容与表现',
        body: '法杖三槽 UI、部分 Effect 特效/音效未补齐；表现层仍有迭代空间。',
      },
      {
        titleEl: 'AutoShape 24', bodyEl: 'AutoShape 25',
        title: '不足：架构与测试',
        body: 'ECS 可演进 Archetype/Chunk；碰撞可加空间哈希；需 E2E UI 自动化与长期回归。',
      },
      {
        titleEl: 'AutoShape 12', bodyEl: 'AutoShape 13',
        title: '展望：产品化',
        body: '完善局外存档、元进度、帧率/同屏上限设置，向可发布产品形态演进。',
      },
      {
        titleEl: 'AutoShape 16', bodyEl: 'AutoShape 17',
        title: '展望：合规规范',
        body: '虚构战斗、不采敏感数据；上线须标注适龄提示与合理游戏时长。',
      },
    ],
    summary: '正视短板，聚焦架构演进与产品完善，推动项目持续迭代与质量升级。',
  },
  22: {
    layout: 'grid-four',
    title: '基于 ECS 架构的类吸血鬼幸存者游戏开发及优化总结',
    cards: [
      {
        titleEl: 'AutoShape 13', bodyEl: 'AutoShape 15',
        title: '01 需求分析',
        body: 'MoSCoW 优先级 + 需求—测试映射，Must 级功能全部落地，可追溯验收。',
      },
      {
        titleEl: 'AutoShape 18', bodyEl: 'AutoShape 20',
        title: '02 架构设计',
        body: '五层架构融合 ECS、MVC 与 Web Worker，逻辑与渲染解耦，扩展性良好。',
      },
      {
        titleEl: 'AutoShape 23', bodyEl: 'AutoShape 25',
        title: '03 功能实现',
        body: 'SimpleEcsDemo 组合根统一管理；敌人生成、弹幕、成长三大场景可演示。',
      },
      {
        titleEl: 'AutoShape 28', bodyEl: 'AutoShape 30',
        title: '04 测试验证',
        body: '五波性能实验 + 消融验证；论文、源码与测试数据保持一致，形成闭环。',
      },
    ],
  },
};

function applySlidePlan(slide, plan, pngMap, remove, existing) {
  if (!plan) return;

  if (plan.layout === 'section') {
    clearSectionDecorations(slide, remove);
    return;
  }

  if (plan.layout === 'ring-four' || plan.layout === 'grid-four' || plan.layout === 'stack-four') {
    applyCardLayout(slide, plan, existing);
    return;
  }

  clearContentCards(slide, remove);
  if (plan.title) insertTitle(slide, plan.title);
  if (plan.intro) insertIntro(slide, plan.intro);
  if (plan.diagram) insertDiagram(slide, pngMap[plan.diagram], ZONES.centerImage);
  if (plan.caption) insertCaption(slide, plan.caption);
  if (plan.bullets) insertBottomBullets(slide, plan.bullets);
}

async function main() {
  console.log('输入:', inputFile);
  const pngMap = exportDiagrams();

  const mediaFiles = [];
  for (const item of DIAGRAM_EXPORTS) {
    const p = pngMap[item.key];
    if (p && fs.existsSync(p)) mediaFiles.push(path.basename(p));
  }
  if (!mediaFiles.length) {
    console.error('没有可用的 PNG 插图。');
    process.exit(1);
  }

  const automizer = new Automizer({
    templateDir: root,
    outputDir,
    removeExistingSlides: true,
    autoImportSlideMasters: true,
    cleanup: true,
    verbosity: 1,
  });

  let pres = automizer.loadRoot(inputFile).load(inputFile, 'src');
  for (const f of mediaFiles) pres = pres.loadMedia(f, cacheDir);

  const info = await pres.getInfo();
  const src = info.templateByName('src');
  const total = src.slides.length;
  const namesBySlide = {};
  for (const s of src.slides) {
    namesBySlide[s.number] = (s.elements || []).map((e) => e.name);
  }
  console.log('总页数:', total);

  for (let n = 1; n <= total; n++) {
    const plan = SLIDE_PLAN[n];
    const remove = makeRemover(namesBySlide[n] || []);
    pres.addSlide('src', n, (slide) => {
      if (plan) {
        applySlidePlan(slide, plan, pngMap, remove, namesBySlide[n] || []);
        console.log(`  已处理第 ${n} 页 (${plan.layout})`);
      }
    });
  }

  await pres.write(outputFile);
  const built = path.join(outputDir, outputFile);
  const dest = path.join(root, outputFile);
  try {
    fs.copyFileSync(built, dest);
    console.log('\n完成:', dest);
  } catch (err) {
    if (err && err.code === 'EBUSY') {
      console.warn('\n根目录文件被占用，请先关闭 PowerPoint 中的旧稿。');
      console.warn('已生成副本:', built);
    } else {
      throw err;
    }
  }
  console.log('说明: 插图页=标题+引导+图+图注+解读；第20-22页保留卡片版式并填入正文。');
}

main().catch((err) => {
  console.error('排版失败:', err);
  process.exit(1);
});
