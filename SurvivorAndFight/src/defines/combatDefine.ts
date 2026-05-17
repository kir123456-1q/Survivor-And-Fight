/**
 * 战斗数据 Worker 静态配置。
 */

/** 是否尝试启用 Web Worker 处理战斗重计算。 */
export const COMBAT_WORKER_ENABLED = true;

/** Worker 脚本相对发布根目录的路径（对应 bin/js/combat.worker.js）。 */
export const COMBAT_WORKER_SCRIPT_URL = 'js/combat.worker.js';

/** 实体总数低于该值时仍在主线程计算，避免 Worker 通信开销。 */
export const COMBAT_WORKER_MIN_ENTITY_COUNT = 6;

/** Worker 结果最多可滞后帧数，超时则主线程同步重算。 */
export const COMBAT_WORKER_MAX_RESULT_LAG_FRAMES = 2;
