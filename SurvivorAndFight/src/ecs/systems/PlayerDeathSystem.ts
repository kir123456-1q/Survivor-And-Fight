import { System } from '../core/System';
import type { EcsWorld } from '../core/World';
import type { EntityId } from '../core/EntityManager';
import type { FilterRegistry } from '../filters/FilterRegistry';
import { Attribute } from '../components/Attribute';
import { GameSession } from '../components/GameSession';

/**
 * Marks session paused when player hp reaches zero.
 */
export class PlayerDeathSystem implements System {
    readonly group = 'logic' as const;
    readonly priority = -10;

    constructor(
        private readonly world: EcsWorld,
        private readonly filters: FilterRegistry,
        private readonly sessionEntity: EntityId,
    ) {}

    update(_deltaTime: number): void {
        const session = this.world.getComponent(this.sessionEntity, GameSession);
        if (!session || session.paused) return;

        const players = this.filters.getNamedFilter('Players');
        if (players.length === 0) return;
        const playerAttr = this.world.getComponent(players[0], Attribute);
        if (!playerAttr || typeof playerAttr.base.hp !== 'number') return;

        if (playerAttr.base.hp <= 0) {
            playerAttr.base.hp = 0;
            session.paused = true;
        }
    }
}

