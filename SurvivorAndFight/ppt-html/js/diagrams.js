/** 纯 HTML / SVG 图表 — 不使用 Mermaid */

function svgDefs() {
  return `<defs>
    <linearGradient id="gradNavy" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#1a4a8a"/>
      <stop offset="100%" style="stop-color:#0d2b5e"/>
    </linearGradient>
    <linearGradient id="gradOrange" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#f5a962"/>
      <stop offset="100%" style="stop-color:#e87722"/>
    </linearGradient>
    <marker id="arrowOrange" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
      <path d="M0,0 L8,4 L0,8 Z" fill="#e87722"/>
    </marker>
    <marker id="arrowNavy" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
      <path d="M0,0 L8,4 L0,8 Z" fill="#1a4a8a"/>
    </marker>
  </defs>`;
}

function layerBox(x, y, w, h, title, lines, accent, delay) {
  const cls = accent ? 'd-node-navy' : 'd-node';
  const tClass = accent ? 'd-text-white' : 'd-text-title';
  const bClass = accent ? 'd-text-white' : 'd-text-body';
  const lineEls = lines.map((l, i) =>
    `<text class="${bClass}" x="${x + w / 2}" y="${y + 38 + i * 14}" text-anchor="middle" ${accent ? 'fill="rgba(255,255,255,.85)"' : ''} font-size="10">${l}</text>`
  ).join('');
  return `
    <g class="pop-node" style="animation-delay:${delay}s">
      <rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/>
      <text class="${tClass}" x="${x + w / 2}" y="${y + 22}" text-anchor="middle" font-size="13" font-weight="700">${title}</text>
      ${lineEls}
    </g>`;
}

