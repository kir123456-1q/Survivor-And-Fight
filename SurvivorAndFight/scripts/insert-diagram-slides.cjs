/**
 * 在「基于ECS架构…(1).pptx」原稿各相关页之后插入 Mermaid 导出插图页。
 * 不修改原有幻灯片内容，仅追加「单图 + 少量说明」页。
 *
 * 用法：node scripts/insert-diagram-slides.cjs
 */
const { Automizer, modify, ModifyImageHelper } = require('pptx-automizer');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const inputFile = fs.readdirSync(root).find((f) => f.endsWith('.pptx') && f.includes('(1)'));
const templateFile = '中国石油大学汇报答辩通用ppt1.pptx';
const outputFile = inputFile.replace('.pptx', '-含插图.pptx');
const pngDir = path.join(root, 'thesis', 'Png');
const cacheDir = path.join(root, 'ppt-output', 'diagram-insert-cache');
const outputDir = path.join(root, 'ppt-output');

if (!inputFile) {
  console.error('未找到输入：基于ECS架构…(1).pptx');
  process.exit(1);
}
if (!fs.existsSync(path.join(root, templateFile))) {
  console.error('未找到学校模板:', templateFile);
  process.exit(1);
}

fs.mkdirSync(cacheDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });

/** after：插在原稿第 N 页之后 */
const DIAGRAM_INSERTS = [
  {
    after: 7,
    file: '图2-1-fig-ch02-main-loop.png',
    title: '引擎主循环与 ECS 更新',
    intro: '每帧由 Laya.timer.frameLoop 驱动：先 EcsWorld.update，再渲染与 UI 事件分发。',
    caption: '图2-1  Laya 主循环与 EcsWorld 更新时序',
    bullets: ['逻辑 tick 与绘制分离', 'SystemScheduler 统一调度各 System', 'ViewSync 将组件变化映射到 Laya 节点'],
  },
  {
    after: 10,
    file: '图4-1-fig-ch04-01-layers.png',
    title: '系统五层分层架构',
    intro: '上层依赖下层，表现与基础设施分离，各层职责单一。',
    caption: '图4-1  系统分层架构',
    bullets: ['表现层：Laya 节点与 UI2', '逻辑层：EcsWorld + System', '基础设施：对象池、Worker、defines'],
  },
  {
    after: 10,
    file: '图4-2-fig-ch04-02-sequence.png',
    title: '系统主要交互时序',
    intro: '从菜单选关到战斗、装配与重启，展示 UI、ECS 与领域服务的调用顺序。',
    caption: '图4-2  系统主要交互时序',
    bullets: ['MetaFlowController 衔接跑图与战斗', 'Tab 暂停走 SkillLoadoutState 临时缓存', '死亡后回到主菜单形成闭环'],
  },
  {
    after: 11,
    file: '图4-8-fig-ch04-08-ecs-gameplay.png',
    title: 'ECS Gameplay 实现总览',
    intro: 'Entity 聚合组件，System 按 FilterRegistry 筛选后批量处理。',
    caption: '图4-8  基于 ECS 的 Gameplay 实现总览',
    bullets: ['组件仅存数据，System 负责逻辑', 'ViewComponent 桥接 Laya 表现', '典型 System：移动、施法、追逐、弹幕'],
  },
  {
    after: 12,
    file: '图5-1-fig-ch05-skill-chain.png',
    title: '技能效果执行链',
    intro: 'Skill 管 CD，SkillEffect 定义行为，buildSkillCastPlan 链式执行。',
    caption: '图5-1  技能效果执行链（buildSkillCastPlan）',
    bullets: ['JSON 配表驱动 Skill / SkillEffect', 'modifier 累积后供 bullet 效果读取', 'FormulaParser 白名单求值'],
  },
  {
    after: 12,
    file: '图5-4-fig-ch05-04-config-load.png',
    title: '配表双通道加载时序',
    intro: 'ConfigBootstrap 统一注册并加载 tables.registry.json 与各 JSON 配表。',
    caption: '图5-4  配表双通道加载时序',
    bullets: ['引擎资源通道 + fetch 双路径', '启动期完成表项解析与缓存', '策划改 JSON 无需改代码'],
  },
  {
    after: 14,
    file: '图5-2-fig-ch05-tab-sequence.png',
    title: 'Tab 技能装配交互时序',
    intro: '暂停战斗 → UI 改 SkillLoadoutState → 关闭面板后同步回 ECS。',
    caption: '图5-2  Tab 技能装配交互时序',
    bullets: ['GameSession.paused 冻结 System', '拖拽仅写临时状态', 'SkillLoadoutSyncSystem 批量写回'],
  },
  {
    after: 15,
    file: '图4-10-fig-ch04-10-worker-pool.png',
    title: 'Web Worker 与对象池设计',
    intro: '密集计算卸载 Worker，子弹/怪物复用池化实例，减少 GC。',
    caption: '图4-10  Web Worker 与对象池优化设计',
    bullets: ['Worker 重算追逐与分离', '主线程保留碰撞与渲染', 'BulletPool / MonsterPool 复用'],
  },
  {
    after: 15,
    file: '图4-7-fig-ch04-07-fault-degrade.png',
    title: '容错与降级策略',
    intro: 'Worker 失败、配表缺失、图集不可用等场景的降级路径。',
    caption: '图4-7  容错降级状态（正常运行 + 四分支）',
    bullets: ['Worker 超时回退主线程计算', '缺表项跳过并打日志', '暂停态 System 早退节省 CPU'],
  },
  {
    after: 17,
    file: '图6-3-fig-ch06-chart-fps-atlas.png',
    title: '动态图集 FPS 对比',
    intro: '千怪场景第 3 波：开启动态图集前后平均帧率变化。',
    caption: '图6-3  动态图集接入前后 FPS 对比',
    bullets: ['减少 Draw Call 与纹理切换', '千怪场景帧率有所提升', '与对象池互补而非替代'],
  },
  {
    after: 18,
    file: '图6-4-fig-ch06-chart-p95-pool.png',
    title: '对象池消融 P95 对比',
    intro: '1000 怪场景关闭 Worker，仅对比对象池开/关的 P95 帧时间。',
    caption: '图6-4  对象池消融 P95 帧时间对比',
    bullets: ['P95：76.50 ms → 48.60 ms', '降幅约 36.5%', '削减 GC 尖峰，提升运行稳定性'],
  },
];

