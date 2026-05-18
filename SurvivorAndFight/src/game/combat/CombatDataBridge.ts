import { MetaRunSession } from '../meta/MetaRunSession';
import {
    COMBAT_WORKER_ENABLED,
    COMBAT_WORKER_MIN_ENTITY_COUNT,
    COMBAT_WORKER_SCRIPT_URL,
    MONSTER_CHASE_SPEED,
    MONSTER_RANDOM_SWAY_DEGREE,
    MONSTER_RANDOM_SWAY_FREQ,
    MONSTER_SEPARATION_DISTANCE,
    MONSTER_SEPARATION_FORCE,
} from '../../defines';
import {
    COMBAT_WORKER_MSG_COMPUTE,
    COMBAT_WORKER_MSG_READY,
    type CombatWorkerComputeRequest,
    type CombatWorkerComputeResponse,
    type CombatWorkerOutbound,
} from './combatWorkerProtocol';
import { processCombatFrame } from './combatWorkerLogic';
import { hitRadiusSq } from '../bullet/BulletHitTest';

export interface CombatEntitySnapshot {
    playerEntityId: number;
    playerX: number;
    playerY: number;
    monsterIds: number[];
    monsterX: number[];
    monsterY: number[];
}

export interface CombatBulletSnapshot {
    x: number;
    y: number;
    dirX: number;
    dirY: number;
    speed: number;
    age: number;
    duration: number;
    penetration: number;
    ownerSide: 0 | 1;
    collisionDelay: number;
}

/**
 * 战斗数据 Worker 桥接：主线程采集快照 → Worker 重计算 → 主线程应用结果。
 * Worker 不可用时自动回退到主线程同步执行同一套逻辑。
 */
export class CombatDataBridge {
    private worker: Worker | null = null;
    private workerReady = false;
    private workerUsable = false;
    private frameId = 0;
    private elapsedTime = 0;
    private pendingRequestFrameId = -1;
    private latestResult: CombatWorkerComputeResponse | null = null;
    private latestResultFrameId = -1;

    constructor() {
        if (COMBAT_WORKER_ENABLED && typeof Worker !== 'undefined') {
            this.initWorker();
        }
    }

    dispose(): void {
        this.worker?.terminate();
        this.worker = null;
        this.workerReady = false;
        this.workerUsable = false;
    }

    isWorkerActive(): boolean {
        return this.workerUsable && this.workerReady;
    }

    tickElapsed(deltaTime: number): void {
        this.elapsedTime += deltaTime;
    }

    /**
     * 是否建议本帧走 Worker（实体规模足够且 Worker 可用）。
     */
    shouldUseWorker(entityCount: number, bulletCount: number): boolean {
        if (MetaRunSession.testMode && MetaRunSession.isAblationWave() && !MetaRunSession.testUseCombatWorker) {
            return false;
        }
        if (!this.isWorkerActive()) return false;
        return entityCount + bulletCount >= COMBAT_WORKER_MIN_ENTITY_COUNT;
    }

    /** 消融段切换时丢弃在途 Worker 结果，避免套用上一段配置。 */
    resetWorkerFrameState(): void {
        this.pendingRequestFrameId = -1;
        this.latestResult = null;
        this.latestResultFrameId = -1;
    }

    /**
     * 派发本帧战斗计算（非阻塞）。实体过少或 Worker 未就绪时不派发。
     */
    dispatchCompute(
        deltaTime: number,
        entities: CombatEntitySnapshot,
        bullets: CombatBulletSnapshot[],
    ): void {
        if (!this.shouldUseWorker(
            entities.monsterIds.length + (entities.playerEntityId > 0 ? 1 : 0),
            bullets.length,
        )) {
            return;
        }
        if (this.pendingRequestFrameId >= 0) return;

        this.frameId += 1;
        const frameId = this.frameId;
        this.pendingRequestFrameId = frameId;

        const request = this.buildRequest(frameId, deltaTime, entities, bullets);
        try {
            this.worker?.postMessage(request);
        } catch {
            this.pendingRequestFrameId = -1;
            this.workerUsable = false;
        }
    }

    /**
     * 每帧战斗逻辑入口：优先消费 Worker 异步结果，否则主线程同步计算；并派发下一帧 Worker 任务。
     */
    prepareFrame(
        deltaTime: number,
        entities: CombatEntitySnapshot,
        bullets: CombatBulletSnapshot[],
    ): CombatWorkerComputeResponse {
        this.tickElapsed(deltaTime);

        let result: CombatWorkerComputeResponse;
        if (this.latestResult) {
            result = this.latestResult;
            this.latestResult = null;
            this.latestResultFrameId = -1;
        } else {
            result = this.computeSync(deltaTime, entities, bullets);
        }

        this.dispatchCompute(deltaTime, entities, bullets);
        return result;
    }

