const SLIDE_COUNT = 21;
let current = 0;

const params = new URLSearchParams(location.search);
const exportMode = params.get('export') === '1';
const exportSlide = params.has('slide') ? parseInt(params.get('slide'), 10) - 1 : -1;

function getSlides() {
  return document.querySelectorAll('.slide');
}

function showSlide(index) {
  const slides = getSlides();
  if (index < 0 || index >= slides.length) return;
  slides.forEach((s, i) => {
    const on = i === index;
    s.classList.toggle('active', on);
    if (on) {
      s.querySelectorAll('.pop-node, .seq-row, .chart-bar').forEach((el) => {
        el.style.animation = 'none';
        void el.offsetHeight;
        el.style.animation = '';
      });
    }
  });
  current = index;
  const bar = document.querySelector('.progress-bar');
  if (bar) bar.style.width = `${((index + 1) / slides.length) * 100}%`;
  if (!exportMode) history.replaceState(null, '', `#${index + 1}`);
}

function scaleDeck() {
  if (exportMode) return;
  const stage = document.querySelector('.deck-stage') || document.querySelector('.deck');
  const viewport = document.querySelector('.deck-viewport');
  if (!stage) return;
  const vw = viewport ? viewport.clientWidth : window.innerWidth;
  const vh = viewport ? viewport.clientHeight : window.innerHeight;
  const scale = Math.min(vw / 1920, vh / 1080);
  const x = (vw - 1920 * scale) / 2;
  const y = (vh - 1080 * scale) / 2;
  stage.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  stage.style.transformOrigin = '0 0';
}

function initDiagrams() {
  const map = {
    'diag-oop': Diagrams.oopVsEcs,
    'diag-lit': Diagrams.literature,
    'diag-loop': Diagrams.mainLoop,
    'diag-pause': Diagrams.mainLoop,
    'diag-usecase': Diagrams.usecase,
    'diag-layers': Diagrams.fiveLayers,
    'diag-ecs': Diagrams.ecsBind,
    'diag-skill': Diagrams.skillChain,
    'diag-tab': Diagrams.tabSequence,
    'diag-perf': Diagrams.perfOptimize,
    'diag-combat': Diagrams.combatSeq,
    'diag-meta': Diagrams.metaLoop,
    'diag-fps': Diagrams.fpsChart,
    'diag-p95': Diagrams.p95Chart,
    'diag-formula': Diagrams.formulaTree,
    'diag-test': Diagrams.testPyramid,
    'diag-reliability': Diagrams.reliabilityCards,
  };
  Object.entries(map).forEach(([id, fn]) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = fn();
  });
}

function init() {
  if (exportMode) {
    document.body.classList.add('export-mode');
    if (exportSlide >= 0) showSlide(exportSlide);
    else showSlide(0);
  } else {
    const hash = parseInt(location.hash.replace('#', ''), 10);
    showSlide(hash > 0 && hash <= SLIDE_COUNT ? hash - 1 : 0);
    window.addEventListener('resize', scaleDeck);
    scaleDeck();
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        showSlide(current + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        showSlide(current - 1);
      } else if (e.key === 'Home') showSlide(0);
      else if (e.key === 'End') showSlide(SLIDE_COUNT - 1);
    });
  }
  initDiagrams();
  // 导出模式：等待动画完成再标记就绪
  if (exportMode) {
    setTimeout(() => document.body.dataset.ready = '1', 1200);
  }
}

document.addEventListener('DOMContentLoaded', init);
