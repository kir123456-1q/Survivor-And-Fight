/** Effect 行为类型（skill_effect_table.effect）。 */
export const EFFECT_TYPE_BULLET = 'bullet';
export const EFFECT_TYPE_DIRECT_DAMAGE = 'direct_damage';
export const EFFECT_TYPE_MODIFIER_SPLIT = 'modifier_split';
export const EFFECT_TYPE_MODIFIER_CHAIN = 'modifier_chain';
export const EFFECT_TYPE_MODIFIER_PIERCE = 'modifier_pierce';

/** 连锁闪电额外命中半径（世界单位）。 */
export const CHAIN_HIT_RADIUS = 120;

/** 默认连锁额外目标数（配表 chainCount 可覆盖）。 */
export const DEFAULT_CHAIN_TARGET_COUNT = 2;

/** 默认分裂级数（splitCount=1 表示命中后扇形 2 发）。 */
export const DEFAULT_SPLIT_COUNT = 1;

/** 分裂剩余触发次数（命中时）。 */
export const DEFAULT_SPLIT_REMAINING = 1;
