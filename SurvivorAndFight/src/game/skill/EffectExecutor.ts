import {
    DEFAULT_CHAIN_TARGET_COUNT,
    DEFAULT_SPLIT_COUNT,
    DEFAULT_SPLIT_REMAINING,
    EFFECT_TYPE_BULLET,
    EFFECT_TYPE_DIRECT_DAMAGE,
    EFFECT_TYPE_MODIFIER_CHAIN,
    EFFECT_TYPE_MODIFIER_PIERCE,
    EFFECT_TYPE_MODIFIER_SPLIT,
} from '../../defines';
import type { EntityId } from '../../ecs/core/EntityManager';
import type { EcsWorld } from '../../ecs/core/World';
import { Attribute } from '../../ecs/components/Attribute';
import { Position } from '../../ecs/components/TransformComponents';
import { PlayerTag } from '../../ecs/components/PlayerTag';
import { UpgradeState } from '../../ecs/components/UpgradeState';
import type { BulletSystem } from '../bullet/BulletSystem';
import type { AttributeSystem } from '../../ecs/systems/AttributeSystem';
import type { FilterRegistry } from '../../ecs/filters/FilterRegistry';
import { evaluate } from './FormulaParser';
import * as Targeting from './Targeting';
import type { BulletSpawnSpec, DirectDamageSpec, SkillCastPlan } from './CastPlan';
import { getEffectIconPath, getSkillIconPath } from './SkillLoadoutModel';

export type GetEffectRowFn = (effectId: string) => Record<string, unknown> | undefined;
export type GetBulletRowFn = (id: string) => Record<string, unknown> | undefined;

function num(row: Record<string, unknown>, key: string, fallback = 0): number {
    const v = Number(row[key]);
    return Number.isFinite(v) ? v : fallback;
}

function inferEffectType(effectId: string, row: Record<string, unknown>): string {
    const t = String(row.effect ?? '');
    if (t) return t;
    if (effectId.includes('split')) return EFFECT_TYPE_MODIFIER_SPLIT;
    if (effectId.includes('chain')) return EFFECT_TYPE_BULLET;
    if (effectId.includes('shot_') || effectId.includes('fx_shot')) return EFFECT_TYPE_BULLET;
    return EFFECT_TYPE_DIRECT_DAMAGE;
}

function inferChainCount(effectId: string, row: Record<string, unknown>): number {
    const c = num(row, 'chainCount', 0);
    if (c > 0) return Math.floor(c);
    if (String(row.effect) === EFFECT_TYPE_MODIFIER_CHAIN) return DEFAULT_CHAIN_TARGET_COUNT;
    if (effectId.includes('chain')) return DEFAULT_CHAIN_TARGET_COUNT;
    return 0;
}

function inferSplitCount(effectId: string, row: Record<string, unknown>): number {
    const c = num(row, 'splitCount', 0);
    if (c > 0) return Math.floor(c);
    if (String(row.effect) === EFFECT_TYPE_MODIFIER_SPLIT) return DEFAULT_SPLIT_COUNT;
    if (effectId.includes('split')) return DEFAULT_SPLIT_COUNT;
    return 0;
}

/** 按 Effect 槽顺序构建施放计划（分裂/连锁修饰下一条 bullet）。 */
export function buildSkillCastPlan(
    skillId: string,
    effectIds: string[],
    getEffectRow: GetEffectRowFn,
): SkillCastPlan | null {
    const plan: SkillCastPlan = { skillId, bullets: [], directDamages: [] };

    let pendingSplit = 0;
    let pendingChain = 0;
    let pendingPierce = 0;

    for (const effectId of effectIds) {
        const row = getEffectRow(effectId);
        if (!row || row.enabled === false) continue;

        const effectType = inferEffectType(effectId, row);

        if (effectType === EFFECT_TYPE_MODIFIER_SPLIT) {
            pendingSplit += Math.max(1, inferSplitCount(effectId, row));
            continue;
        }
        if (effectType === EFFECT_TYPE_MODIFIER_CHAIN) {
            pendingChain += Math.max(1, inferChainCount(effectId, row));
            continue;
        }
        if (effectType === EFFECT_TYPE_MODIFIER_PIERCE) {
            pendingPierce += Math.max(1, num(row, 'penetration', 1));
            continue;
        }

        if (effectType === EFFECT_TYPE_BULLET) {
            const bulletSlot = String(row.bulletSlot ?? 'player_bullet_fast_1');
            const splitCount = pendingSplit > 0 ? pendingSplit : inferSplitCount(effectId, row);
            const chainCount = pendingChain > 0 ? pendingChain : inferChainCount(effectId, row);
            const penetration = num(row, 'penetration', 0) + pendingPierce;

            const iconPath = getEffectIconPath(effectId) ?? getSkillIconPath(skillId);
            const spec: BulletSpawnSpec = {
                bulletSlot,
                iconPath,
                damageScale: 1,
                speedScale: 1,
                penetration,
                splitCount,
                splitRemaining: splitCount > 0 ? DEFAULT_SPLIT_REMAINING : 0,
                chainCount,
            };
            const dmg = num(row, 'damage', 0);
            if (dmg > 0) spec.damageOverride = dmg;

            plan.bullets.push(spec);
            pendingSplit = 0;
            pendingChain = 0;
            pendingPierce = 0;
            continue;
        }

        if (effectType === EFFECT_TYPE_DIRECT_DAMAGE) {
            plan.directDamages.push({
                effectId,
                paramsFormula: String(row.params ?? row.damage ?? '0'),
                targetType: String(row.target ?? 'auto'),
            });
        }
    }

    if (plan.bullets.length === 0 && plan.directDamages.length === 0) return null;
    return plan;
}

