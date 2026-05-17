/** Worker 与主线程共享的消息类型（禁止引用 Laya / DOM）。 */

export const COMBAT_WORKER_MSG_COMPUTE = 'compute' as const;
export const COMBAT_WORKER_MSG_READY = 'ready' as const;

export type CombatOwnerSide = 0 | 1;

export interface CombatAiConfig {
    chaseSpeed: number;
    swayDegree: number;
    swayFreq: number;
    separationDistance: number;
    separationForce: number;
}

export interface CombatWorkerComputeRequest {
    type: typeof COMBAT_WORKER_MSG_COMPUTE;
    frameId: number;
    deltaTime: number;
    elapsedTime: number;
    hitRadiusSq: number;
    ai: CombatAiConfig;
    playerEntityId: number;
    playerX: number;
    playerY: number;
    monsterIds: Uint32Array;
    monsterX: Float32Array;
    monsterY: Float32Array;
    bulletX: Float32Array;
    bulletY: Float32Array;
    bulletDirX: Float32Array;
    bulletDirY: Float32Array;
    bulletSpeed: Float32Array;
    bulletAge: Float32Array;
    bulletDuration: Float32Array;
    bulletPenetration: Int32Array;
    bulletOwnerSide: Uint8Array;
    bulletCollisionDelay: Float32Array;
}

export interface CombatBulletHit {
    bulletIndex: number;
    targetEntityId: number;
}

export interface CombatWorkerComputeResponse {
    frameId: number;
    monsterVelX: Float32Array;
    monsterVelY: Float32Array;
    bulletX: Float32Array;
    bulletY: Float32Array;
    bulletAge: Float32Array;
    bulletCollisionDelay: Float32Array;
    bulletPenetration: Int32Array;
    hits: CombatBulletHit[];
    expiredBulletIndices: number[];
}

export type CombatWorkerInbound = CombatWorkerComputeRequest;
export type CombatWorkerOutbound = { type: typeof COMBAT_WORKER_MSG_READY } | CombatWorkerComputeResponse;
