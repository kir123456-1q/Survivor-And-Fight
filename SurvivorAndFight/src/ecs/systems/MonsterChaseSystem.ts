import { System } from '../core/System';
import type { EntityId } from '../core/EntityManager';
import type { EcsWorld } from '../core/World';
import type { FilterRegistry } from '../filters/FilterRegistry';
import { Position, Velocity } from '../components/TransformComponents';
import {
    MONSTER_CHASE_SPEED,
    MONSTER_RANDOM_SWAY_DEGREE,
    MONSTER_RANDOM_SWAY_FREQ,
    MONSTER_SEPARATION_DISTANCE,
    MONSTER_SEPARATION_FORCE,
} from '../../defines';

/**
 * Minimal monster AI for phase1:
 * monsters continuously move toward the first player entity.
 */
export class MonsterChaseSystem implements System {
    readonly group = 'logic' as const;
    readonly priority = 1;
    private elapsedTime = 0;

    constructor(
        private readonly world: EcsWorld,
        private readonly filters: FilterRegistry,
        private readonly isPaused?: () => boolean,
    ) {}

    update(deltaTime: number): void {
        if (this.isPaused?.()) return;
        this.elapsedTime += deltaTime;
        const players = this.filters.getNamedFilter('Players');
        if (players.length === 0) return;
        const playerPos = this.world.getComponent(players[0], Position);
        if (!playerPos) return;

        const monsters = this.filters.getNamedFilter('Monsters');
        for (const monster of monsters) {
            const pos = this.world.getComponent(monster, Position);
            const vel = this.world.getComponent(monster, Velocity);
            if (!pos || !vel) continue;

            const dx = playerPos.x - pos.x;
            const dy = playerPos.y - pos.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len < 1e-5) {
                const phase = this.monsterPhase(monster);
                vel.vx = Math.cos(phase) * MONSTER_CHASE_SPEED * 0.25;
                vel.vy = Math.sin(phase) * MONSTER_CHASE_SPEED * 0.25;
                continue;
            }

            // Random sway makes movement less robotic while still chasing player.
            const baseX = dx / len;
            const baseY = dy / len;
            const swayRad = (MONSTER_RANDOM_SWAY_DEGREE * Math.PI / 180)
                * Math.sin(this.elapsedTime * MONSTER_RANDOM_SWAY_FREQ + this.monsterPhase(monster));
            const cosA = Math.cos(swayRad);
            const sinA = Math.sin(swayRad);
            const chaseX = baseX * cosA - baseY * sinA;
            const chaseY = baseX * sinA + baseY * cosA;

            const separation = this.computeSeparation(monster, pos, monsters);
            vel.vx = chaseX * MONSTER_CHASE_SPEED + separation.x * MONSTER_SEPARATION_FORCE;
            vel.vy = chaseY * MONSTER_CHASE_SPEED + separation.y * MONSTER_SEPARATION_FORCE;
            if (vel.vz !== undefined) vel.vz = 0;
        }
    }

    private monsterPhase(entityId: EntityId): number {
        return entityId * 0.73;
    }

    private computeSeparation(entity: EntityId, pos: Position, monsters: EntityId[]): { x: number; y: number } {
        let sepX = 0;
        let sepY = 0;
        for (const other of monsters) {
            if (other === entity) continue;
            const otherPos = this.world.getComponent(other, Position);
            if (!otherPos) continue;

            const dx = pos.x - otherPos.x;
            const dy = pos.y - otherPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist >= MONSTER_SEPARATION_DISTANCE) continue;

            if (dist < 1e-5) {
                const fallback = this.monsterPhase(entity + other);
                sepX += Math.cos(fallback);
                sepY += Math.sin(fallback);
                continue;
            }

            const weight = (MONSTER_SEPARATION_DISTANCE - dist) / MONSTER_SEPARATION_DISTANCE;
            sepX += (dx / dist) * weight;
            sepY += (dy / dist) * weight;
        }
        return { x: sepX, y: sepY };
    }
}
