import type { EcsWorld } from '../core/World';
import { System } from '../core/System';
import type { FilterRegistry } from '../filters/FilterRegistry';
import { Skill } from '../components/Skill';
import { SkillLoadoutState } from '../components/SkillLoadoutState';
import { EQUIPPED_SKILL_SLOT_COUNT } from '../../defines';
import { getCombatEffectIds } from '../../game/skill/SkillLoadoutModel';

/**
 * 自动施法：每帧最多入队一个已冷却技能，并按装备槽轮询，避免三技能同帧齐射。
 */
export class PlayerAutoCastSystem implements System {
    readonly group = 'logic' as const;
    readonly priority = 3;

    /** 下一帧优先尝试的装备槽索引（0..2 轮询）。 */
    private castSlotCursor = 0;

    constructor(
        private readonly world: EcsWorld,
        private readonly filters: FilterRegistry,
        private readonly isPaused?: () => boolean,
    ) {}

    update(_deltaTime: number): void {
        if (this.isPaused?.()) return;
        const players = this.filters.getNamedFilter('Players');
        for (const player of players) {
            const skill = this.world.getComponent(player, Skill);
            if (!skill) continue;

            const loadout = this.world.getComponent(player, SkillLoadoutState);
            if (loadout) {
                if (this.tryQueueEquippedCast(skill, loadout)) continue;
            }

            const fallbackId = skill.currentSkillId;
            if (!fallbackId) continue;
            if ((skill.cooldownRemain[fallbackId] ?? 0) > 0) continue;
            if (loadout && getCombatEffectIds(loadout, fallbackId).length === 0) continue;
            if (skill.pendingCasts.some((p) => p.skillId === fallbackId)) continue;
            skill.pendingCasts.push({ skillId: fallbackId });
        }
    }

    private tryQueueEquippedCast(skill: Skill, loadout: SkillLoadoutState): boolean {
        for (let k = 0; k < EQUIPPED_SKILL_SLOT_COUNT; k++) {
            const slotIndex = (this.castSlotCursor + k) % EQUIPPED_SKILL_SLOT_COUNT;
            const skillId = loadout.equippedSkillIds[slotIndex];
            if (!skillId) continue;
            if ((skill.cooldownRemain[skillId] ?? 0) > 0) continue;
            if (getCombatEffectIds(loadout, skillId).length === 0) continue;
            if (skill.pendingCasts.some((p) => p.skillId === skillId)) continue;

            skill.pendingCasts.push({ skillId });
            this.castSlotCursor = (slotIndex + 1) % EQUIPPED_SKILL_SLOT_COUNT;
            return true;
        }
        return false;
    }
}