function bulletMulti(bullets) {
  return bullets.map((text) => ({
    paragraph: { bullet: true, alignment: 'l' },
    textRuns: [{ text }],
  }));
}

function setText(slide, name, text) {
  slide.modifyElement(name, [modify.setText(text || '')]);
}

function resetImageCrop() {
  return (element) => {
    const srcRect = element.getElementsByTagName('a:srcRect')[0];
    if (srcRect) ['l', 't', 'r', 'b'].forEach((k) => srcRect.setAttribute(k, '0'));
    const locks = element.getElementsByTagName('a:picLocks');
    for (let i = 0; i < locks.length; i++) locks[i].removeAttribute('noChangeAspect');
  };
}

function fillDiagramSlide(slide, plan, mediaAlias) {
  setText(slide, '标题 1', plan.title);
  setText(slide, '文本框 33', [plan.intro, plan.caption].filter(Boolean).join('\n'));
  slide.modifyElement('文本框 20', [modify.setMultiText(bulletMulti(plan.bullets))]);
  slide.modifyElement('图片占位符 5', [
    resetImageCrop(),
    ModifyImageHelper.setRelationTarget(mediaAlias),
  ]);
}

function prepareMedia() {
  const aliases = {};
  const files = [...new Set(DIAGRAM_INSERTS.map((d) => d.file))];
  for (const file of files) {
    const src = path.join(pngDir, file);
    if (!fs.existsSync(src)) {
      console.warn('缺少 PNG:', file);
      continue;
    }
    const alias = `ins-${file}`;
    fs.copyFileSync(src, path.join(cacheDir, alias));
    aliases[file] = alias;
  }
  return aliases;
}

async function main() {
  console.log('输入:', inputFile);
  console.log('输出:', outputFile);

  const mediaAliases = prepareMedia();
  const missing = DIAGRAM_INSERTS.filter((d) => !mediaAliases[d.file]);
  if (missing.length) {
    console.error('缺少插图文件，无法继续:', missing.map((m) => m.file).join(', '));
    process.exit(1);
  }

  const insertsByAfter = {};
  for (const ins of DIAGRAM_INSERTS) {
    if (!insertsByAfter[ins.after]) insertsByAfter[ins.after] = [];
    insertsByAfter[ins.after].push(ins);
  }

  const automizer = new Automizer({
    templateDir: root,
    outputDir,
    removeExistingSlides: true,
    autoImportSlideMasters: true,
    cleanup: true,
    verbosity: 1,
  });

  let pres = automizer.loadRoot(inputFile).load(inputFile, 'src').load(templateFile, 'tpl');
  for (const alias of new Set(Object.values(mediaAliases))) {
    pres = pres.loadMedia(alias, cacheDir);
  }

  const info = await pres.getInfo();
  const total = info.templateByName('src').slides.length;
  console.log('原稿页数:', total);

  let inserted = 0;
  for (let n = 1; n <= total; n++) {
    pres.addSlide('src', n);
    for (const plan of insertsByAfter[n] || []) {
      const alias = mediaAliases[plan.file];
      pres.addSlide('tpl', 9, (slide) => {
        fillDiagramSlide(slide, plan, alias);
      });
      inserted += 1;
      console.log(`  + 插图页（插在原第 ${n} 页后）: ${plan.caption}`);
    }
  }

  await pres.write(outputFile);
  const built = path.join(outputDir, outputFile);
  const dest = path.join(root, outputFile);
  try {
    fs.copyFileSync(built, dest);
    console.log('\n完成:', dest);
  } catch (err) {
    if (err?.code === 'EBUSY') {
      console.warn('\n目标文件被占用，已写入:', built);
    } else {
      throw err;
    }
  }
  console.log(`共保留原稿 ${total} 页，新增插图页 ${inserted} 页，合计 ${total + inserted} 页。`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
