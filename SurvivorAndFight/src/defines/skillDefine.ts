/**
 * 技能 / 公式解析模块静态配置。
 */
export const ALLOWED_PATTERN = /^[\d.\s+\-*/()\w]+$/;
export const IDENT_PATTERN = /[a-zA-Z_][a-zA-Z0-9_]*/g;

/** 默认玩家自动射击技能 ID（读取 Skill 表）。 */
export const DEFAULT_PLAYER_AUTO_SKILL_ID = 'player_auto_shot';
export const DEFAULT_PLAYER_AUTO_EFFECT_ID = 'player_auto_shot_effect_1';
export const DEFAULT_PLAYER_AUTO_COOLDOWN_SEC = 0.25;

/** 战斗链路调试日志开关（自动施法 -> 技能 -> 子弹 -> 命中伤害）。 */
export const COMBAT_DEBUG_LOG = true;
