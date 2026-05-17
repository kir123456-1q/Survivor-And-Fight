/** 怪物图标目录（文件名 = monster_table.id + .png）。 */
export const MONSTER_ICON_BASE_PATH = 'atlas/MonsterIcon';

export function buildMonsterIconPath(monsterId: string): string {
    return `${MONSTER_ICON_BASE_PATH}/${monsterId}.png`;
}

/** MonsterBody.lh 内贴图节点名。 */
export const MONSTER_BODY_IMAGE_NAME = 'img';

/** 战场怪物贴图显示边长（世界单位，预制体 scale 0.1 下约 40px 视觉）。 */
export const MONSTER_WORLD_ICON_SIZE = 200;

/** 怪物远程技能尝试施放距离（世界单位）。 */
export const MONSTER_ATTACK_RANGE = 240;

/** 怪物近战技能尝试施放距离。 */
export const MONSTER_MELEE_SKILL_RANGE = 52;

/** 同帧多只怪物施法错开（秒）。 */
export const MONSTER_CAST_STAGGER_SEC = 0.08;
