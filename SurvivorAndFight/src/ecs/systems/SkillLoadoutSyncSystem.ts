import type { EcsWorld } from '../core/World';
import { System } from '../core/System';
import type { FilterRegistry } from '../filters/FilterRegistry';
import { Skill } from '../components/Skill';
import { SkillLoadoutState } from '../components/SkillLoadoutState';
import { EQUIPPED_SKILL_SLOT_COUNT, SKILL_CAST_STAGGER_OFFSETS_SEC } from '../../defines';

/**
 * 将 SkillLoadoutState 装备栏同步到玩家 Skill.currentSkillId（主槽 slot0）。
 */
export class SkillLoadoutSyncSystem implements System {
    readonly group = 'logic' as const;
    readonly priority = 4;

    constructor(
        private readonly world: EcsWorld,
        private readonly filters: FilterRegistry,
        private readonly isPaused?: () => boolean,
    ) {}

    update(_deltaTime: number): void {
        const players = this.filters.getNamedFilter('Players');
        for (const player of players) {
            const loadout = this.world.getComponent(player, SkillLoadoutState);
            const skill = this.world.getComponent(player, Skill);
            if (!loadout || !skill) continue;
            if (!loadout.dirty) continue;

            const primary = loadout.equippedSkillIds.find((id) => !!id) ?? null;
            if (primary !== skill.currentSkillId) {
                skill.currentSkillId = primary;
            }
            for (let i = 0; i < EQUIPPED_SKILL_SLOT_COUNT; i++) {
                const sid = loadout.equippedSkillIds[i];
                if (!sid) continue;
                if (skill.cooldownRemain[sid] === undefined) {
                    skill.cooldownRemain[sid] = SKILL_CAST_STAGGER_OFFSETS_SEC[i] ?? 0;
                }
            }
            loadout.dirty = false;
        }
    }
}
