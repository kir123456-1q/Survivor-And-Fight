import { System } from '../core/System';
import type { EcsWorld } from '../core/World';
import type { FilterRegistry } from '../filters/FilterRegistry';
import { Experience } from '../components/Experience';
import { MONSTER_WAVE_BASE_COUNT, MONSTER_WAVE_INTERVAL_SEC } from '../../defines';

type SpawnBatchFn = (count: number, monsterLevel: number) => Promise<void> | void;

/**
 * Spawns a new monster wave every fixed interval.
 * Count scales with player level: base + (level - 1).
 */
export class MonsterWaveSpawnSystem implements System {
    readonly group = 'logic' as const;
    readonly priority = -8;

    private elapsed = 0;
    private spawning = false;
    private waveSpawnEnabled = true;

    constructor(
        private readonly world: EcsWorld,
        private readonly filters: FilterRegistry,
        private readonly spawnBatch: SpawnBatchFn,
        private readonly isPaused?: () => boolean,
    ) {}

    setWaveSpawnEnabled(enabled: boolean): void {
        this.waveSpawnEnabled = enabled;
        if (!enabled) {
            this.elapsed = 0;
            this.spawning = false;
        }
    }

    update(deltaTime: number): void {
        if (!this.waveSpawnEnabled) return;
        if (this.isPaused?.()) return;
        if (this.spawning) return;

        this.elapsed += deltaTime;
        if (this.elapsed < MONSTER_WAVE_INTERVAL_SEC) return;
        this.elapsed -= MONSTER_WAVE_INTERVAL_SEC;

        const playerLevel = this.getPlayerLevel();
        const count = MONSTER_WAVE_BASE_COUNT + Math.max(0, playerLevel - 1);
        this.spawning = true;
        Promise.resolve(this.spawnBatch(count, playerLevel))
            .finally(() => {
                this.spawning = false;
            });
    }

    reset(): void {
        this.elapsed = 0;
        this.spawning = false;
        this.waveSpawnEnabled = true;
    }

    private getPlayerLevel(): number {
        const players = this.filters.getNamedFilter('Players');
        if (players.length === 0) return 1;
        const xp = this.world.getComponent(players[0], Experience);
        return xp?.level ?? 1;
    }
}
