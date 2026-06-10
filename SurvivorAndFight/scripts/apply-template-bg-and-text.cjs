/**
 * 套用学校模板背景 + 修正答辩 PPT 文字（不改元素位置/排版）
 */
const { zipOoxml } = require('./ooxml-zip.cjs');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'ppt-output');

function findPpt(pred) {
  return fs.readdirSync(root).find((f) => f.endsWith('.pptx') && pred(f));
}

const inputFile = findPpt((f) => f.includes('基于ECS') && !f.includes('已排版') && !f.includes('(1)'));
const templateFile = findPpt((f) => f.includes('通用ppt1'));
if (!inputFile || !templateFile) {
  console.error('缺少 PPT 或模板');
  process.exit(1);
}

const LAYOUT_FOR_SLIDE = (n) => {
  if (n === 1) return 'slideLayout1.xml';
  if (n === 2) return 'slideLayout2.xml';
  if (n === 18 || n === 19) return 'slideLayout5.xml';
  return 'slideLayout11.xml';
};

/** slide -> { TextBoxName: newText } */
const TEXT_BY_BOX = {
  1: {
    'TextBox 3': '基于 ECS 架构的类吸血鬼幸存者游戏开发及优化',
    'TextBox 4': 'Development and Optimization of a Vampire-Survivor-like Game Based on ECS Architecture',
    'TextBox 5': '答辩人：刘瀚文　｜　学号：2207020509',
    'TextBox 6': '计算机科学与技术　｜　中国石油大学（华东）',
  },
  2: {
    'TextBox 10': '汇报提纲',
    'TextBox 11': '中国石油大学（华东）',
    'TextBox 12': 'CHINA UNIVERSITY OF PETROLEUM',
    'TextBox 13': '研究背景与现状',
    'TextBox 14': '技术选型与需求',
    'TextBox 19': '总体架构设计',
    'TextBox 20': '核心模块实现',
    'TextBox 23': 'Overall Architecture',
    'TextBox 24': 'Core Implementation',
    'TextBox 25': '性能优化与测试',
    'TextBox 26': '总结与展望',
    'TextBox 29': 'Optimization & Testing',
    'TextBox 30': 'Conclusion & Outlook',
    'TextBox 31': '勤奋严谨 求实创新',
  },
  3: {
    'TextBox 5': '研究背景与意义',
    'TextBox 6': '行业趋势',
    'TextBox 7': '工程挑战',
    'TextBox 8': 'H5 游戏普及：链接即玩、跨端发布；逻辑与资源走 Web 栈，版本迭代成本低。浏览器单主线程下 GC 与绘制共用帧预算，战斗逻辑过重易掉帧。Survivor-like 品类：自动攻击 + 怪潮 + 局内构筑，对程序结构提出硬要求。',
    'TextBox 9': '数值需外置 JSON 配表，便于调参。同屏怪物与弹幕数量大，需批量高效处理。元流程：菜单 → 选关 → 跑图 → 战斗形成闭环。深继承 OOP 模块耦合高、难维护，数百实体同屏时帧率吃紧。',
    'TextBox 11': '勤奋严谨 求实创新',
  },
  4: {
    'TextBox 14': '国内外研究现状',
    'TextBox 15': '中国石油大学（华东）',
    'TextBox 16': '引擎架构研究',
    'TextBox 17': 'ECS 架构实践',
    'TextBox 18': 'Gregory 划分子系统；Ullmann SyDRA 恢复依赖图，引擎层与游戏层分离利于维护。',
    'TextBox 19': 'Unity DOTS 数据导向并行；课设采用轻量 Map-ECS，组合优于继承。',
    'TextBox 20': '人群与性能仿真',
    'TextBox 21': 'Survivor-like 玩法',
    'TextBox 22': '《吸血鬼幸存者》验证品类；《杀戮尖塔》DAG 选路。H5 深继承 OOP 维护与性能均吃紧。',
    'TextBox 23': 'Boids 局部规则 + Helbing 分离力；Web Worker 搬运纯数值重算，碰撞留主线程。',
    'TextBox 24': '勤奋严谨 求实创新',
  },
  5: {
    'TextBox 7': '技术选型与路线',
    'TextBox 8': '中国石油大学（华东）',
    'TextBox 9': '引擎与语言',
    'TextBox 10': '架构选型',
    'TextBox 11': '轻量 ECS：EntityId + ComponentStore（Map）+ EcsWorld 单例 tick。数据驱动：tables.registry.json + ConfigBootstrap。主循环：Laya.timer.frameLoop → EcsWorld.update → 渲染。',
    'TextBox 12': 'LayaAir 3.x + TypeScript + UI2；元菜单与跑图不另拼工具链。实体/组件/System 增删有类型约束。',
    'TextBox 13': '工程常量放 src/defines/；策划数值外置 JSON 配表。',
    'TextBox 14': 'Laya 节点仅表现层，核心 tick 在自研 ECS。',
    'TextBox 16': '勤奋严谨 求实创新',
  },
  6: {
    'TextBox 11': '需求分析',
    'TextBox 12': '中国石油大学（华东）',
    'TextBox 19': '元游戏：主菜单 → 跑图选关 → 战斗 → 升级装配 → 死亡重启。自动攻击：ControlSystem + PlayerAutoCastSystem。技能配表：Skill / SkillEffect 外置。怪物：MonsterChaseSystem + MonsterWaveSpawnSystem。',
    'TextBox 20': '非功能：1920×1080 尽量贴近 60 FPS；ECS 组合代替继承；verify.ts + 功能用例覆盖。',
    'TextBox 21': 'Should：法杖三槽 UI 装配。',
    'TextBox 22': 'Could：更多特效音效；局外存档与元进度。',
    'TextBox 23': '勤奋严谨 求实创新',
  },
  7: {
    'TextBox 13': '系统总体架构（五层）',
    'TextBox 14': '表现层',
    'TextBox 15': 'Laya 预制体、Sprite、UI2；ViewComponent 绑定节点',
    'TextBox 17': 'UI 控制层',
    'TextBox 19': 'UIStackManager 全屏栈；Panel / Controller',
    'TextBox 20': '游戏逻辑层',
    'TextBox 21': 'EcsWorld tick；ECS 组件与 System',
    'TextBox 25': '对象池 BulletPool / MonsterPool',
    'TextBox 26': 'JSON 配表 + tables.registry.json',
    'TextBox 28': '领域服务层',
    'TextBox 29': 'ConfigBootstrap、RunMapGenerator、TextureAtlasService',
    'TextBox 30': '基础设施层',
    'TextBox 31': 'defines、Worker 协议；表现仅绑定，核心在 ECS',
  },
  8: {
    'TextBox 5': 'ECS Gameplay 设计',
    'TextBox 6': '系统（System）',
    'TextBox 7': '组件（Component）',
    'TextBox 8': 'PlayerTag / MonsterTag；Position / Velocity；Attribute + modifier；Skill / SkillLoadoutState；ViewComponent 仅绑节点。',
    'TextBox 9': 'ControlSystem、MovementSystem、MonsterChaseSystem、AttributeSystem、SkillSystem、BulletSystem、EffectExecutor 效果链。',
    'TextBox 12': 'FilterRegistry 注册筛选名，各 System 按名取实体。',
  },
  9: {
    'TextBox 6': 'MVC 界面与数据驱动',
    'TextBox 7': '中国石油大学（华东）',
    'TextBox 13': '伤害公式 atk*1.5+10 由 FormulaParser 白名单求值',
    'TextBox 16': 'Panel：Laya 节点布局与显示',
    'TextBox 17': 'ConfigBootstrap.ensureGameConfigLoaded()',
    'TextBox 18': 'EffectExecutor 按表顺序解释效果',
    'TextBox 21': '修饰行须在 bullet 行之前；Targeting 索敌；isGameConfigReady 拦截',
    'TextBox 22': 'Model 持界面态；Controller 处理交互',
    'TextBox 24': 'Tab 打开时 GameSession.paused 暂停战斗',
    'TextBox 25': 'Skill + 多行 SkillEffect 配表驱动',
    'TextBox 27': '勤奋严谨 求实创新',
  },
  10: {
    'TextBox 7': '核心模块实现',
    'TextBox 13': 'ConfigBootstrap 拉表 → isGameConfigReady → 主菜单 → RunMapPanel → BattleScene；RunMapGenerator 生成 DAG 跑图。',
    'TextBox 14': 'EcsWorld.update 每帧 tick；ControlSystem → MovementSystem → SkillSystem → BulletSystem。',
    'TextBox 15': 'UIStackManager 页面栈；GameSession.paused 暂停战斗；SkillLoadoutSyncSystem 写回装配；PlayerDeathSystem → RestartPanel。',
    'TextBox 16': 'MonsterChaseSystem + MonsterWaveSpawnSystem；ExperienceSystem 升级奖励。',
    'TextBox 17': '勤奋严谨 求实创新',
  },
  11: {
    'TextBox 4': '跑图元游戏与技能系统',
    'TextBox 7': '三幕 DAG 跑图：RunMapGenerator 摆节点；validateActReachBoss 失败则 generateFallback。',
    'TextBox 8': 'Skill / SkillEffect 配表；effect：bullet、modifier、direct_damage；FormulaParser 安全求值；Targeting 索敌。',
    'TextBox 10': '勤奋严谨 求实创新',
  },
  12: {
    'TextBox 8': '性能优化：对象池与 Web Worker',
    'TextBox 9': '中国石油大学（华东）',
    'TextBox 12': 'BulletPool / MonsterPool get-put 复用；isMonsterPoolEnabled 开关。',
    'TextBox 13': 'CombatDataBridge 投递 Worker；写回 Velocity；失败 computeSync 主线程兜底；碰撞不进 Worker。',
    'TextBox 15': 'P95：76.50 ms → 48.60 ms（约 -36.5%）；池化主要削 GC 尖峰。',
    'TextBox 16': '勤奋严谨 求实创新',
  },
  13: {
    'TextBox 12': '性能优化：渲染合批与帧预算',
    'TextBox 13': '中国石油大学（华东）',
    'TextBox 18': 'GameSession.paused 统一暂停；装配/死亡/胜利共用 paused，避免界面停而刷怪继续。',
    'TextBox 19': 'BulletHitTest 距离平方比较，避免 sqrt。',
    'TextBox 20': 'TextureAtlasService 动态合批；千怪 FPS 13.32 → 15.10（+13.4%）。',
    'TextBox 25': '60 FPS≈16.67 ms：UI 1–2 ms，ECS 6–8 ms，Worker≤1 ms，其余渲染。',
    'TextBox 26': '勤奋严谨 求实创新',
  },
  14: {
    'TextBox 8': '系统测试与验证',
    'TextBox 9': '中国石油大学（华东）',
    'TextBox 13': '单元：ecsCorePhase1 / formulaParser / attributeModifier.verify.ts。',
    'TextBox 14': '功能：T-F-01～10 覆盖战斗、跑图、装配、重启；Worker 开/关算法一致。',
    'TextBox 16': '性能：Level3 五波 10/100/1000 怪；第 4–5 波消融；TestLevelFpsTracker 统计 FPS/P95。',
    'TextBox 17': '勤奋严谨 求实创新',
  },
  15: {
    'TextBox 3': '性能测试结果',
    'TextBox 6': '10 怪 58.62 → 100 怪 46.84 → 1000 怪 15.14 FPS；图集后千怪 13.32 → 15.10（+13.4%）。',
    'TextBox 7': '无池 P95 76.50 ms；仅池 P95 48.60 ms（-36.5%）。五波均值 FPS 约 34.48。',
    'TextBox 8': '图集抬千怪波 FPS，池化压 P95 尖峰，Worker 参与第 1–3 波追逐。',
    'TextBox 9': '勤奋严谨 求实创新',
  },
  16: {
    'TextBox 10': '工作总结',
    'TextBox 11': '中国石油大学（华东）',
    'TextBox 15': '完成文献调研与 LayaAir + 轻量 ECS + 配表路线选型，明确差异化定位。',
    'TextBox 16': '五层架构 + ECS/MVC/Worker 实现；技能链、跑图、Tab 装配闭环可演示。',
    'TextBox 17': '千怪池化 P95 降 36.5%；图集抬 FPS 约 13.4%；verify + 用例验证核心契约。',
    'TextBox 18': '菜单 → 跑图 → 战斗 → 升级 → 重启，达到毕设预期。',
    'TextBox 19': '勤奋严谨 求实创新',
  },
  17: {
    'TextBox 5': '不足与展望',
    'TextBox 6': '不足：法杖三槽 UI、部分特效音效未齐；Map 存储与碰撞缺空间哈希；缺 E2E 自动化；局外存档待做。',
    'TextBox 7': '展望：Archetype/Chunk ECS；空间哈希碰撞；E2E + CI；静态站托管；低功耗档位。',
    'TextBox 8': '勤奋严谨 求实创新',
  },
  18: {
    'TextBox 2': '谢谢聆听',
    'TextBox 6': '答辩人：刘瀚文　｜　指导教师：董玉坤　｜　中国石油大学（华东）',
  },
  19: {
    'TextBox 5': '谢谢聆听',
    'TextBox 6': '感谢指导教师董玉坤老师在选题、架构与写作上的指点',
    'TextBox 7': '感谢学院师长、同学与家人的支持',
    'TextBox 8': '请各位老师批评指正',
  },
};