export interface ExecuteCastContext {
    world: EcsWorld;
    entity: EntityId;
    attrSystem: AttributeSystem;
    filters: FilterRegistry;
    bulletSystem: BulletSystem;
    getBulletRow: GetBulletRowFn;
    targetPos?: { x: number; y: number; z?: number };
}

/** 执行施放计划：生成子弹 + 直伤。 */
export function executeSkillCastPlan(plan: SkillCastPlan, ctx: ExecuteCastContext): void {
    const casterAttr = ctx.world.getComponent(ctx.entity, Attribute);
    const context: Record<string, number> = {};
    if (casterAttr) {
        for (const k of Object.keys(casterAttr.base)) {
            context[k] = ctx.attrSystem.getFinalValue(ctx.entity, k);
        }
    }

    const casterPos = ctx.world.getComponent(ctx.entity, Position);
    const ownerType = ctx.world.getComponent(ctx.entity, PlayerTag) ? 'player' : 'monster';
    const candidates = ownerType === 'player'
        ? ctx.filters.getNamedFilter('Monsters')
        : ctx.filters.getNamedFilter('Players');

    const upgrade = ctx.world.getComponent(ctx.entity, UpgradeState);
    const damageScaleBase = ownerType === 'player' ? (upgrade?.bulletDamageMultiplier ?? 1) : 1;

    for (const spec of plan.bullets) {
        const row = ctx.getBulletRow(spec.bulletSlot);
        if (!row) continue;

        const pos = casterPos
            ? { x: casterPos.x, y: casterPos.y, z: 0 }
            : { x: 0, y: 0, z: 0 };

        const targetType = 'auto';
        let targetId: EntityId | null = null;
        const castTargetPos = ctx.targetPos ?? { x: 0, y: 0 };
        if (targetType === 'auto') {
            targetId = Targeting.resolveAuto(ctx.entity, candidates, ctx.world, ctx.attrSystem);
        }

        let dir = { x: 1, y: 0, z: 0 };
        if (targetId != null) {
            const tPos = ctx.world.getComponent(targetId, Position);
            if (tPos && casterPos) {
                dir = {
                    x: tPos.x - casterPos.x,
                    y: (tPos.y ?? 0) - (casterPos.y ?? 0),
                    z: 0,
                };
            }
        } else if (castTargetPos) {
            dir = {
                x: castTargetPos.x - pos.x,
                y: (castTargetPos.y ?? 0) - pos.y,
                z: 0,
            };
        }

        const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y) || 1;
        dir = { x: dir.x / len, y: dir.y / len, z: 0 };

        const splitCount = spec.splitCount;
        const splitRemaining = splitCount > 0
            ? Math.max(spec.splitRemaining, DEFAULT_SPLIT_REMAINING)
            : 0;

        ctx.bulletSystem.spawnBulletWithOptions(spec.bulletSlot, pos, dir, ownerType, {
            damageScale: damageScaleBase,
            speedScale: spec.speedScale,
            penetration: spec.penetration,
            splitCount,
            splitRemaining,
            chainCount: spec.chainCount,
            damageOverride: spec.damageOverride,
            iconPath: spec.iconPath,
        });
    }

    for (const dmg of plan.directDamages) {
        let targetId: EntityId | null = null;
        const castTargetPos = ctx.targetPos ?? { x: 0, y: 0 };
        if (dmg.targetType === 'auto') {
            targetId = Targeting.resolveAuto(ctx.entity, candidates, ctx.world, ctx.attrSystem);
        } else if (dmg.targetType === 'simple') {
            targetId = Targeting.resolveSimple(ctx.entity, castTargetPos, ctx.world);
        }
        if (targetId == null) continue;
        const value = evaluate(dmg.paramsFormula, context);
        const targetAttr = ctx.world.getComponent(targetId, Attribute);
        if (targetAttr && typeof targetAttr.base.hp === 'number') {
            targetAttr.base.hp = Math.max(0, targetAttr.base.hp - value);
        }
    }
}
