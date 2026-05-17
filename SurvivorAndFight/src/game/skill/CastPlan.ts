/** 单次施放计划：由装配 Effect 链顺序合并生成。 */
export interface BulletSpawnSpec {
    bulletSlot: string;
    /** 与 UI 图标一致的贴图路径（atlas/WeaponIcon 或 atlas/EffectIcon）。 */
    iconPath?: string;
    damageScale: number;
    speedScale: number;
    penetration: number;
    splitCount: number;
    splitRemaining: number;
    chainCount: number;
    damageOverride?: number;
}

export interface DirectDamageSpec {
    effectId: string;
    paramsFormula: string;
    targetType: string;
}

export interface SkillCastPlan {
    skillId: string;
    bullets: BulletSpawnSpec[];
    directDamages: DirectDamageSpec[];
}
