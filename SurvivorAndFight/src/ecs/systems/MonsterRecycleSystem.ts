import { System } from '../core/System';
import type { EcsWorld } from '../core/World';
import type { FilterRegistry } from '../filters/FilterRegistry';
import { Attribute } from '../components/Attribute';
import { ExperienceReward } from '../components/ExperienceReward';
import { ViewComponent } from '../components/TransformComponents';
import { ExperienceSystem } from './ExperienceSystem';
import type { MonsterPool } from '../../game/monster/MonsterPool';

/**
 * Recycles dead monsters into pool and removes ECS entity.
 */
export class MonsterRecycleSystem implements System {
    readonly group = 'logic' as const;
    readonly priority = -6;

    constructor(
        private readonly world: EcsWorld,
        private readonly filters: FilterRegistry,
        private readonly monsterPool: MonsterPool,
        private readonly experienceSystem: ExperienceSystem,
        private readonly isPaused?: () => boolean,
        private readonly isObjectPoolEnabled?: () => boolean,
    ) {}

    update(_deltaTime: number): void {
        if (this.isPaused?.()) return;
        const monsters = this.filters.getNamedFilter('Monsters');
        for (const entity of monsters) {
            const attr = this.world.getComponent(entity, Attribute);
            if (!attr || typeof attr.base.hp !== 'number' || attr.base.hp > 0) continue;

            const players = this.filters.getNamedFilter('Players');
            if (players.length > 0) {
                const reward = this.world.getComponent(entity, ExperienceReward);
                const exp = reward?.exp ?? 0;
                if (exp > 0) {
                    this.experienceSystem.grantExp(players[0], exp);
                }
            }

            const view = this.world.getComponent(entity, ViewComponent);
            const node = view?.node as any;
            if (node) {
                node.visible = false;
                const bloodBar = node.getChildByName ? node.getChildByName('BloodBar') : null;
                if (bloodBar) bloodBar.visible = false;
                if (this.isObjectPoolEnabled?.() ?? true) {
                    this.monsterPool.put(node);
                } else if (node.destroy) {
                    node.destroy();
                }
            }
            this.world.destroyEntity(entity);
        }
    }
}

