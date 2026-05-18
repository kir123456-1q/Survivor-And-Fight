import { System } from '../core/System';
import type { EcsWorld } from '../core/World';
import type { FilterRegistry } from '../filters/FilterRegistry';
import { Position } from '../components/TransformComponents';
import { Attribute } from '../components/Attribute';
import { MONSTER_COLLISION_DPS, MONSTER_COLLISION_RADIUS } from '../../defines';
import { MonsterDef } from '../components/MonsterDef';
import { getMonsterRow } from '../../game/monster/MonsterCatalog';
import { MetaRunSession } from '../../game/meta/MetaRunSession';

/**
 * Applies continuous contact damage when monsters overlap the player.
 */
export class MonsterContactDamageSystem implements System {
    readonly group = 'logic' as const;
    readonly priority = -5;

    constructor(
        private readonly world: EcsWorld,
        private readonly filters: FilterRegistry,
        private readonly isPaused?: () => boolean,
    ) {}

    update(deltaTime: number): void {
        if (MetaRunSession.testMode) return;
        if (this.isPaused?.()) return;
        const players = this.filters.getNamedFilter('Players');
        if (players.length === 0) return;
        const player = players[0];
        const playerPos = this.world.getComponent(player, Position);
        const playerAttr = this.world.getComponent(player, Attribute);
        if (!playerPos || !playerAttr || typeof playerAttr.base.hp !== 'number') return;
        if (playerAttr.base.hp <= 0) return;

        const monsters = this.filters.getNamedFilter('Monsters');
        const radiusSq = MONSTER_COLLISION_RADIUS * MONSTER_COLLISION_RADIUS;
        for (const monster of monsters) {
            const mPos = this.world.getComponent(monster, Position);
            if (!mPos) continue;
            const dx = mPos.x - playerPos.x;
            const dy = mPos.y - playerPos.y;
            const distSq = dx * dx + dy * dy;
            if (distSq > radiusSq) continue;

            const def = this.world.getComponent(monster, MonsterDef);
            const dps = def
                ? (getMonsterRow(def.monsterId)?.contactDps ?? MONSTER_COLLISION_DPS)
                : MONSTER_COLLISION_DPS;
            playerAttr.base.hp = Math.max(0, playerAttr.base.hp - dps * deltaTime);
        }
    }
}
