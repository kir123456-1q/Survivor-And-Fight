/**
 * 战斗技能装配 UI 静态配置。
 */

/** 技能（法杖）图标目录，文件名即 skill_table.id（含 .png）。 */
export const WEAPON_ICON_BASE_PATH = 'atlas/WeaponIcon';

export function buildWeaponIconPath(skillId: string): string {
    return `${WEAPON_ICON_BASE_PATH}/${skillId}.png`;
}

export const EFFECT_BOX_SLOT_COUNT = 10;
export const SKILL_ICON_SIZE = 80;
export const EFFECT_ICON_SIZE = 47;
export const EFFECT_BTN_WIDTH = 47;
export const EFFECT_BTN_HEIGHT = 47;
export const EFFECT_BTN_GAP = 8;
export const LONG_PRESS_MS = 300;
export const TAB_KEY_CODE = 9;

/** 为 true 时输出 [SkillDrag] 拖拽/交换诊断日志。 */
export const SKILL_DRAG_DEBUG_LOG = false;

/** SkillBox 固定格子数（与 ownedSkillIds 索引对应）。 */
export const SKILL_BOX_SLOT_COUNT = 20;

export const SKILL_INVENTORY_MAX = 20;

/** 开局随机放入装备栏的技能数、EffectBox 的 Effect 数。 */
export const START_RANDOM_SKILL_COUNT = 3;
export const START_RANDOM_EFFECT_COUNT = 5;

/** EffectBtn 三态底图（normal / over / down）。 */
export const EFFECT_BTN_BASE_BAR_PATH = 'atlas/UIPng/RunMapHud/BaseBar.png';
export const DEFAULT_EFFECT_SLOT_COUNT = 8;
export const EQUIPPED_SKILL_SLOT_COUNT = 3;

export const SKILL_SELECT_PANEL_NAME = 'SkillSelectPanel';
export const SKILL_BASE_BAR_NAMES = ['SkillBaseBar1', 'SkillBaseBar2', 'SkillBaseBar3'] as const;
export const EFFECT_BOX_NAME = 'EffectBox';
export const EFFECT_BOX_SKILL_PREFIX = 'EffectBox_';
export const SKILL_BOX_NAME = 'SkillBox';
export const EFFECT_BTN_NAME = 'EffectBtn';
export const EFFECT_ICON_NAME = 'EffectIcon';
export const SKILL_ICON_CHILD_NAME = '__skillIcon';
export const SKILL_BASE_BAR_NAME = 'SkillBaseBar';

/** EffectBtn 预制体资源 UUID（MainUIPanel 内嵌引用）。 */
export const EFFECT_BTN_PREFAB = 'b0c7f4b6-9a33-4cd8-897e-4888efe760fe';

/** Laya 运行时实例化路径。 */
export const EFFECT_BTN_PREFAB_RES = `res://${EFFECT_BTN_PREFAB}`;
