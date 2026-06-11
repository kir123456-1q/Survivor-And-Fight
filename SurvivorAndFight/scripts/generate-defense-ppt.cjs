/**
 * 按 docs/答辩PPT大纲.md（21 页）生成毕业答辩 PPT
 * 模板：中国石油大学汇报答辩通用ppt1.pptx
 * 插图：Mermaid CLI 导出 PNG（contain，不裁切）
 *
 * 用法：node scripts/generate-defense-ppt.cjs
 */
const { Automizer, modify, ModifyImageHelper } = require('pptx-automizer');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const templateFile = '中国石油大学汇报答辩通用ppt1.pptx';
const cacheDir = path.join(root, 'ppt-output', 'diagram-cache');
const diagramDir = path.join(root, 'ppt-output', 'diagrams');
const outputDir = path.join(root, 'ppt-output');
const outFile = 'SurvivorAndFight-毕业答辩PPT.pptx';

if (!fs.existsSync(path.join(root, templateFile))) {
  console.error('未找到模板:', templateFile);
  process.exit(1);
}

fs.mkdirSync(cacheDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });

const DIAGRAM_EXPORTS = [
  { key: 'main-loop', mmd: 'thesis/diagrams/fig-ch02-main-loop.mmd', args: ['-w', '2400', '-H', '800', '-s', '2'] },
  { key: 'layers', mmd: 'thesis/figures/system-layers.mmd', args: ['-w', '2200', '-H', '700', '-s', '2'] },
  { key: 'ecs-gameplay', mmd: 'thesis/figures/ecs-gameplay-overview.mmd', args: ['-w', '2200', '-H', '1600', '-s', '2'] },
  { key: 'ecs-class', mmd: 'ppt-output/diagrams/ecs-class.mmd', args: ['-w', '2000', '-H', '1400', '-s', '2'] },
  { key: 'skill-effect', mmd: 'ppt-output/diagrams/skill-effect-outline.mmd', args: ['-w', '2000', '-H', '1600', '-s', '2'] },
  { key: 'tab-seq', mmd: 'thesis/figures/skill-tab-sequence.mmd', args: ['-w', '2000', '-H', '1400', '-s', '2'] },
  { key: 'pool-worker', mmd: 'ppt-output/diagrams/pool-worker-outline.mmd', args: ['-w', '2200', '-H', '1200', '-s', '2'] },
  { key: 'startup-seq', mmd: 'ppt-output/diagrams/startup-seq-outline.mmd', args: ['-w', '2200', '-H', '1400', '-s', '2'] },
  { key: 'fps-chart', mmd: 'thesis/diagrams/fig-ch06-chart-fps-atlas.mmd', args: ['-w', '1600', '-H', '900', '-s', '2'] },
  { key: 'p95-chart', mmd: 'thesis/diagrams/fig-ch06-chart-p95-pool.mmd', args: ['-w', '1600', '-H', '900', '-s', '2'] },
  { key: 'meta-loop', mmd: 'ppt-output/diagrams/meta-loop.mmd', args: ['-w', '2200', '-H', '600', '-s', '2'] },
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
      console.warn('缺少 Mermaid 源:', item.mmd);
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
      console.warn('导出失败:', item.key, err.message?.slice(0, 100));
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

function setText(slide, name, text) {
  slide.modifyElement(name, [modify.setText(text || '')]);
}

function clearTexts(slide, names) {
  names.forEach((n) => setText(slide, n, ''));
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

/** slide 2：六项目录 */
function fillSlide2Toc(slide, items) {
  const titleSlots = [
    '文本占位符 3', '文本占位符 17', '文本占位符 31',
    '文本占位符 33', '文本占位符 35', '文本占位符 37',
  ];
  const englishSlots = [
    '文本占位符 4', '文本占位符 18', '文本占位符 32',
    '文本占位符 34', '文本占位符 49', '文本占位符 50',
  ];
  items.slice(0, 6).forEach((text, i) => setText(slide, titleSlots[i], text));
  clearTexts(slide, englishSlots);
}

/** slide 33：五项要点 + 可选收束句 */
function fillSlide33(slide, title, bullets, footer) {
  setText(slide, '标题 1', title);
  ['组合 32', '组合 33', '组合 34', '组合 35', '组合 36'].forEach((g, i) => {
    setText(slide, g, bullets[i] || '');
  });
  if (footer) setText(slide, '文本框 6', footer);
  else clearTexts(slide, ['文本框 6']);
  clearTexts(slide, ['文本框 41']);
  ['组合 44', '组合 45', '组合 46', '组合 47', '组合 48'].forEach((g) => {
    try {
      slide.removeElement(g);
    } catch (_) {
      setText(slide, g, '');
    }
  });
}

/** slide 9：单图 + 引导/图注 + 要点（图片 contain） */
function fillSlide9(slide, title, pngKey, pngMap, intro, caption, bullets) {
  setText(slide, '标题 1', title);
  const sub = [intro, caption].filter(Boolean).join('\n');
  setText(slide, '文本框 33', sub);
  slide.modifyElement('文本框 20', [modify.setMultiText(bulletMulti(bullets))]);

  const pngPath = pngMap[pngKey];
  if (!pngPath || !fs.existsSync(pngPath)) {
    console.warn('缺图，跳过:', pngKey);
    return;
  }
  const alias = `${pngKey}.png`;
  slide.modifyElement('图片占位符 5', [
    resetImageCrop(),
    ModifyImageHelper.setRelationTarget(alias),
  ]);
}

async function main() {
  console.log('按答辩PPT大纲生成 21 页…');
  const pngMap = exportDiagrams();

  const mediaFiles = [];
  for (const item of DIAGRAM_EXPORTS) {
    const p = pngMap[item.key];
    if (p && fs.existsSync(p)) {
      const alias = `${item.key}.png`;
      fs.copyFileSync(p, path.join(cacheDir, alias));
      mediaFiles.push(alias);
    }
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
    pres = pres.loadMedia(f, cacheDir);
  }

  // 1 封面
  pres.addSlide('tpl', 1, (slide) => {
    setText(slide, '标题 4', '基于 ECS 架构的类吸血鬼幸存者游戏开发及优化');
    setText(slide, '副标题 2', 'Survivor And Fight — 毕业设计答辩');
    setText(slide, '文本占位符 17', '答辩人：刘瀚文  ｜  学号：2207020509  ｜  计算机科学与技术');
    setText(slide, '文本占位符 27', '指导教师：董玉坤  ｜  中国石油大学（华东）  ｜  2026 年 5 月');
  });

  // 2 目录
  pres.addSlide('tpl', 2, (slide) => {
    fillSlide2Toc(slide, [
      '研究背景与选题意义',
      '技术路线与总体架构',
      'ECS 玩法与配表战斗',
      'UI 协同与性能优化',
      '测试验证与运行闭环',
      '创新点、不足与展望',
    ]);
  });

  // 3 背景
  pres.addSlide('tpl', 33, (slide) => {
    fillSlide33(slide, '研究背景与意义', [
      'H5 链接即玩，但浏览器单主线程使「怪潮+弹幕」帧预算紧张',
      '类吸血鬼幸存者：自动施法、密集敌群、局内构筑；参考杀戮尖塔式 DAG 跑图',
      '深继承 OOP 难扩展：新技能/新怪常改整条继承链，同屏实体一多就难维护',
      '课题目标：轻量 ECS + JSON 配表 + 池化/Worker，做出可演示可测的原型',
      '交付：主菜单→三幕跑图选关→局内战斗→Tab 改技能→死亡重启闭环',
    ]);
  });

  // 4 技术选型
  pres.addSlide('tpl', 9, (slide) => {
    fillSlide9(
      slide,
      '项目概述与技术选型',
      'main-loop',
      pngMap,
      '浏览器端 2D 俯视角 Roguelite：主菜单→跑图→战斗→Tab 装配→死亡重启。',
      '图1  引擎主循环：逻辑 tick 与画面渲染分离',
      [
        '引擎 LayaAir 3.x + TypeScript，UI 采用 UI2',
        '玩法参考吸血鬼幸存者 + 杀戮尖塔式 DAG 跑图',
        '工程常量集中 defines；战斗数值走 JSON 配表',
        '每帧先跑 ECS 逻辑，再由引擎绘制与响应 UI',
        '资源放 assets/，引擎 API 使用 Laya. 前缀',
      ],
    );
  });

  // 5 架构文字
  pres.addSlide('tpl', 33, (slide) => {
    fillSlide33(
      slide,
      '系统总体架构',
      [
        '表现层：血条、怪物预制体、相机跟随等「看得见」的部分，只根据数据刷新画面',
        'UI 控制层：主菜单、跑图、技能面板、升级弹窗；栈管理打开/关闭与输入焦点',
        '游戏逻辑层：每帧 ECS 调度——移动、施法、子弹、刷怪、经验升级等核心玩法',
        '领域服务层：启动加载 JSON 配表；生成三幕 DAG 跑图；战斗帧快照交 Worker',
        '基础设施层：实体组件存储、对象池、Worker 协议、全局常量与降级开关',
      ],
      '五层自上而下调用；UI 暂停时逻辑层统一早退，不直接操作 DOM。',
    );
  });

  // 6 架构分层图
  pres.addSlide('tpl', 9, (slide) => {
    fillSlide9(
      slide,
      '系统总体架构（五层分层）',
      'layers',
      pngMap,
      '五层单向依赖：表现在上、基础设施在下；改 UI 不必改子弹碰撞。',
      '图2  五层架构与依赖方向',
      [
        '表现层只消费逻辑层产出的位置、血量等数据',
        'UI 层用暂停标记切断战斗 tick',
        '逻辑层是玩法「唯一真相源」',
        '服务层承接配表、跑图、战斗快照桥接',
        '基础层提供池化与 Worker，支撑千怪场景',
      ],
    );
  });

  // 7 架构 Gameplay 图
  pres.addSlide('tpl', 9, (slide) => {
    fillSlide9(
      slide,
      '系统总体架构（Gameplay 总览）',
      'ecs-gameplay',
      pngMap,
      '配表与组件是真相；怪物多时快照送 Worker 算追逐，子弹碰撞仍回主线程。',
      '图3  Gameplay：数据、系统、战斗桥接与暂停',
      [
        '玩家/怪物靠标签区分，按组批量处理',
        '配表驱动技能，系统无状态便于扩展',
        'Tab/死亡/胜利时战斗逻辑整帧跳过',
        'Worker 只卸追逐/分离/摆动',
        '扩展新能力 = 增组件或增系统，非改继承树',
      ],
    );
  });

  // 8 ECS 流程文字
  pres.addSlide('tpl', 33, (slide) => {
    fillSlide33(
      slide,
      'ECS 玩法设计',
      [
        '进战斗前：主菜单→跑图生成三幕 DAG→选关→创建玩家实体并注册战斗系统',
        '战斗每帧：移动/自动施法→技能冷却→子弹碰撞→怪物追逐刷怪→经验与 HUD',
        '实体构成：玩家含位置/属性/技能栏；怪物含位置与定义；会话实体存暂停/重启状态',
        '画面同步：逻辑只改数字，同步系统把坐标与血量映射到 Laya 节点',
        '跑图与战斗：跑图走 UI 控制器；进战斗后 ECS 接管；Tab 暂停改栏位后写回技能',
      ],
      '单线程 Map 存储，数百～千怪同屏；学习成本低于商业 DOTS。',
    );
  });

  // 9 ECS 结构图
  pres.addSlide('tpl', 9, (slide) => {
    fillSlide9(
      slide,
      'ECS 玩法设计（结构关系）',
      'ecs-class',
      pngMap,
      '怪物实体同时挂位置、属性与显示绑定；系统遍历「带位置的怪物」统一处理。',
      '图4  实体、组件与系统的绑定关系',
      [
        '实体 ID 唯一标识场景中的一个角色',
        '组件是纯数据：坐标、速度、血量、冷却、节点引用',
        '移动/子弹/追逐等系统按筛选规则批量更新',
        '玩家与怪物共享位移组件，仅身份标签不同',
        '新怪 = 换预制体 + 换配表行，不必写子类',
      ],
    );
  });

  // 10 配表流程文字
  pres.addSlide('tpl', 33, (slide) => {
    fillSlide33(
      slide,
      '配表驱动战斗',
      [
        '启动：读注册表索引→拉取技能/效果/怪物 JSON；fetch 失败改本地加载，再失败回退默认配置',
        '技能栏位：每技能含多条效果行——改子弹参数、生成子弹、直接扣血',
        '施法一帧：检查冷却→读效果列表→按序执行→先累加修饰再生成子弹或结算伤害',
        '公式安全：白名单解析器计算伤害，禁止 eval',
        '部分效果尚无独立特效，但数值与命中判定已可玩',
      ],
      '配表—执行器—战斗系统三段式，是数据驱动的核心。',
    );
  });

  // 11 配表效果图
  pres.addSlide('tpl', 9, (slide) => {
    fillSlide9(
      slide,
      '配表驱动战斗（效果执行链）',
      'skill-effect',
      pngMap,
      '一次自动施法：先处理分裂/穿透修饰，再生成子弹或直接扣血。',
      '图5  技能效果链：冷却→遍历效果行→子弹/伤害',
      [
        '修饰行必须在子弹行之前，否则参数来不及注入',
        '子弹行从对象池取节点发射',
        '直接伤害行跳过飞行物',
        '多行效果可组合「先分裂再发射」构筑',
        'verify 脚本可对照配表做回归',
      ],
    );
  });

  // 12 Tab 协同
  pres.addSlide('tpl', 9, (slide) => {
    fillSlide9(
      slide,
      'UI 与战斗协同（Tab 装配）',
      'tab-seq',
      pngMap,
      'Tab 打开技能面板时全局暂停，怪物与子弹停止结算；关闭后写回 ECS 再恢复。',
      '图6  Tab：暂停→拖拽改栏位→写回→恢复',
      [
        '视图管布局，控制器管路由，数据来自 ECS',
        '全屏 UI 栈，同时只有一个战斗面板持焦',
        '拖拽只改临时栏位，避免误触战斗实体',
        '关闭面板时同步写回技能，下帧自动施法生效',
        '面板打开时指针给 UI，战斗 tick 不跑',
      ],
    );
  });

  // 13 性能优化
  pres.addSlide('tpl', 9, (slide) => {
    fillSlide9(
      slide,
      '性能优化方案',
      'pool-worker',
      pngMap,
      '瓶颈在怪物追逐、子弹创建与绘制；池化减 GC、Worker 卸重算、图集减 DrawCall。',
      '图7  对象池复用与 Worker 单帧管线',
      [
        '子弹/怪物按预制体分桶复用节点',
        '实体达标后快照送 Worker 算追逐/排斥/摆动',
        'Worker 失败则主线程同公式补算',
        '子弹碰撞读 Laya 节点，始终主线程',
        '暂停/死亡时战斗系统入口直接返回',
      ],
    );
  });

  // 14 战斗时序
  pres.addSlide('tpl', 9, (slide) => {
    fillSlide9(
      slide,
      '局内战斗一帧时序',
      'startup-seq',
      pngMap,
      '从启动到重启：配表就绪→跑图选关→战斗帧循环；Tab 与死亡打断 tick。',
      '图8  启动→进战斗→帧循环→Tab→重启',
      [
        '启动：配表→主菜单→跑图→初始化 ECS 与对象池',
        '战斗帧：施法→子弹→碰撞→刷怪→经验→HUD',
        '高负载时 Worker 与主线程碰撞分工并行',
        'Tab：暂停→改技能→写回→恢复',
        '死亡：重启面板回主菜单，防重复清场',
      ],
    );
  });

  // 15 FPS
  pres.addSlide('tpl', 9, (slide) => {
    fillSlide9(
      slide,
      '性能测试与数据解读',
      'fps-chart',
      pngMap,
      'Level3 五波加压：10→100→1000 怪；第3波对比图集，第4～5波做池化消融。',
      '图9  Level3 五波平均 FPS',
      [
        '环境 1920×1080，固定五波脚本',
        '10 怪约 58 FPS；1000 怪约 15 FPS',
        '千怪开图集：13.32→15.10 FPS（+13.4%）',
        '对象池主要降 P95 尖峰，均值 FPS 变化不大',
        '功能用例 T-F-01/05/06/09 全部通过',
      ],
    );
  });

  // 16 P95
  pres.addSlide('tpl', 9, (slide) => {
    fillSlide9(
      slide,
      '对象池消融实验',
      'p95-chart',
      pngMap,
      '第4波关池作基线，第5波仅开池；均值 FPS 接近，P95 明显下降。',
      '图10  对象池消融 P95（1000 怪 / 10s）',
      [
        '基线 P95：76.50 ms',
        '仅开池 P95：48.60 ms（约 -36.5%）',
        '池化削 GC 尖峰，非抬高平均帧率',
        '单元测试覆盖公式/ECS/属性修饰',
        '与论文第 6 章数据一致',
      ],
    );
  });

  // 17 元游戏闭环
  pres.addSlide('tpl', 9, (slide) => {
    fillSlide9(
      slide,
      '元游戏运行闭环',
      'meta-loop',
      pngMap,
      '整局：菜单→三幕 DAG 跑图→生存战斗→升级/Tab 装配→死亡回菜单。',
      '图11  元游戏 + 局内战斗闭环',
      [
        '跑图：随机 DAG，仅走已解锁边；失败有 fallback 线性图',
        '局内：自动攻击、怪潮、拾取经验升级',
        'Tab 随时暂停改构筑',
        '死亡后重启回主菜单',
        '部分效果尚无独立 VFX，逻辑已生效',
      ],
    );
  });

  // 18 创新
  pres.addSlide('tpl', 33, (slide) => {
    fillSlide33(slide, '主要创新点与工程特色', [
      '轻量 ECS：跑图/战斗/装配共用实体模型，维护成本低于深继承 OOP',
      '性能组合拳：池化+Worker+图集+暂停早退，均可消融验证',
      'UI 战斗协同：Tab 与死亡共用暂停，全屏栈防输入穿透',
      '数据驱动：JSON 配表+白名单公式+verify 脚本',
      '可靠性：配表双通道、Worker 回退、跑图 fallback',
    ]);
  });

  // 19 不足
  pres.addSlide('tpl', 33, (slide) => {
    fillSlide33(slide, '不足与展望', [
      '表现：法杖三槽 UI、部分技能特效/音效未补齐',
      '架构：可演进 Archetype/Chunk；碰撞可加空间哈希',
      '怪物 AI：追逐+排斥+摆动，非完整人群仿真模型',
      '测试：需 E2E UI 自动化与更长定期回归',
      '产品化：局外存档、元进度、帧率上限与合规提示',
    ]);
  });

  // 20 总结
  pres.addSlide('tpl', 33, (slide) => {
    fillSlide33(slide, '工作总结', [
      '完成 H5 Roguelite 原型：菜单—跑图—战斗—装配—重启全链路可演示',
      '五层架构+ECS+配表 effect 链+MVC UI 协同已落地',
      'Level3 五波压测与对象池消融支撑论文结论',
      '源码、配表、测试与论文表述保持一致可追溯',
      '为同类 H5 生存游戏提供可复用工程参考',
    ]);
  });

  // 21 致谢
  pres.addSlide('tpl', 4, (slide) => {
    setText(slide, '标题 1', '谢谢聆听');
    setText(
      slide,
      '文本占位符 3',
      '感谢指导教师董玉坤老师在选题、架构与写作上的指点\n' +
        '感谢学院师长、同学与家人的支持\n\n' +
        '请各位老师批评指正',
    );
  });

  await pres.write(outFile);
  const built = path.join(outputDir, outFile);
  const dest = path.join(root, outFile);
  try {
    fs.copyFileSync(built, dest);
    console.log('\n完成:', dest);
  } catch (err) {
    if (err && err.code === 'EBUSY') {
      console.warn('\n根目录文件被占用，请关闭 PowerPoint 后重试。');
      console.warn('已生成:', built);
    } else {
      throw err;
    }
  }
  console.log('共 21 页；插图来自 Mermaid 导出（ppt-output/diagram-cache/）');
}

main().catch((err) => {
  console.error('生成失败:', err);
  process.exit(1);
});
