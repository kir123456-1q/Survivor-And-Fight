import { segmentHitsCircle } from '../bullet/BulletHitTest';
import type {
    CombatAiConfig,
    CombatBulletHit,
    CombatOwnerSide,
    CombatWorkerComputeRequest,
    CombatWorkerComputeResponse,
} from './combatWorkerProtocol';

function monsterPhase(entityId: number): number {
    return entityId * 0.73;
}

/**
 * 怪物追逐 + 随机摆动 + O(n²) 分离力（与 MonsterChaseSystem 主线程逻辑一致）。
 */
export function computeMonsterVelocities(
    ai: CombatAiConfig,
    elapsedTime: number,
    playerX: number,
    playerY: number,
    monsterIds: Uint32Array,
    monsterX: Float32Array,
    monsterY: Float32Array,
): { velX: Float32Array; velY: Float32Array } {
    const n = monsterIds.length;
    const velX = new Float32Array(n);
    const velY = new Float32Array(n);
    const sepDist = ai.separationDistance;
    const sepDistSq = sepDist * sepDist;

    for (let i = 0; i < n; i++) {
        const id = monsterIds[i];
        const px = monsterX[i];
        const py = monsterY[i];

        const dx = playerX - px;
        const dy = playerY - py;
        const len = Math.sqrt(dx * dx + dy * dy);

        let chaseX: number;
        let chaseY: number;
        if (len < 1e-5) {
            const phase = monsterPhase(id);
            chaseX = Math.cos(phase) * ai.chaseSpeed * 0.25;
            chaseY = Math.sin(phase) * ai.chaseSpeed * 0.25;
        } else {
            const baseX = dx / len;
            const baseY = dy / len;
            const swayRad = (ai.swayDegree * Math.PI / 180)
                * Math.sin(elapsedTime * ai.swayFreq + monsterPhase(id));
            const cosA = Math.cos(swayRad);
            const sinA = Math.sin(swayRad);
            chaseX = baseX * cosA - baseY * sinA;
            chaseY = baseX * sinA + baseY * cosA;
        }

        let sepX = 0;
        let sepY = 0;
        for (let j = 0; j < n; j++) {
            if (j === i) continue;
            const ox = monsterX[j];
            const oy = monsterY[j];
            const sdx = px - ox;
            const sdy = py - oy;
            const distSq = sdx * sdx + sdy * sdy;
            if (distSq >= sepDistSq) continue;

            const dist = Math.sqrt(distSq);
            if (dist < 1e-5) {
                const fallback = monsterPhase(id + monsterIds[j]);
                sepX += Math.cos(fallback);
                sepY += Math.sin(fallback);
                continue;
            }

            const weight = (sepDist - dist) / sepDist;
            sepX += (sdx / dist) * weight;
            sepY += (sdy / dist) * weight;
        }

        velX[i] = chaseX * ai.chaseSpeed + sepX * ai.separationForce;
        velY[i] = chaseY * ai.chaseSpeed + sepY * ai.separationForce;
    }

    return { velX, velY };
}

function isValidTarget(
    ownerSide: CombatOwnerSide,
    targetIsMonster: boolean,
): boolean {
    if (ownerSide === 0) return targetIsMonster;
    return !targetIsMonster;
}

/**
 * 子弹位移、寿命、穿透与距离碰撞（与 BulletSystem 主线程逻辑一致）。
 */
