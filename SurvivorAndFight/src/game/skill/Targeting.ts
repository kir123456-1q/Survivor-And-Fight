import type { EntityId } from '../../ecs/core/EntityManager';
import type { EcsWorld } from '../../ecs/core/World';
import { Attribute } from '../../ecs/components/Attribute';
import { Position } from '../../ecs/components/TransformComponents';

/**
 * 索敌。resolveAuto：按威胁度与血量加权，优先低血高威胁；
 * resolveSimple：以 targetWorldPos 为目标的最近实体。
 */
export function resolveAuto(
    _casterEntityId: EntityId,
    candidates: EntityId[],
    world: EcsWorld,
    attrSystem: { getFinalValue(e: EntityId, k: string): number },
): EntityId | null {
    if (candidates.length === 0) return null;
    let best: EntityId | null = null;
    let bestScore = -Infinity;
    for (const eid of candidates) {
        const hp = attrSystem.getFinalValue(eid, 'hp');
        const maxHp = Math.max(1, attrSystem.getFinalValue(eid, 'maxHp'));
        const threat = attrSystem.getFinalValue(eid, 'threat');
        const hpRatio = maxHp > 0 ? hp / maxHp : 1;
        const score = (1 - hpRatio) * 2 + (threat || 0);
        if (score > bestScore) {
            bestScore = score;
            best = eid;
        }
    }
    return best;
}

export function resolveSimple(
    casterEntityId: EntityId,
    targetWorldPos: { x: number; y: number; z?: number },
    world: EcsWorld,
): EntityId | null {
    const casterPos = world.getComponent(casterEntityId, Position);
    if (!casterPos) return null;
    const tx = targetWorldPos.x;
    const ty = targetWorldPos.y ?? 0;
    let best: EntityId | null = null;
    let bestDistSq = Infinity;
    const pairs = world.getAllOfType(Position);
    for (const [eid, pos] of pairs) {
        if (eid === casterEntityId) continue;
        const dx = pos.x - tx;
        const dy = (pos.y ?? 0) - ty;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestDistSq) {
            bestDistSq = d2;
            best = eid;
        }
    }
    return best;
}
