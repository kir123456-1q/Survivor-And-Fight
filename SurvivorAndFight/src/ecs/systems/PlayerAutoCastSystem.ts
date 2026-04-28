import type { EcsWorld } from '../core/World';
import { System } from '../core/System';
import type { FilterRegistry } from '../filters/FilterRegistry';
import { Skill } from '../components/Skill';
import { COMBAT_DEBUG_LOG } from '../../defines';

/**
 * Auto-cast bridge: continuously requests cast for player currentSkillId.
 * Cooldown and actual effect execution are handled by SkillSystem.
 */
export class PlayerAutoCastSystem implements System {
    readonly group = 'logic' as const;
    readonly priority = 3;
    private castLogCounter = 0;

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
            if (!skill?.currentSkillId) continue;
            if (skill.pendingCast) continue;
            skill.pendingCast = { skillId: skill.currentSkillId };
            if (COMBAT_DEBUG_LOG && this.castLogCounter < 20) {
                this.castLogCounter += 1;
                console.log('[AutoCast] request cast', {
                    entity: player,
                    skillId: skill.currentSkillId,
                    count: this.castLogCounter,
                });
            }
        }
    }
}

