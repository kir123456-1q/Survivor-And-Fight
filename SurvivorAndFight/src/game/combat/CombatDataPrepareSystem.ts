import { System } from '../../ecs/core/System';
import type { EcsWorld } from '../../ecs/core/World';
import type { FilterRegistry } from '../../ecs/filters/FilterRegistry';
import { Position } from '../../ecs/components/TransformComponents';
import type { CombatDataBridge, CombatEntitySnapshot } from './CombatDataBridge';
import type { BulletSystem } from '../bullet/BulletSystem';
import type { CombatWorkerComputeResponse } from './combatWorkerProtocol';

/**
 * 每帧在追逐/子弹逻辑之前准备战斗数据：优先应用 Worker 结果，否则主线程同步计算，并派发下一帧 Worker 任务。
 */
export class CombatDataPrepareSystem implements System {
    readonly group = 'logic' as const;
    readonly priority = 10;

    private frameResult: CombatWorkerComputeResponse | null = null;

    constructor(
        private readonly world: EcsWorld,
        private readonly filters: FilterRegistry,
        private readonly bridge: CombatDataBridge,
        private readonly bulletSystem: BulletSystem,
        private readonly isPaused?: () => boolean,
    ) {}

    getFrameResult(): CombatWorkerComputeResponse | null {
        return this.frameResult;
    }

    update(deltaTime: number): void {
        this.frameResult = null;
        if (this.isPaused?.()) return;

        const entities = this.collectEntities();
        const bullets = this.bulletSystem.collectSnapshots();
        this.frameResult = this.bridge.prepareFrame(deltaTime, entities, bullets);
    }

    private collectEntities(): CombatEntitySnapshot {
        const players = this.filters.getNamedFilter('Players');
        const monsters = this.filters.getNamedFilter('Monsters');

        let playerEntityId = 0;
        let playerX = 0;
        let playerY = 0;
        if (players.length > 0) {
            const pos = this.world.getComponent(players[0], Position);
            if (pos) {
                playerEntityId = players[0];
                playerX = pos.x;
                playerY = pos.y ?? 0;
            }
        }

        const monsterIds: number[] = [];
        const monsterX: number[] = [];
        const monsterY: number[] = [];
        for (const mid of monsters) {
            const pos = this.world.getComponent(mid, Position);
            if (!pos) continue;
            monsterIds.push(mid);
            monsterX.push(pos.x);
            monsterY.push(pos.y ?? 0);
        }

        return { playerEntityId, playerX, playerY, monsterIds, monsterX, monsterY };
    }
}