    /**
     * 主线程同步计算（Worker 不可用或结果未就绪时的回退路径）。
     */
    computeSync(
        deltaTime: number,
        entities: CombatEntitySnapshot,
        bullets: CombatBulletSnapshot[],
    ): CombatWorkerComputeResponse {
        this.frameId += 1;
        const request = this.buildRequest(this.frameId, deltaTime, entities, bullets);
        return processCombatFrame(request);
    }

    private buildRequest(
        frameId: number,
        deltaTime: number,
        entities: CombatEntitySnapshot,
        bullets: CombatBulletSnapshot[],
    ): CombatWorkerComputeRequest {
        const monsterIds = new Uint32Array(entities.monsterIds);
        const monsterX = new Float32Array(entities.monsterX);
        const monsterY = new Float32Array(entities.monsterY);
        const bulletCount = bullets.length;

        const bulletX = new Float32Array(bulletCount);
        const bulletY = new Float32Array(bulletCount);
        const bulletDirX = new Float32Array(bulletCount);
        const bulletDirY = new Float32Array(bulletCount);
        const bulletSpeed = new Float32Array(bulletCount);
        const bulletAge = new Float32Array(bulletCount);
        const bulletDuration = new Float32Array(bulletCount);
        const bulletPenetration = new Int32Array(bulletCount);
        const bulletOwnerSide = new Uint8Array(bulletCount);
        const bulletCollisionDelay = new Float32Array(bulletCount);

        for (let i = 0; i < bulletCount; i++) {
            const b = bullets[i];
            bulletX[i] = b.x;
            bulletY[i] = b.y;
            bulletDirX[i] = b.dirX;
            bulletDirY[i] = b.dirY;
            bulletSpeed[i] = b.speed;
            bulletAge[i] = b.age;
            bulletDuration[i] = b.duration;
            bulletPenetration[i] = b.penetration;
            bulletOwnerSide[i] = b.ownerSide;
            bulletCollisionDelay[i] = b.collisionDelay;
        }

        return {
            type: COMBAT_WORKER_MSG_COMPUTE,
            frameId,
            deltaTime,
            elapsedTime: this.elapsedTime,
            hitRadiusSq: hitRadiusSq(),
            ai: {
                chaseSpeed: MONSTER_CHASE_SPEED,
                swayDegree: MONSTER_RANDOM_SWAY_DEGREE,
                swayFreq: MONSTER_RANDOM_SWAY_FREQ,
                separationDistance: MONSTER_SEPARATION_DISTANCE,
                separationForce: MONSTER_SEPARATION_FORCE,
            },
            playerEntityId: entities.playerEntityId,
            playerX: entities.playerX,
            playerY: entities.playerY,
            monsterIds,
            monsterX,
            monsterY,
            bulletX,
            bulletY,
            bulletDirX,
            bulletDirY,
            bulletSpeed,
            bulletAge,
            bulletDuration,
            bulletPenetration,
            bulletOwnerSide,
            bulletCollisionDelay,
        };
    }

    private initWorker(): void {
        try {
            const url = this.resolveWorkerUrl();
            this.worker = new Worker(url);
            this.worker.onmessage = (event: MessageEvent<CombatWorkerOutbound>) => {
                const msg = event.data;
                if (msg.type === COMBAT_WORKER_MSG_READY) {
                    this.workerReady = true;
                    this.workerUsable = true;
                    return;
                }
                this.pendingRequestFrameId = -1;
                this.latestResult = msg;
                this.latestResultFrameId = msg.frameId;
            };
            this.worker.onerror = () => {
                this.workerUsable = false;
                this.workerReady = false;
                this.pendingRequestFrameId = -1;
            };
        } catch {
            this.worker = null;
            this.workerUsable = false;
        }
    }

    private resolveWorkerUrl(): string {
        if (typeof location !== 'undefined' && location.href) {
            try {
                return new URL(COMBAT_WORKER_SCRIPT_URL, location.href).href;
            } catch {
                return COMBAT_WORKER_SCRIPT_URL;
            }
        }
        return COMBAT_WORKER_SCRIPT_URL;
    }
}