export function stepBulletsAndHits(
    deltaTime: number,
    hitRadiusSq: number,
    bulletX: Float32Array,
    bulletY: Float32Array,
    bulletDirX: Float32Array,
    bulletDirY: Float32Array,
    bulletSpeed: Float32Array,
    bulletAge: Float32Array,
    bulletDuration: Float32Array,
    bulletPenetration: Int32Array,
    bulletOwnerSide: Uint8Array,
    bulletCollisionDelay: Float32Array,
    monsterIds: Uint32Array,
    monsterX: Float32Array,
    monsterY: Float32Array,
    playerEntityId: number,
    playerX: number,
    playerY: number,
): { hits: CombatBulletHit[]; expiredBulletIndices: number[] } {
    const hits: CombatBulletHit[] = [];
    const expiredBulletIndices: number[] = [];
    const bulletCount = bulletX.length;
    const hasPlayer = playerEntityId > 0;

    for (let bi = 0; bi < bulletCount; bi++) {
        const prevX = bulletX[bi];
        const prevY = bulletY[bi];
        bulletX[bi] += bulletDirX[bi] * bulletSpeed[bi] * deltaTime;
        bulletY[bi] += bulletDirY[bi] * bulletSpeed[bi] * deltaTime;
        bulletAge[bi] += deltaTime;
        if (bulletCollisionDelay[bi] > 0) {
            bulletCollisionDelay[bi] = Math.max(0, bulletCollisionDelay[bi] - deltaTime);
        }

        if (bulletAge[bi] >= bulletDuration[bi]) {
            expiredBulletIndices.push(bi);
            continue;
        }

        if (bulletCollisionDelay[bi] > 0) continue;
        if (bulletPenetration[bi] < 0) continue;

        const ownerSide = bulletOwnerSide[bi] as CombatOwnerSide;
        const bx = bulletX[bi];
        const by = bulletY[bi];

        for (let mi = 0; mi < monsterIds.length; mi++) {
            const eid = monsterIds[mi];
            if (!isValidTarget(ownerSide, true)) continue;
            if (!segmentHitsCircle(prevX, prevY, bx, by, monsterX[mi], monsterY[mi], hitRadiusSq)) continue;
            hits.push({ bulletIndex: bi, targetEntityId: eid });
            bulletPenetration[bi]--;
            if (bulletPenetration[bi] < 0) {
                expiredBulletIndices.push(bi);
                break;
            }
        }

        if (bulletPenetration[bi] < 0) continue;
        if (!hasPlayer || !isValidTarget(ownerSide, false)) continue;

        if (!segmentHitsCircle(prevX, prevY, bx, by, playerX, playerY, hitRadiusSq)) continue;
        hits.push({ bulletIndex: bi, targetEntityId: playerEntityId });
        bulletPenetration[bi]--;
        if (bulletPenetration[bi] < 0) {
            expiredBulletIndices.push(bi);
        }
    }

    return { hits, expiredBulletIndices };
}

export function processCombatFrame(req: CombatWorkerComputeRequest): CombatWorkerComputeResponse {
    const { velX, velY } = computeMonsterVelocities(
        req.ai,
        req.elapsedTime,
        req.playerX,
        req.playerY,
        req.monsterIds,
        req.monsterX,
        req.monsterY,
    );

    const bulletX = new Float32Array(req.bulletX);
    const bulletY = new Float32Array(req.bulletY);
    const bulletAge = new Float32Array(req.bulletAge);
    const bulletCollisionDelay = new Float32Array(req.bulletCollisionDelay);
    const bulletPenetration = new Int32Array(req.bulletPenetration);

    const { hits, expiredBulletIndices } = stepBulletsAndHits(
        req.deltaTime,
        req.hitRadiusSq,
        bulletX,
        bulletY,
        req.bulletDirX,
        req.bulletDirY,
        req.bulletSpeed,
        bulletAge,
        req.bulletDuration,
        bulletPenetration,
        req.bulletOwnerSide,
        bulletCollisionDelay,
        req.monsterIds,
        req.monsterX,
        req.monsterY,
        req.playerEntityId,
        req.playerX,
        req.playerY,
    );

    return {
        frameId: req.frameId,
        monsterVelX: velX,
        monsterVelY: velY,
        bulletX,
        bulletY,
        bulletAge,
        bulletCollisionDelay,
        bulletPenetration,
        hits,
        expiredBulletIndices,
    };
}
