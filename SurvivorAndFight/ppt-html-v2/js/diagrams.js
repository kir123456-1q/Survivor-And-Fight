/** 纯 HTML / SVG 图表 — 对齐网格、无空白节点（纯色填充，避免多页重复 gradient id） */

let _svgUid = 0;
function svgUid() { return `d${++_svgUid}`; }

function svgDefs(uid) {
  return `<defs>
    <marker id="arrowOrange-${uid}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
      <path d="M0,0 L8,4 L0,8 Z" fill="#e87722"/>
    </marker>
    <marker id="arrowNavy-${uid}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
      <path d="M0,0 L8,4 L0,8 Z" fill="#1a4a8a"/>
    </marker>
  </defs>`;
}

const C = { navy: '#1a4a8a', navyD: '#0d2b5e', orange: '#e87722', white: '#ffffff', muted: '#5a6b7d', text: '#1a2332' };

/** 水平流程：等宽节点 + 居中对齐箭头 */
function hFlow(nodes, opts = {}) {
  const uid = svgUid();
  const { y = 28, w = 172, h = 108, gap = 22, vbW = 980, vbH = 164 } = opts;
  const totalW = nodes.length * w + (nodes.length - 1) * gap;
  let x = Math.max(16, (vbW - totalW) / 2);
  const cy = y + h / 2;
  let inner = '';
  nodes.forEach((n, i) => {
    const accent = n.accent;
    const fill = accent ? C.orange : C.white;
    const stroke = accent ? C.orange : C.navy;
    const titleFill = accent ? C.white : C.navyD;
    const subFill = accent ? '#fff8f0' : C.muted;
    inner += `<g class="pop-node">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <text x="${x + w / 2}" y="${y + 32}" text-anchor="middle" font-size="14" font-weight="700" fill="${titleFill}">${n.t}</text>`;
    (n.lines || []).forEach((line, li) => {
      inner += `<text x="${x + w / 2}" y="${y + 50 + li * 16}" text-anchor="middle" font-size="11" fill="${subFill}">${line}</text>`;
    });
    inner += `</g>`;
    if (i < nodes.length - 1) {
      const x1 = x + w;
      const x2 = x + w + gap;
      inner += `<line x1="${x1 + 4}" y1="${cy}" x2="${x2 - 8}" y2="${cy}" stroke="${C.orange}" stroke-width="2.5" marker-end="url(#arrowOrange-${uid})"/>`;
    }
    x += w + gap;
  });
  return `<svg viewBox="0 0 ${vbW} ${vbH}" preserveAspectRatio="xMidYMid meet" class="diagram-html">${svgDefs(uid)}${inner}</svg>`;
}

/** 垂直流程（池化/Worker 列） */
function vFlowCol(items, x, title, accentIdx, uid) {
  const boxH = 38;
  const gap = 14;
  let y = 52;
  let inner = `<text x="${x + 90}" y="28" text-anchor="middle" font-size="13" font-weight="700" fill="${C.navyD}">${title}</text>`;
  items.forEach((t, i) => {
    const accent = i === accentIdx;
    const navy = t.navy;
    const fill = navy ? C.navyD : accent ? C.orange : C.white;
    const stroke = navy ? C.navyD : accent ? C.orange : C.navy;
    const tf = navy || accent ? C.white : C.text;
    inner += `<g class="pop-node"><rect x="${x}" y="${y}" width="180" height="${boxH}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <text x="${x + 90}" y="${y + 24}" text-anchor="middle" font-size="11" fill="${tf}">${t.t}</text></g>`;
    if (i < items.length - 1) {
      inner += `<line x1="${x + 90}" y1="${y + boxH}" x2="${x + 90}" y2="${y + boxH + gap - 4}" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrowNavy-${uid})"/>`;
    }
    y += boxH + gap;
  });
  return inner;
}

