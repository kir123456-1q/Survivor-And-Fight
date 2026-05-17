"use strict";
(() => {
  // src/game/combat/combatWorkerProtocol.ts
  var COMBAT_WORKER_MSG_COMPUTE = "compute";
  var COMBAT_WORKER_MSG_READY = "ready";

  // src/game/combat/combatWorkerLogic.ts
  function monsterPhase(entityId) {
    return entityId * 0.73;
  }
  function computeMonsterVelocities(ai, elapsedTime, playerX, playerY, monsterIds, monsterX, monsterY) {
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
      let chaseX;
      let chaseY;
      if (len < 1e-5) {
        const phase = monsterPhase(id);
        chaseX = Math.cos(phase) * ai.chaseSpeed * 0.25;
        chaseY = Math.sin(phase) * ai.chaseSpeed * 0.25;
      } else {
        const baseX = dx / len;
        const baseY = dy / len;
        const swayRad = ai.swayDegree * Math.PI / 180 * Math.sin(elapsedTime * ai.swayFreq + monsterPhase(id));
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
        sepX += sdx / dist * weight;
        sepY += sdy / dist * weight;
      }
      velX[i] = chaseX * ai.chaseSpeed + sepX * ai.separationForce;
      velY[i] = chaseY * ai.chaseSpeed + sepY * ai.separationForce;
    }
    return { velX, velY };
  }
  function isValidTarget(ownerSide, targetIsMonster) {
    if (ownerSide === 0) return targetIsMonster;
    return !targetIsMonster;
  }
  function stepBulletsAndHits(deltaTime, hitRadiusSq, bulletX, bulletY, bulletDirX, bulletDirY, bulletSpeed, bulletAge, bulletDuration, bulletPenetration, bulletOwnerSide, bulletCollisionDelay, monsterIds, monsterX, monsterY, playerEntityId, playerX, playerY) {
    const hits = [];
    const expiredBulletIndices = [];
    const bulletCount = bulletX.length;
    const hasPlayer = playerEntityId > 0;
    for (let bi = 0; bi < bulletCount; bi++) {
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
      const ownerSide = bulletOwnerSide[bi];
      const bx = bulletX[bi];
      const by = bulletY[bi];
      for (let mi = 0; mi < monsterIds.length; mi++) {
        const eid = monsterIds[mi];
        if (!isValidTarget(ownerSide, true)) continue;
        const dx2 = bx - monsterX[mi];
        const dy2 = by - monsterY[mi];
        if (dx2 * dx2 + dy2 * dy2 < hitRadiusSq) {
          hits.push({ bulletIndex: bi, targetEntityId: eid });
          bulletPenetration[bi]--;
          if (bulletPenetration[bi] < 0) {
            expiredBulletIndices.push(bi);
            break;
          }
        }
      }
      if (bulletPenetration[bi] < 0) continue;
      if (!hasPlayer || !isValidTarget(ownerSide, false)) continue;
      const dx = bx - playerX;
      const dy = by - playerY;
      if (dx * dx + dy * dy < hitRadiusSq) {
        hits.push({ bulletIndex: bi, targetEntityId: playerEntityId });
        bulletPenetration[bi]--;
        if (bulletPenetration[bi] < 0) {
          expiredBulletIndices.push(bi);
        }
      }
    }
    return { hits, expiredBulletIndices };
  }
  function processCombatFrame(req) {
    const { velX, velY } = computeMonsterVelocities(
      req.ai,
      req.elapsedTime,
      req.playerX,
      req.playerY,
      req.monsterIds,
      req.monsterX,
      req.monsterY
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
      req.playerY
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
      expiredBulletIndices
    };
  }

  // src/game/combat/combat.worker.ts
  var ctx = self;
  ctx.onmessage = (event) => {
    const msg = event.data;
    if (msg.type !== COMBAT_WORKER_MSG_COMPUTE) return;
    const result = processCombatFrame(msg);
    const outbound = result;
    ctx.postMessage(outbound);
  };
  var ready = { type: COMBAT_WORKER_MSG_READY };
  ctx.postMessage(ready);
})();
