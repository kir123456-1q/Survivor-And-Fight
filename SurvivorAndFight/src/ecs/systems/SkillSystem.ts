import type { EntityId } from '../core/EntityManager';
import type { EcsWorld } from '../core/World';
import { System } from '../core/System';
import { Skill } from '../components/Skill';
import { Attribute } from '../components/Attribute';
import { Position } from '../components/TransformComponents';
import { PlayerTag } from '../components/PlayerTag';
import type { AttributeSystem } from './AttributeSystem';
import type { FilterRegistry } from '../filters/FilterRegistry';
import type { BulletSystem } from '../../game/bullet/BulletSystem';
import { evaluate } from '../../game/skill/FormulaParser';
import * as Targeting from '../../game/skill/Targeting';

export type GetSkillEffectsFn = (skillId: string) => string[] | undefined;
export type GetEffectRowFn = (effectId: string) => Record<string, unknown> | undefined;

/**
 * SkillSystem：处理 pendingCast、执行 effect 列表、扣 CD。
 * 若 effect 配置 bulletSlot 且注入了 bulletSystem、getBulletRow，则生成子弹（伤害由子弹表决定）；否则按 effect 类型结算（如 damage 公式）。
 */
export class SkillSystem implements System {
    readonly group = 'logic' as const;
    readonly priority = 0;

    constructor(
        private readonly world: EcsWorld,
        private readonly attrSystem: AttributeSystem,
        private readonly filters: FilterRegistry,
        private readonly getSkillEffects?: GetSkillEffectsFn,
        private readonly getEffectRow?: GetEffectRowFn,
        private readonly bulletSystem?: BulletSystem,
        private readonly getBulletRow?: (id: string) => Record<string, unknown> | undefined,
    ) {}

    update(deltaTime: number): void {
        const pairs = this.world.getAllOfType(Skill);
        for (const [entity, skill] of pairs) {
            for (const skillId of Object.keys(skill.cooldownRemain)) {
                const remain = skill.cooldownRemain[skillId] - deltaTime;
                skill.cooldownRemain[skillId] = remain <= 0 ? 0 : remain;
            }
            if (!skill.pendingCast) continue;
            const { skillId, targetPos } = skill.pendingCast;
            if ((skill.cooldownRemain[skillId] ?? 0) > 0) {
                skill.pendingCast = null;
                continue;
            }
            skill.pendingCast = null;
            const effectIds = this.getSkillEffects?.(skillId);
            if (!effectIds?.length || !this.getEffectRow) continue;
            const casterAttr = this.world.getComponent(entity, Attribute);
            const context: Record<string, number> = {};
            if (casterAttr) {
                for (const k of Object.keys(casterAttr.base)) {
                    context[k] = this.attrSystem.getFinalValue(entity, k);
                }
            }
            const candidates = this.filters.getNamedFilter('Monsters').length > 0
                ? this.filters.getNamedFilter('Monsters')
                : this.filters.query([Attribute]);
            const casterPos = this.world.getComponent(entity, Position);
            const ownerType = this.world.getComponent(entity, PlayerTag) ? 'player' : 'monster';
            for (const eid of effectIds) {
                const row = this.getEffectRow(eid);
                if (!row) continue;
                const bulletSlot = row.bulletSlot as string | undefined;
                if (bulletSlot && this.bulletSystem && this.getBulletRow) {
                    const pos = casterPos
                        ? { x: casterPos.x, y: casterPos.y, z: 0 }
                        : { x: 0, y: 0, z: 0 };
                    const targetType = (row.target as string) ?? 'simple';
                    const castTargetPos = targetPos ?? { x: 0, y: 0 };
                    let targetId: EntityId | null = null;
                    if (targetType === 'auto') {
                        targetId = Targeting.resolveAuto(entity, candidates, this.world, this.attrSystem);
                    } else if (targetType === 'simple') {
                        targetId = Targeting.resolveSimple(entity, castTargetPos, this.world);
                    }
                    let dir = { x: 1, y: 0, z: 0 };
                    if (targetId != null) {
                        const tPos = this.world.getComponent(targetId, Position);
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
                    this.bulletSystem.spawnBullet(bulletSlot, pos, dir, ownerType);
                    continue;
                }
                const effectType = row.effect as string;
                const paramsFormula = (row.params as string) ?? '0';
                const targetType = (row.target as string) ?? 'auto';
                let targetId: EntityId | null = null;
                const castTargetPos = targetPos ?? { x: 0, y: 0 };
                if (targetType === 'auto') {
                    targetId = Targeting.resolveAuto(entity, candidates, this.world, this.attrSystem);
                } else if (targetType === 'simple') {
                    targetId = Targeting.resolveSimple(entity, castTargetPos, this.world);
                }
                if (effectType === 'damage' && targetId != null) {
                    const value = evaluate(paramsFormula, context);
                    const targetAttr = this.world.getComponent(targetId, Attribute);
                    if (targetAttr && typeof targetAttr.base.hp === 'number') {
                        targetAttr.base.hp = Math.max(0, targetAttr.base.hp - value);
                    }
                }
            }
            skill.cooldownRemain[skillId] = 1;
        }
    }
}