const Diagrams = {
  oopVsEcs() {
    const oop = ['继承子类扩展', '模块耦合高', '同屏难维护'];
    const ecs = ['增组件组合', '增 System 逻辑', '数据驱动扩展'];
    const col = (title, items, kind) => `
      <div class="compare-column ${kind}">
        <div class="compare-col-title">${title}</div>
        ${items.map((t, i) => `
          <div class="compare-step">${t}</div>
          ${i < items.length - 1 ? '<div class="compare-step-arrow">↓</div>' : ''}`).join('')}
      </div>`;
    return `<div class="diagram-panel compare-panel-v3">
      <div class="compare-row">
        ${col('传统 OOP', oop, 'oop')}
        <div class="compare-vs-badge">VS</div>
        ${col('轻量 ECS', ecs, 'ecs')}
      </div>
      <div class="compare-bottom-bar">同屏数百实体 → <strong>组合优于继承</strong> → 课设选用 Map-ECS</div>
    </div>`;
  },

  literature() {
    const cards = [
      { tag: '01·引擎', title: 'Gregory 分层', desc: '表现/UI/逻辑/服务/基础设施五层解耦', extra: 'Ullmann：子系统耦合导致架构退化', accent: false },
      { tag: '02·ECS', title: '组合优于继承', desc: 'EcsWorld + ComponentStore 轻量 Map-ECS', extra: '课设不引入完整 Archetype 引擎', accent: true },
      { tag: '03·怪物', title: '追逐 + Boids 排斥', desc: 'MonsterChaseSystem 追玩家 + 邻域排斥', extra: '非完整社会力模型，够用即可', accent: true },
      { tag: '04·性能', title: 'Worker 重算分离', desc: '追逐/分离/摆动卸 Worker 线程', extra: '碰撞检测与 Laya 渲染留主线程', accent: false },
    ];
    return `<div class="diagram-panel lit-panel">
      <div class="lit-panel-hub">文献支撑 → 本课题四条技术选型</div>
      <div class="lit-panel-grid">
        ${cards.map((c) => `
          <div class="lit-card ${c.accent ? 'accent' : ''}">
            <div class="lit-tag">${c.tag}</div>
            <div class="lit-title">${c.title}</div>
            <div class="lit-desc">${c.desc}</div>
            <div class="lit-extra">${c.extra}</div>
          </div>`).join('')}
      </div>
      <div class="lit-panel-foot">结论：模块化架构 + 重算与画面分离 + 可复现实验验证</div>
    </div>`;
  },

  mainLoop() {
    return hFlow([
      { t: 'LayaAir', lines: ['frameLoop'], accent: true },
      { t: 'EcsWorld', lines: ['update(dt)'] },
      { t: 'Scheduler', lines: ['System 组序'] },
      { t: '各 System', lines: ['读写组件'] },
      { t: 'ViewSync', lines: ['HUD 同步'] },
      { t: 'Laya', lines: ['引擎渲染'], accent: true },
    ], { w: 132, h: 80, gap: 18, vbH: 152 });
  },

  usecase() {
    const uid = svgUid();
    return `<svg viewBox="0 0 900 240" class="diagram-html">${svgDefs(uid)}
      <g class="pop-node"><circle cx="80" cy="120" r="42" fill="${C.navyD}" stroke="${C.navyD}" stroke-width="2"/>
        <text x="80" y="126" text-anchor="middle" fill="#fff" font-size="14" font-weight="600">玩家</text></g>
      ${[
        { x: 180, y: 40, t: '主菜单' }, { x: 380, y: 40, t: '跑图选关' }, { x: 580, y: 40, t: '局内战斗', hot: true },
        { x: 180, y: 150, t: '升级奖励' }, { x: 380, y: 150, t: 'Tab装配' }, { x: 580, y: 150, t: '死亡重启' },
      ].map((n) => `<g class="pop-node">
        <rect x="${n.x}" y="${n.y}" width="120" height="48" rx="8" fill="${n.hot ? C.orange : C.white}" stroke="${n.hot ? C.orange : C.navy}" stroke-width="2"/>
        <text x="${n.x + 60}" y="${n.y + 30}" text-anchor="middle" font-size="12" font-weight="600" fill="${n.hot ? '#fff' : C.navyD}">${n.t}</text></g>`).join('')}
      <line x1="122" y1="120" x2="175" y2="64" stroke="${C.orange}" stroke-width="2" marker-end="url(#arrowOrange-${uid})"/>
      <line x1="122" y1="120" x2="175" y2="174" stroke="${C.orange}" stroke-width="2" marker-end="url(#arrowOrange-${uid})"/>
      <line x1="300" y1="64" x2="375" y2="64" stroke="${C.orange}" stroke-width="2" marker-end="url(#arrowOrange-${uid})"/>
      <line x1="500" y1="64" x2="575" y2="64" stroke="${C.orange}" stroke-width="2" marker-end="url(#arrowOrange-${uid})"/>
      <line x1="640" y1="88" x2="640" y2="145" stroke="${C.navy}" stroke-width="2"/>
      <line x1="580" y1="174" x2="122" y2="150" stroke="${C.navy}" stroke-width="2" stroke-dasharray="6 4" marker-end="url(#arrowNavy-${uid})"/>
      <text x="350" y="225" text-anchor="middle" font-size="11" fill="#64748b">闭环：死亡重启 → 主菜单</text>
    </svg>`;
  },

  fiveLayers() {
    return hFlow([
      { t: '表现层', lines: ['Laya 预制体/UI2', '血条·相机跟随'] },
      { t: 'UI 控制层', lines: ['UIStackManager', 'Panel Controller'] },
      { t: '游戏逻辑层', lines: ['SimpleEcsDemo', 'ECS Systems'], accent: true },
      { t: '领域服务层', lines: ['ConfigBootstrap', 'RunMapGenerator'] },
      { t: '基础设施层', lines: ['EcsWorld·defines', '对象池·Worker'] },
    ]);
  },

  ecsBind() {
    return `<svg viewBox="0 0 900 340" class="diagram-html">${svgDefs(svgUid())}
      <rect x="20" y="10" width="860" height="320" rx="12" fill="rgba(13,43,94,.03)" stroke="#d4dce8"/>
      <text x="450" y="36" text-anchor="middle" font-size="15" font-weight="700" fill="${C.navyD}">EcsWorld · 实体 + 组件 + 系统</text>
      ${[
        { x: 80, t: 'EntityManager', s: '创建/销毁实体' },
        { x: 320, t: 'ComponentStore', s: 'Map 存组件', hot: true },
        { x: 560, t: 'SystemScheduler', s: '分组 tick 调度' },
      ].map((c) => `<g class="pop-node">
        <rect x="${c.x}" y="52" width="160" height="56" rx="8" fill="${c.hot ? C.orange : C.white}" stroke="${c.hot ? C.orange : C.navy}" stroke-width="2"/>
        <text x="${c.x + 80}" y="76" text-anchor="middle" font-size="12" font-weight="700" fill="${c.hot ? '#fff' : C.navyD}">${c.t}</text>
        <text x="${c.x + 80}" y="94" text-anchor="middle" font-size="10" fill="${c.hot ? '#fff8f0' : C.muted}">${c.s}</text></g>`).join('')}
      <text x="160" y="138" font-size="12" font-weight="700" fill="${C.navyD}">组件（纯数据）</text>
      ${['Position', 'Velocity', 'Attribute', 'Skill', 'ViewComponent', 'GameSession'].map((t, i) => {
        const col = i % 3, row = Math.floor(i / 3);
        const bx = 48 + col * 118, by = 148 + row * 44;
        return `<g class="pop-node"><rect x="${bx}" y="${by}" width="108" height="36" rx="6" fill="${C.white}" stroke="${C.navy}" stroke-width="1.5"/>
          <text x="${bx + 54}" y="${by + 22}" text-anchor="middle" font-size="10" fill="${C.text}">${t}</text></g>`;
      }).join('')}
      <text x="620" y="138" font-size="12" font-weight="700" fill="${C.navyD}">系统（每帧逻辑）</text>
      ${['MovementSystem', 'BulletSystem', 'MonsterChaseSystem', 'PlayerAutoCastSystem'].map((t, i) => {
        const by = 148 + i * 40;
        return `<g class="pop-node"><rect x="520" y="${by}" width="200" height="34" rx="6" fill="${C.navyD}" stroke="${C.navyD}" stroke-width="1.5"/>
          <text x="620" y="${by + 22}" text-anchor="middle" font-size="10" fill="#fff">${t}</text></g>`;
      }).join('')}
      <line x1="240" y1="108" x2="240" y2="145" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4 3"/>
      <line x1="400" y1="108" x2="200" y2="145" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="640" y1="108" x2="620" y2="145" stroke="${C.orange}" stroke-width="1.5"/>
    </svg>`;
  },

  skillChain() {
    const uid = svgUid();
    return `<svg viewBox="0 0 880 320" class="diagram-html">${svgDefs(uid)}
      <rect x="20" y="8" width="840" height="300" rx="10" fill="rgba(13,43,94,.02)" stroke="#d4dce8"/>
      ${[
        { x: 340, y: 24, w: 200, h: 32, t: 'PlayerAutoCast 检查冷却', hot: true },
        { x: 310, y: 68, w: 260, h: 28, t: 'SkillLoadoutState → effectIds', hot: false },
      ].map((b) => `<g class="pop-node"><rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="6" fill="${b.hot ? C.navyD : C.white}" stroke="${b.hot ? C.navyD : C.navy}" stroke-width="2"/>
        <text x="${b.x + b.w / 2}" y="${b.y + b.h / 2 + 4}" text-anchor="middle" font-size="11" fill="${b.hot ? '#fff' : C.text}">${b.t}</text></g>`).join('')}
      <line x1="440" y1="56" x2="440" y2="66" stroke="${C.orange}" stroke-width="2" marker-end="url(#arrowOrange-${uid})"/>
      <line x1="440" y1="96" x2="440" y2="108" stroke="${C.orange}" stroke-width="2" marker-end="url(#arrowOrange-${uid})"/>
      <polygon points="440,108 500,140 440,172 380,140" fill="${C.orange}" stroke="${C.orange}" stroke-width="2"/>
      <text x="440" y="144" text-anchor="middle" font-size="11" fill="#fff" font-weight="600">遍历 effect</text>
      ${[
        { x: 48, t: 'modifier', s: 'split/chain/pierce' },
        { x: 280, t: 'bullet', s: 'BulletSpawnSpec' },
        { x: 512, t: 'direct_damage', s: 'FormulaParser' },
      ].map((b) => {
        const cx = b.x + 75, cy = 200;
        return `<line x1="440" y1="172" x2="${cx}" y2="${cy - 28}" stroke="${C.orange}" stroke-width="2" marker-end="url(#arrowOrange-${uid})"/>
          <g class="pop-node"><rect x="${b.x}" y="${cy - 28}" width="150" height="56" rx="8" fill="${C.white}" stroke="${C.navy}" stroke-width="2"/>
            <text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="12" font-weight="700" fill="${C.navyD}">${b.t}</text>
            <text x="${cx}" y="${cy + 12}" text-anchor="middle" font-size="10" fill="${C.muted}">${b.s}</text></g>`;
      }).join('')}
      <g class="pop-node"><rect x="700" y="172" width="150" height="40" rx="8" fill="${C.navyD}" stroke="${C.navyD}" stroke-width="2"/>
        <text x="775" y="197" text-anchor="middle" font-size="11" fill="#fff">碰撞检测 / 扣 hp</text></g>
      <line x1="662" y1="200" x2="698" y2="192" stroke="${C.orange}" stroke-width="2" marker-end="url(#arrowOrange-${uid})"/>
    </svg>`;
  },

  tabSequence() {
    const steps = [
      { actor: '玩家', action: '按 Tab 打开 SkillSelectPanel' },
      { actor: 'Session', action: 'GameSession.paused = true' },
      { actor: 'ECS', action: '战斗 System update 入口早退' },
      { actor: '拖拽', action: 'SkillDragService 更新栏位状态' },
      { actor: 'Sync', action: 'SkillLoadoutSyncSystem 写回 Skill' },
      { actor: '恢复', action: '关闭面板 → paused=false → 继续 tick' },
    ];
    return `<div class="seq-timeline dense">${steps.map((s, i) =>
      `<div class="seq-row"><span class="seq-num">${i + 1}</span><div class="seq-actor">${s.actor}</div><div class="seq-action">${s.action}</div></div>`
    ).join('')}</div>`;
  },

  perfOptimize() {
    const uid = svgUid();
    return `<svg viewBox="0 0 900 300" class="diagram-html">${svgDefs(uid)}
      <rect x="16" y="12" width="400" height="276" rx="10" fill="rgba(13,43,94,.04)" stroke="#d4dce8"/>
      <rect x="484" y="12" width="400" height="276" rx="10" fill="rgba(232,119,34,.05)" stroke="#d4dce8"/>
      ${vFlowCol([
        { t: 'BulletSystem.spawn' },
        { t: '池中有空闲节点?' },
        { t: 'pop 重置复用' },
        { t: '飞行 / 碰撞' },
        { t: 'put 回桶' },
      ], 56, '对象池 get/put', 2, uid)}
      ${vFlowCol([
        { t: '打包怪物快照' },
        { t: 'Worker 算追逐/排斥' },
        { t: '写回 Velocity' },
        { t: '碰撞始终主线程', navy: true },
      ], 524, 'Web Worker 卸载', 1, uid)}
      <text x="450" y="292" text-anchor="middle" font-size="11" fill="#64748b">Worker 失败 → computeSync · 图集合批降 DrawCall</text>
    </svg>`;
  },

  combatSeq() {
    const steps = [
      { actor: 'EcsWorld', action: 'update(dt) 调度 input→logic→render 组' },
      { actor: 'AutoCast', action: '冷却就绪 → pendingCast 入队' },
      { actor: 'SkillSystem', action: '效果链执行 → spawnBullet' },
      { actor: 'BulletSystem', action: '移动 + 圆碰撞 → 写 Attribute.hp' },
      { actor: 'Recycle', action: '刷怪 / MonsterPool.put 回收' },
      { actor: 'Experience', action: '击杀经验 → 升级奖励面板' },
      { actor: 'MainHud', action: 'BloodBarSync 同步血条 HUD' },
    ];
    return `<div class="seq-timeline dense">${steps.map((s, i) =>
      `<div class="seq-row"><span class="seq-num">${i + 1}</span><div class="seq-actor">${s.actor}</div><div class="seq-action">${s.action}</div></div>`
    ).join('')}</div>`;
  },

  metaLoop() {
    const uid = svgUid();
    return `<svg viewBox="0 0 860 200" class="diagram-html">${svgDefs(uid)}
      ${['主菜单', 'DAG跑图', '局内战斗', '升级奖励', 'Tab装配', '死亡/胜利'].map((t, i) => {
        const x = 24 + i * 132;
        const hot = i === 2;
        return `<g class="pop-node">
          <rect x="${x}" y="60" width="108" height="52" rx="8" fill="${hot ? C.orange : C.white}" stroke="${hot ? C.orange : C.navy}" stroke-width="2"/>
          <text x="${x + 54}" y="92" text-anchor="middle" font-size="12" font-weight="600" fill="${hot ? '#fff' : C.navyD}">${t}</text></g>
          ${i < 5 ? `<line x1="${x + 108}" y1="86" x2="${x + 124}" y2="86" stroke="${C.orange}" stroke-width="2.5" marker-end="url(#arrowOrange-${uid})"/>` : ''}`;
      }).join('')}
      <path d="M 780 112 Q 430 175 78 112" fill="none" stroke="${C.navy}" stroke-width="2" stroke-dasharray="8 5" marker-end="url(#arrowNavy-${uid})"/>
      <text x="430" y="168" text-anchor="middle" font-size="12" fill="#64748b">死亡/胜利 → 回主菜单 · Must 需求全覆盖</text>
    </svg>`;
  },

  formulaTree() {
    const uid = svgUid();
    return `<svg viewBox="0 0 880 320" class="diagram-html">${svgDefs(uid)}
      <rect x="16" y="8" width="848" height="300" rx="10" fill="rgba(13,43,94,.03)" stroke="#d4dce8"/>
      <text x="440" y="34" text-anchor="middle" font-size="14" font-weight="700" fill="${C.navyD}">direct_damage：paramsFormula 白名单解析与安全求值</text>
      ${[
        { x: 40, t: '①白名单', s: 'ALLOWED_PATTERN' },
        { x: 195, t: '②词法', s: 'tokenize' },
        { x: 350, t: '③语法', s: 'parseFormula→AST' },
        { x: 505, t: '④求值', s: 'evaluateFormula', hot: true },
        { x: 680, t: 'context', s: 'getFinalValue(atk)', navy: true },
      ].map((b, i) => {
        const fill = b.navy ? C.navyD : b.hot ? C.orange : C.white;
        const stroke = b.navy ? C.navyD : b.hot ? C.orange : C.navy;
        const tf = b.navy || b.hot ? '#fff' : C.navyD;
        const sub = b.navy || b.hot ? '#fff8f0' : C.muted;
        let s = `<g class="pop-node"><rect x="${b.x}" y="52" width="130" height="54" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
          <text x="${b.x + 65}" y="76" text-anchor="middle" font-size="12" font-weight="700" fill="${tf}">${b.t}</text>
          <text x="${b.x + 65}" y="94" text-anchor="middle" font-size="10" fill="${sub}">${b.s}</text></g>`;
        if (i < 4) s += `<line x1="${b.x + 130}" y1="79" x2="${b.x + 165}" y2="79" stroke="${C.orange}" stroke-width="2" marker-end="url(#arrowOrange-${uid})"/>`;
        if (i === 3) s += `<line x1="635" y1="79" x2="678" y2="79" stroke="${C.orange}" stroke-width="2" marker-end="url(#arrowOrange-${uid})"/>`;
        return s;
      }).join('')}
      <text x="200" y="140" font-size="12" font-weight="700" fill="${C.navyD}">AST 示例：(atk+5)*2，atk=20 → 结果 50</text>
      <circle cx="400" cy="200" r="26" fill="${C.orange}" stroke="${C.orange}"/><text x="400" y="205" text-anchor="middle" fill="#fff" font-weight="700">*</text>
      <circle cx="350" cy="240" r="22" fill="#fff" stroke="#1a4a8a"/><text x="350" y="245" text-anchor="middle" fill="#0d2b5e">+</text>
      <rect x="450" y="228" width="32" height="26" rx="4" fill="#fff" stroke="#1a4a8a"/><text x="466" y="245" text-anchor="middle" font-size="11">2</text>
      <line x1="376" y1="200" x2="374" y2="218" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="426" y1="200" x2="458" y2="228" stroke="#94a3b8" stroke-width="1.5"/>
      <text x="440" y="290" text-anchor="middle" font-size="11" fill="#64748b">modifier → context → 公式树 → 扣 hp · 禁止 eval</text>
    </svg>`;
  },

  testPyramid() {
    return `<div class="diagram-panel test-pyramid">
      <div class="tp-level l3"><strong>性能层</strong><span>Level3 五波 · P95 消融 · 图集对比</span></div>
      <div class="tp-level l2"><strong>功能层</strong><span>T-F-01～10：启动/Tab/跑图/重启/装配</span></div>
      <div class="tp-level l1"><strong>单元层</strong><span>ecsCorePhase1 · formulaParser · attributeModifier</span></div>
      <div class="tp-meta">环境 1920×1080 · Laya IDE Chromium · 2026-05-18 实测</div>
    </div>`;
  },

  reliabilityCards() {
    const items = [
      { tag: '配表', title: 'ConfigBootstrap 双通道', desc: 'isGameConfigReady 拦截 + DEFAULT_* 回退', accent: false },
      { tag: 'Worker', title: 'computeSync 降级', desc: 'workerUsable=false 时主线程重算追逐', accent: true },
      { tag: '跑图', title: 'DAG 保底图', desc: 'validateActReachBoss 失败 → generateFallback', accent: false },
      { tag: '扩展', title: '组件 + System + 配表', desc: '新技能加 EffectExecutor 分支与 JSON 行', accent: true },
    ];
    return `<div class="diagram-panel rel-panel">
      ${items.map((c) => `<div class="rel-card ${c.accent ? 'accent' : ''}">
        <span class="rel-tag">${c.tag}</span>
        <strong>${c.title}</strong>
        <p>${c.desc}</p>
      </div>`).join('')}
    </div>`;
  },

  fpsChart() {
    const data = [
      { label: '第1波·10怪', val: '58.62', h: 88 },
      { label: '第2波·100怪', val: '46.84', h: 70 },
      { label: '第3波·1000怪', val: '15.14', h: 22 },
      { label: '第4波·关池', val: '26.16', h: 38 },
      { label: '第5波·开池', val: '25.98', h: 37, accent: true },
    ];
    return `<div class="chart-wrap">
      <div class="chart-title">表7-5 Level3 五波平均 FPS（池+Worker+图集）</div>
      <div class="chart-bars tall">${data.map((d, i) => `
        <div class="chart-bar-wrap">
          <div class="chart-bar ${d.accent ? 'accent' : ''}" style="height:${d.h}%">
            <span class="val">${d.val}</span>
          </div>
          <div class="chart-label">${d.label}</div>
        </div>`).join('')}</div>
      <div class="chart-metrics">
        <span class="metric-chip">整场均值 <b>34.48</b></span>
        <span class="metric-chip accent">图集千怪 <b>13.32→15.10</b> (+13.4%)</span>
      </div>
    </div>`;
  },

  p95Chart() {
    return `<div class="chart-wrap">
      <div class="chart-title">表7-6 对象池消融 P95（1000怪/10s · 第4–5波同窗）</div>
      <div class="chart-bars tall dual">
        <div class="chart-bar-wrap">
          <div class="chart-bar" style="height:85%"><span class="val">76.50 ms</span></div>
          <div class="chart-label">无池无Worker<br/>FPS 26.16</div>
        </div>
        <div class="chart-bar-wrap">
          <div class="chart-bar accent" style="height:54%"><span class="val">48.60 ms</span></div>
          <div class="chart-label">仅对象池<br/>FPS 25.98</div>
        </div>
      </div>
      <div class="chart-highlight">P95 降低约 <b>36.5%</b> · 均值 FPS 几乎不变 · 主要消除 GC 尖峰</div>
    </div>`;
  },
};

if (typeof module !== 'undefined') module.exports = Diagrams;
