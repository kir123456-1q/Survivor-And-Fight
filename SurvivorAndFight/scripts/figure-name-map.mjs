/** 图号 ↔ 原文件名（不含扩展名），供 export-thesis-png 与文档引用 */
export const FIGURE_NAME_MAP = [
  { no: "2-1", base: "fig-ch02-main-loop" },
  { no: "2-2", base: "fig-ch02-ecs-bind" },
  { no: "2-3", base: "fig-ch02-runmap-dag" },
  { no: "3-1", base: "fig-ch03-usecase" },
  { no: "4-1", base: "fig-ch04-01-layers" },
  { no: "4-2", base: "fig-ch04-02-sequence" },
  { no: "4-3", base: "fig-ch04-03-modules" },
  { no: "4-4", base: "fig-ch04-04-config-er" },
  { no: "4-5", base: "fig-ch04-05-combat-flow" },
  { no: "4-6", base: "fig-ch04-06-fault-tolerance" },
  { no: "4-7", base: "fig-ch04-07-fault-degrade" },
  { no: "4-8", base: "fig-ch04-08-ecs-gameplay" },
  { no: "4-9", base: "fig-ch04-09-mvc-ui" },
  { no: "4-10", base: "fig-ch04-10-worker-pool" },
  { no: "5-1", base: "fig-ch05-skill-chain" },
  { no: "5-2", base: "fig-ch05-tab-sequence" },
  { no: "5-3", base: "fig-ch05-runmap-gen" },
  { no: "5-4", base: "fig-ch05-04-config-load" },
  { no: "5-5", base: "fig-ch05-05-formula-tree" },
  { no: "6-1", base: "fig-ch06-pool-lifecycle" },
  { no: "6-2", base: "fig-ch06-worker" },
  { no: "6-3", base: "fig-ch06-chart-fps-atlas" },
  { no: "6-4", base: "fig-ch06-chart-p95-pool" },
  { no: "7-1", base: "fig-01-start" },
  { no: "7-2", base: "fig-02-runmap" },
  { no: "7-3", base: "fig-03-combat" },
  { no: "7-4", base: "fig-04-skill" },
  { no: "7-5", base: "fig-05-reward" },
  { no: "7-6", base: "fig-06-restart" },
];

/** @param {string} figNo 如 "4-1" @param {string} base 如 "fig-ch04-01-layers" */
export function pngFileName(figNo, base) {
  return `图${figNo}-${base}.png`;
}

/** @param {string} base 不含扩展名 */
export function pngFileNameByBase(base) {
  const row = FIGURE_NAME_MAP.find((r) => r.base === base);
  if (!row) return `${base}.png`;
  return pngFileName(row.no, row.base);
}

export function baseByFigNo(figNo) {
  return FIGURE_NAME_MAP.find((r) => r.no === figNo)?.base;
}