const Diagrams = {
  oopVsEcs() {
    return `<div class="diagram-panel compare-panel">
      <div class="compare-col oop">
        <div class="compare-col-head">传统 OOP</div>
        <div class="compare-step">继承子类扩展</div>
        <div class="compare-arrow-down">↓</div>
        <div class="compare-step">模块耦合高</div>
        <div class="compare-arrow-down">↓</div>
        <div class="compare-step">同屏难维护</div>
      </div>
      <div class="compare-vs">VS</div>
      <div class="compare-col ecs">
        <div class="compare-col-head">轻量 ECS</div>
        <div class="compare-step">增组件组合</div>
        <div class="compare-arrow-down">↓</div>
        <div class="compare-step">增 System 逻辑</div>
        <div class="compare-arrow-down">↓</div>
        <div class="compare-step">数据驱动扩展</div>
      </div>
      <div class="compare-link-row" style="grid-column:1/-1">
        <div class="link-line"></div>
        <span class="link-label">同屏数百实体 → 组合优于继承</span>
        <div class="link-line"></div>
      </div>
    </div>`;
  },

  literature() {
    return `<div class="diagram-panel lit-grid">
      <div class="lit-hub">文献支撑 → 本课题技术选型</div>
      <div class="lit-arrows">↓ &nbsp; ↓ &nbsp; ↓ &nbsp; ↓</div>
      <div class="lit-card">
        <div class="lit-tag">01 · 引擎架构</div>
        <div class="lit-title">Gregory 分层思想</div>
        <div class="lit-desc">表现 / UI / 逻辑 / 服务 / 基础设施五层划分</div>
      </div>
      <div class="lit-card accent">
        <div class="lit-tag">02 · ECS</div>
        <div class="lit-title">组合优于继承</div>
        <div class="lit-desc">轻量 Map-ECS：EcsWorld + ComponentStore</div>
      </div>
      <div class="lit-card accent">
        <div class="lit-tag">03 · 怪物运动</div>
        <div class="lit-title">追逐 + Boids 排斥</div>
        <div class="lit-desc">MonsterChaseSystem；非完整社会力模型</div>
      </div>
      <div class="lit-card">
        <div class="lit-tag">04 · H5 性能</div>
        <div class="lit-title">Worker 重算分离</div>
        <div class="lit-desc">追逐/分离卸 Worker；碰撞与渲染留主线程</div>
      </div>
    </div>`;
  },

  mainLoop() {
    const nodes = [
      { t: 'LayaAir', s: 'frameLoop', accent: true },
      { t: 'EcsWorld', s: 'update', accent: false },
      { t: 'System', s: 'Scheduler', accent: false },
      { t: '各 System', s: '读写组件', accent: false },
      { t: 'ViewSync', s: '/ HUD', accent: false },
      { t: 'Laya', s: '渲染', accent: true },
    ];
    const w = 128, h = 56, gap = 20;
    let x = 24;
    let inner = '';
    nodes.forEach((n, i) => {
      inner += `<g class="pop-node" style="animation-delay:${0.08 + i * 0.07}s">
        <rect class="${n.accent ? 'd-node-accent' : 'd-node'}" x="${x}" y="50" width="${w}" height="${h}" rx="8"/>
        <text x="${x + w / 2}" y="78" text-anchor="middle" class="${n.accent ? 'd-text-white' : 'd-text-title'}" font-size="12">${n.t}</text>
        <text x="${x + w / 2}" y="94" text-anchor="middle" class="${n.accent ? 'd-text-white' : 'd-text-body'}" font-size="10" ${n.accent ? 'fill="rgba(255,255,255,.85)"' : ''}>${n.s}</text>
      </g>`;
      if (i < nodes.length - 1) {
        inner += `<path class="d-arrow draw-path" style="animation-delay:${0.12 + i * 0.07}s" d="M${x + w} 78 L${x + w + gap} 78"/>`;
      }
      x += w + gap;
    });
    return `<svg viewBox="0 0 920 130" preserveAspectRatio="xMidYMid meet" class="diagram-html">${svgDefs()}${inner}</svg>`;
  },

  usecase() {
    const acts = ['主菜单', '跑图选关', '局内战斗', '升级奖励', 'Tab装配', '死亡重启'];
    return `<svg viewBox="0 0 920 220" preserveAspectRatio="xMidYMid meet" class="diagram-html">${svgDefs()}
      <g class="pop-node" style="animation-delay:.05s"><circle class="d-node-navy" cx="70" cy="110" r="40"/><text x="70" y="115" text-anchor="middle" class="d-text-white" font-size="14">玩家</text></g>
      ${acts.map((t, i) => {
        const col = i % 3, row = Math.floor(i / 3);
        const x = 160 + col * 240;
        const y = 40 + row * 90;
        const accent = i === 2;
        return `<g class="pop-node" style="animation-delay:${0.1 + i * 0.06}s">
          <rect class="${accent ? 'd-node-accent' : 'd-node'}" x="${x}" y="${y}" width="110" height="52" rx="8"/>
          <text x="${x + 55}" y="${y + 32}" text-anchor="middle" class="${accent ? 'd-text-white' : 'd-text-title'}" font-size="12">${t}</text>
        </g>
        <path class="d-arrow draw-path" style="animation-delay:${0.14 + i * 0.06}s" d="M110 110 L${x} ${y + 26}"/>`;
      }).join('')}
      <path class="d-arrow-navy draw-path" style="animation-delay:.55s" d="M215 180 Q 70 200 70 150" fill="none"/>
      <text x="140" y="205" font-size="11" fill="#64748b">死亡重启 → 主菜单</text>
    </svg>`;
  },

  fiveLayers() {
    const layers = [
      { t: '表现层', l: ['Laya 预制体/UI2', '血条/相机跟随'] },
      { t: 'UI 控制层', l: ['UIStackManager', 'Panel Controller'] },
      { t: '游戏逻辑层', l: ['ECS Systems', '移动/技能/子弹'] },
      { t: '领域服务层', l: ['ConfigBootstrap', 'RunMapGenerator'] },
      { t: '基础设施层', l: ['EcsWorld/defines', '对象池/Worker'] },
    ];
    const w = 158, h = 76, gap = 16;
    let x = 12;
    let inner = '';
    layers.forEach((layer, i) => {
      inner += layerBox(x, 28, w, h, layer.t, layer.l, i === 2, 0.08 + i * 0.07);
      if (i < layers.length - 1) {
        inner += `<path class="d-arrow draw-path" style="animation-delay:${0.12 + i * 0.07}s" d="M${x + w} 66 L${x + w + gap} 66"/>`;
      }
      x += w + gap;
    });
    return `<svg viewBox="0 0 920 120" preserveAspectRatio="xMidYMid meet" class="diagram-html">${svgDefs()}${inner}</svg>`;
  },

  ecsBind() {
    const cores = [
      { t: 'EntityManager', d: '实体创建/销毁' },
      { t: 'ComponentStore', d: 'Map 存组件' },
      { t: 'SystemScheduler', d: '分组调度 tick' },
    ];
    return `<svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid meet" class="diagram-html">${svgDefs()}
      <text x="450" y="22" text-anchor="middle" class="d-text-title" font-size="15">EcsWorld 核心三件套</text>
      ${cores.map((c, i) => {
        const x = 120 + i * 240;
        return layerBox(x, 32, 160, 58, c.t, [c.d], i === 1, 0.1 + i * 0.08);
      }).join('')}
      <text x="200" y="118" class="d-text-title" font-size="13">组件（纯数据）</text>
      ${['Position', 'Velocity', 'Attribute', 'Skill', 'ViewComponent', 'GameSession'].map((t, i) => {
        const col = i % 3, row = Math.floor(i / 3);
        return `<g class="pop-node" style="animation-delay:${0.28 + i * 0.04}s"><rect class="d-node" x="${40 + col * 118}" y="${128 + row * 42}" width="108" height="34" rx="6"/><text x="${94 + col * 118}" y="${149 + row * 42}" text-anchor="middle" class="d-text-body" font-size="10">${t}</text></g>`;
      }).join('')}
      <text x="620" y="118" class="d-text-title" font-size="13">系统（每帧逻辑）</text>
      ${['MovementSystem', 'BulletSystem', 'MonsterChaseSystem', 'PlayerAutoCastSystem'].map((t, i) =>
        `<g class="pop-node" style="animation-delay:${0.42 + i * 0.05}s"><rect class="d-node-accent" x="520" y="${128 + i * 40}" width="180" height="34" rx="6"/><text x="610" y="${149 + i * 40}" text-anchor="middle" class="d-text-white" font-size="10">${t}</text></g>`
      ).join('')}
      <path class="d-arrow-navy draw-path" style="animation-delay:.5s" d="M280 90 L280 125"/>
      <path class="d-arrow draw-path" style="animation-delay:.52s" d="M600 90 L600 125"/>
    </svg>`;
  },

  skillChain() {
    return `<svg viewBox="0 0 880 300" preserveAspectRatio="xMidYMid meet" class="diagram-html">${svgDefs()}
      <g class="pop-node" style="animation-delay:.05s"><rect class="d-node-navy" x="310" y="6" width="260" height="34" rx="6"/><text x="440" y="28" text-anchor="middle" class="d-text-white" font-size="12">PlayerAutoCast 检查冷却</text></g>
      <path class="d-arrow draw-path" d="M440 40 L440 52"/>
      <g class="pop-node" style="animation-delay:.1s"><rect class="d-node" x="290" y="52" width="300" height="30" rx="6"/><text x="440" y="72" text-anchor="middle" class="d-text-body" font-size="11">SkillLoadoutState → effectIds</text></g>
      <path class="d-arrow draw-path" style="animation-delay:.14s" d="M440 82 L440 98"/>
      <g class="pop-node" style="animation-delay:.18s"><polygon class="d-node-accent" points="440,98 510,132 440,166 370,132"/><text x="440" y="136" text-anchor="middle" class="d-text-white" font-size="11">遍历 effect</text></g>
      ${[
        { x: 40, t: 'modifier', s: 'split/chain/pierce 累加' },
        { x: 280, t: 'bullet', s: '组装 BulletSpawnSpec' },
        { x: 520, t: 'direct_damage', s: 'FormulaParser 求值' },
      ].map((b, i) => `
        <path class="d-arrow draw-path" style="animation-delay:${0.22 + i * 0.06}s" d="M440 166 L${b.x + 75} 188"/>
        <g class="pop-node" style="animation-delay:${0.26 + i * 0.06}s">
          <rect class="d-node" x="${b.x}" y="188" width="150" height="54" rx="8"/>
          <text x="${b.x + 75}" y="212" text-anchor="middle" class="d-text-title" font-size="12">${b.t}</text>
          <text x="${b.x + 75}" y="230" text-anchor="middle" class="d-text-body" font-size="10">${b.s}</text>
        </g>`).join('')}
      <g class="pop-node" style="animation-delay:.45s"><rect class="d-node-navy" x="710" y="198" width="150" height="38" rx="8"/><text x="785" y="222" text-anchor="middle" class="d-text-white" font-size="11">碰撞 / 扣 hp</text></g>
      <path class="d-arrow draw-path" style="animation-delay:.4s" d="M670 220 L710 217"/>
    </svg>`;
  },

  tabSequence() {
    const steps = [
      { actor: '玩家', action: '按 Tab 打开 SkillSelectPanel' },
      { actor: 'Session', action: 'GameSession.paused = true' },
      { actor: 'ECS', action: '战斗 System update 入口早退' },
      { actor: '拖拽', action: 'SkillDragService 更新 SkillLoadoutState' },
      { actor: 'Sync', action: 'SkillLoadoutSyncSystem 写回 Skill 组件' },
      { actor: '恢复', action: '关闭面板 → paused = false → 继续 tick' },
    ];
    return `<div class="seq-timeline">${steps.map((s, i) =>
      `<div class="seq-row" style="animation-delay:${0.08 + i * 0.07}s"><div class="seq-actor">${s.actor}</div><div class="seq-action">${s.action}</div></div>`
    ).join('')}</div>`;
  },

  perfOptimize() {
    return `<svg viewBox="0 0 900 280" preserveAspectRatio="xMidYMid meet" class="diagram-html">${svgDefs()}
      <text x="210" y="22" text-anchor="middle" class="d-text-title" font-size="14">BulletPool / MonsterPool</text>
      <text x="660" y="22" text-anchor="middle" class="d-text-title" font-size="14">CombatDataBridge Worker</text>
      <rect x="16" y="34" width="390" height="230" rx="10" fill="rgba(13,43,94,.03)" stroke="#d4dce8"/>
      <rect x="494" y="34" width="390" height="230" rx="10" fill="rgba(232,119,34,.04)" stroke="#d4dce8"/>
      ${[
        { t: 'spawn 请求', y: 48 },
        { t: '池中有空闲?', y: 88 },
        { t: 'pop 重置复用', y: 128, accent: true },
        { t: '飞行中', y: 168 },
        { t: 'put 回桶', y: 208 },
      ].map((s, i) => `<g class="pop-node" style="animation-delay:${0.08 + i * 0.05}s"><rect class="${s.accent ? 'd-node-accent' : 'd-node'}" x="56" y="${s.y}" width="140" height="32" rx="6"/><text x="126" y="${s.y + 21}" text-anchor="middle" class="${s.accent ? 'd-text-white' : 'd-text-body'}" font-size="11">${s.t}</text></g>`).join('')}
      ${[
        { t: '打包怪物快照', y: 48 },
        { t: 'Worker 算追逐/排斥', y: 98, accent: true },
        { t: '写回 Velocity', y: 148 },
        { t: 'BulletSystem 碰撞（主线程）', y: 198, navy: true },
      ].map((s, i) => `<g class="pop-node" style="animation-delay:${0.15 + i * 0.06}s"><rect class="${s.navy ? 'd-node-navy' : s.accent ? 'd-node-accent' : 'd-node'}" x="534" y="${s.y}" width="200" height="36" rx="6"/><text x="634" y="${s.y + 23}" text-anchor="middle" class="${s.navy || s.accent ? 'd-text-white' : 'd-text-body'}" font-size="10">${s.t}</text></g>`).join('')}
      <path class="d-arrow draw-path" d="M196 104 L240 104 L240 128 L196 128" fill="none"/>
      <text x="252" y="120" font-size="10" fill="#e87722">是</text>
      <text x="450" y="270" text-anchor="middle" font-size="11" fill="#64748b">失败 → computeSync 主线程回退</text>
    </svg>`;
  },

  combatSeq() {
    const steps = [
      { actor: 'EcsWorld', action: 'update(dt) 按组调度 System' },
      { actor: 'AutoCast', action: '冷却就绪 → pendingCast' },
      { actor: 'SkillSystem', action: '效果链 → spawnBullet' },
      { actor: 'BulletSystem', action: '移动 + 碰撞 → 写 Attribute.hp' },
      { actor: 'Recycle', action: 'MonsterRecycleSystem 刷怪回收' },
      { actor: 'Experience', action: '击杀经验 → 升级奖励' },
      { actor: 'MainHud', action: 'BloodBarSync 同步 HUD' },
    ];
    return `<div class="seq-timeline">${steps.map((s, i) =>
      `<div class="seq-row" style="animation-delay:${0.06 + i * 0.06}s"><div class="seq-actor">${s.actor}</div><div class="seq-action">${s.action}</div></div>`
    ).join('')}</div>`;
  },

  metaLoop() {
    const nodes = ['主菜单', 'DAG跑图', '局内战斗', '升级奖励', 'Tab装配', '死亡/胜利'];
    let x = 20;
    let inner = '';
    nodes.forEach((t, i) => {
      inner += `<g class="pop-node" style="animation-delay:${0.08 + i * 0.06}s"><rect class="${i === 2 ? 'd-node-accent' : 'd-node'}" x="${x}" y="44" width="108" height="48" rx="8"/><text x="${x + 54}" y="73" text-anchor="middle" class="${i === 2 ? 'd-text-white' : 'd-text-title'}" font-size="11">${t}</text></g>`;
      if (i < nodes.length - 1) inner += `<path class="d-arrow draw-path" style="animation-delay:${0.1 + i * 0.06}s" d="M${x + 108} 68 L${x + 126} 68"/>`;
      x += 134;
    });
    inner += `<path class="d-arrow-navy draw-path" style="animation-delay:.5s" d="M780 92 Q 400 150 74 92" fill="none"/>`;
    inner += `<text x="420" y="138" text-anchor="middle" font-size="11" fill="#64748b">死亡/胜利 → 回主菜单</text>`;
    return `<svg viewBox="0 0 820 150" preserveAspectRatio="xMidYMid meet" class="diagram-html">${svgDefs()}${inner}</svg>`;
  },

  fpsChart() {
    const data = [
      { label: '10怪', val: 58.62, h: 88 },
      { label: '100怪', val: 45, h: 68 },
      { label: '1000怪', val: 15.14, h: 23 },
      { label: '1000关池', val: 26.16, h: 40 },
      { label: '1000开池', val: 25.98, h: 39, accent: true },
    ];
    return `<div class="chart-title">Level3 五波平均 FPS（1920×1080）</div>
      <div class="chart-bars">${data.map((d, i) => `
        <div class="chart-bar-wrap">
          <div class="chart-bar ${d.accent ? 'accent' : ''}" style="height:${d.h}%;animation-delay:${0.15 + i * 0.08}s">
            <span class="val">${d.val}</span>
          </div>
          <div class="chart-label">${d.label}</div>
        </div>`).join('')}</div>`;
  },

  p95Chart() {
    const data = [
      { label: '无池无Worker', val: '76.50', h: 85 },
      { label: '仅对象池', val: '48.60', h: 54, accent: true },
    ];
    return `<div class="chart-title">对象池消融 P95 帧时间（1000怪 / 10s）</div>
      <div class="chart-bars" style="max-width:520px;margin:0 auto">${data.map((d, i) => `
        <div class="chart-bar-wrap">
          <div class="chart-bar ${d.accent ? 'accent' : ''}" style="height:${d.h}%;animation-delay:${0.15 + i * 0.12}s">
            <span class="val">${d.val} ms</span>
          </div>
          <div class="chart-label">${d.label}</div>
        </div>`).join('')}</div>
      <p style="text-align:center;margin-top:16px;font-size:17px;color:#e87722;font-weight:600">P95 降低约 36.5% · 均值 FPS 相近（削 GC 尖峰）</p>`;
  },
};

if (typeof module !== 'undefined') module.exports = Diagrams;
