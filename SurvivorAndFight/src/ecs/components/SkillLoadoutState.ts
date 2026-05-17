/**
 * 玩家技能装配运行时状态（本局内存，不持久化）。
 */
export class SkillLoadoutState {
    equippedSkillIds: [string | null, string | null, string | null] = [null, null, null];
    ownedSkillIds: string[] = [];
    unequippedEffectIds: string[] = [];
    skillEffectMap: Record<string, (string | null)[]> = {};
    panelOpen = false;
    dirty = true;
}
