import { System } from '../core/System';
import type { EcsWorld } from '../core/World';
import { Experience, calcExpToNext } from '../components/Experience';

/**
 * Handles player level-up progression from accumulated exp.
 */
export class ExperienceSystem implements System {
    readonly group = 'logic' as const;
    readonly priority = -7;

    constructor(private readonly world: EcsWorld) {}

    update(_deltaTime: number): void {
        const pairs = this.world.getAllOfType(Experience);
        for (const [, xp] of pairs) {
            this.normalize(xp);
        }
    }

    grantExp(entity: number, amount: number): void {
        if (amount <= 0) return;
        const xp = this.world.getComponent(entity, Experience);
        if (!xp) return;
        xp.exp += amount;
        this.normalize(xp);
    }

    private normalize(xp: Experience): void {
        while (xp.exp >= xp.expToNext) {
            xp.exp -= xp.expToNext;
            xp.level += 1;
            xp.expToNext = calcExpToNext(xp.level);
        }
        if (xp.exp < 0) xp.exp = 0;
    }
}