function unzip(pptPath, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const z = `${dest}.zip`;
  fs.copyFileSync(pptPath, z);
  fs.rmSync(dest, { recursive: true, force: true });
  execSync(
    `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${z.replace(/'/g, "''")}' -DestinationPath '${dest.replace(/'/g, "''")}' -Force"`,
    { stdio: 'pipe' },
  );
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function mergeMedia(tplDir, genDir) {
  const tplMedia = path.join(tplDir, 'ppt', 'media');
  const genMedia = path.join(genDir, 'ppt', 'media');
  if (!fs.existsSync(tplMedia)) return;
  fs.mkdirSync(genMedia, { recursive: true });
  for (const f of fs.readdirSync(tplMedia)) {
    const d = path.join(genMedia, f);
    if (!fs.existsSync(d)) fs.copyFileSync(path.join(tplMedia, f), d);
  }
}

function parseRelationships(relsXml) {
  const out = [];
  for (const m of relsXml.matchAll(/<Relationship\s+([^>]+)\/>/g)) {
    const attrs = m[1];
    const pick = (k) => {
      const hit = attrs.match(new RegExp(`${k}="([^"]*)"`));
      return hit ? hit[1] : '';
    };
    out.push({ Id: pick('Id'), Type: pick('Type'), Target: pick('Target') });
  }
  return out;
}

function serializeRelationships(rels) {
  const body = rels
    .map((r) => `<Relationship Id="${r.Id}" Type="${r.Type}" Target="${r.Target}"/>`)
    .join('');
  return `<?xml version='1.0' encoding='UTF-8' standalone='yes'?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${body}</Relationships>`;
}

/** 合并母版/主题关系，为模板项分配不与幻灯片冲突的新 rId */
function mergePresentationRels(genPresRels, tplPresRels) {
  const keep = parseRelationships(genPresRels).filter(
    (r) => !r.Type.includes('slideMaster') && !r.Type.endsWith('/theme'),
  );
  const fromTpl = parseRelationships(tplPresRels).filter(
    (r) => r.Type.includes('slideMaster') || r.Type.endsWith('/theme'),
  );

  let maxId = keep.reduce((n, r) => Math.max(n, parseInt(r.Id.replace(/^rId/, ''), 10) || 0), 0);
  const idMap = {};
  const added = fromTpl.map((r) => {
    maxId += 1;
    const newId = `rId${maxId}`;
    idMap[r.Id] = newId;
    return { ...r, Id: newId };
  });

  return { xml: serializeRelationships([...keep, ...added]), idMap };
}

function applyTemplateTheme(tplDir, genDir, slideCount) {
  for (const sub of ['slideMasters', 'slideLayouts', 'theme']) {
    const src = path.join(tplDir, 'ppt', sub);
    const dst = path.join(genDir, 'ppt', sub);
    if (fs.existsSync(src)) {
      fs.rmSync(dst, { recursive: true, force: true });
      copyDir(src, dst);
    }
  }
  mergeMedia(tplDir, genDir);

  const tplPresRels = fs.readFileSync(path.join(tplDir, 'ppt', '_rels', 'presentation.xml.rels'), 'utf8');
  const genPresRelsPath = path.join(genDir, 'ppt', '_rels', 'presentation.xml.rels');
  const genPresRels = fs.readFileSync(genPresRelsPath, 'utf8');
  const { xml: mergedRels, idMap } = mergePresentationRels(genPresRels, tplPresRels);
  fs.writeFileSync(genPresRelsPath, mergedRels);

  const tplPres = fs.readFileSync(path.join(tplDir, 'ppt', 'presentation.xml'), 'utf8');
  const masterIdList = tplPres.match(/<p:sldMasterIdLst>[\s\S]*?<\/p:sldMasterIdLst>/);
  let genPres = fs.readFileSync(path.join(genDir, 'ppt', 'presentation.xml'), 'utf8');
  if (masterIdList) {
    let mapped = masterIdList[0];
    for (const [oldId, newId] of Object.entries(idMap)) {
      mapped = mapped.replace(new RegExp(`r:id="${oldId}"`, 'g'), `r:id="${newId}"`);
    }
    if (genPres.includes('<p:sldMasterIdLst>')) {
      genPres = genPres.replace(/<p:sldMasterIdLst>[\s\S]*?<\/p:sldMasterIdLst>/, mapped);
    } else {
      genPres = genPres.replace('<p:sldIdLst>', `${mapped}<p:sldIdLst>`);
    }
  }
  fs.writeFileSync(path.join(genDir, 'ppt', 'presentation.xml'), genPres);

  for (let n = 1; n <= slideCount; n++) {
    const slidePath = path.join(genDir, 'ppt', 'slides', `slide${n}.xml`);
    let xml = fs.readFileSync(slidePath, 'utf8');
    xml = xml.replace(/<p:bg>[\s\S]*?<\/p:bg>/g, '');

    const relsPath = path.join(genDir, 'ppt', 'slides', '_rels', `slide${n}.xml.rels`);
    let rels = fs.readFileSync(relsPath, 'utf8');
    const layoutFile = LAYOUT_FOR_SLIDE(n);
    if (rels.includes('slideLayout')) {
      rels = rels.replace(/Target="\.\.\/slideLayouts\/[^"]+"/, `Target="../slideLayouts/${layoutFile}"`);
    }
    fs.writeFileSync(slidePath, xml);
    fs.writeFileSync(relsPath, rels);
  }
}


function escapeXml(t) {
  return String(t)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 在 slide XML 内按形状 name 替换文本（不跨 p:sp 边界） */
function setShapeText(slideXml, shapeName, newText) {
  const chunks = slideXml.split(/(?=<p:sp>)/);
  let hit = false;
  const out = chunks.map((chunk) => {
    if (!chunk.startsWith('<p:sp>')) return chunk;
    const nv = chunk.match(/<p:cNvPr[^>]*name="([^"]+)"/);
    if (!nv || nv[1] !== shapeName) return chunk;
    if (!/<p:txBody>/.test(chunk)) return chunk;
    hit = true;
    const rPr = chunk.match(/<a:rPr[^>]*\/>|<a:rPr[^>]*>[\s\S]*?<\/a:rPr>/);
    const bodyPr = chunk.match(/<a:bodyPr[^/]*\/>|<a:bodyPr[^>]*>[\s\S]*?<\/a:bodyPr>/);
    const bodyPrTag = bodyPr ? bodyPr[0] : '<a:bodyPr wrap="square" rtlCol="0"><a:spAutoFit/></a:bodyPr>';
    const rPrTag = rPr ? rPr[0] : '<a:rPr lang="zh-CN" dirty="0"/>';
    const newTx = `<p:txBody>${bodyPrTag}<a:lstStyle/><a:p>${rPrTag}<a:t>${escapeXml(newText)}</a:t></a:p></p:txBody>`;
    return chunk.replace(/<p:txBody>[\s\S]*?<\/p:txBody>/, newTx);
  });
  return hit ? out.join('') : slideXml;
}

function applyTextFixesXml(genDir, slideCount) {
  for (let n = 1; n <= slideCount; n++) {
    const fixes = TEXT_BY_BOX[n];
    if (!fixes) continue;
    const slidePath = path.join(genDir, 'ppt', 'slides', `slide${n}.xml`);
    let xml = fs.readFileSync(slidePath, 'utf8');
    for (const [box, text] of Object.entries(fixes)) {
      xml = setShapeText(xml, box, text);
    }
    fs.writeFileSync(slidePath, xml);
  }
}

function buildAnalysisDoc() {
  return `# 答辩 PPT 文字优化说明

> 文件：\`${inputFile}\`  
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

同时合并模板 slideMasters / slideLayouts / theme，并移除原稿 \`noFill\` 背景覆盖。

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
`;
}

async function main() {
  console.log('输入:', inputFile);
  console.log('模板:', templateFile);
  const inputPath = path.join(root, inputFile);
  const workDir = path.join(outputDir, 'ppt-bg-text-work');
  const tplDir = path.join(workDir, 'tpl');
  const genDir = path.join(workDir, 'gen');

  console.log('\n[1/3] 解压并套用模板背景…');
  fs.rmSync(workDir, { recursive: true, force: true });
  unzip(path.join(root, templateFile), tplDir);
  const extractBackup = path.join(outputDir, 'extract-tmp', 'unzipped');
  if (fs.existsSync(path.join(extractBackup, 'ppt', 'presentation.xml'))) {
    console.log('  使用 extract-tmp 缓存恢复原始 19 页稿…');
    copyDir(extractBackup, genDir);
  } else {
    unzip(inputPath, genDir);
  }

  const slideCount = fs.readdirSync(path.join(genDir, 'ppt', 'slides')).filter((f) => /^slide\d+\.xml$/.test(f)).length;
  applyTemplateTheme(tplDir, genDir, slideCount);

  console.log('[2/3] 修正文字（XML 原位替换）…');
  applyTextFixesXml(genDir, slideCount);

  const finalPath = path.join(root, inputFile);
  console.log('[3/3] 打包输出…');
  await zipOoxml(genDir, finalPath);

  fs.writeFileSync(path.join(root, 'docs', '答辩PPT文字优化说明.md'), buildAnalysisDoc(), 'utf8');

  fs.rmSync(workDir, { recursive: true, force: true });

  console.log('\n完成:', finalPath);
  console.log('分析: docs/答辩PPT文字优化说明.md');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
