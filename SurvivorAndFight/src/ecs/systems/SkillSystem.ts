import type { EntityId } from '../core/EntityManager';
import type { EcsWorld } from '../core/World';
import { System } from '../core/System';
import { Skill } from '../components/Skill';
import { PlayerTag } from '../components/PlayerTag';
import { UpgradeState } from '../components/UpgradeState';
import type { AttributeSystem } from './AttributeSystem';
import type { FilterRegistry } from '../filters/FilterRegistry';
import type { BulletSystem } from '../../game/bullet/BulletSystem';
import {
    buildSkillCastPlan,
    executeSkillCastPlan,
    type GetEffectRowFn,
} from '../../game/skill/EffectExecutor';

export type GetSkillEffectsFn = (entity: EntityId, skillId: string) => string[] | undefined;
export type GetSkillCooldownFn = (skillId: string) => number | undefined;
export type GetBulletRowFn = (id: string) => Record<string, unknown> | undefined;

/**
 * SkillSystem：处理 pendingCasts 队列，经 EffectExecutor 执行装配 Effect 链。
 */
export class SkillSystem implements System {
    readonly group = 'logic' as const;
    readonly priority = 0;

    constructor(
        private readonly world: EcsWorld,
        private readonly attrSystem: AttributeSystem,
        private readonly filters: FilterRegistry,
        private readonly getSkillEffects?: GetSkillEffectsFn,
        private readonly getSkillCooldown?: GetSkillCooldownFn,
        private readonly getEffectRow?: GetEffectRowFn,
        private readonly bulletSystem?: BulletSystem,
        private readonly getBulletRow?: GetBulletRowFn,
        private readonly isPaused?: () => boolean,
    ) {}

    update(deltaTime: number): void {
        if (this.isPaused?.()) return;
        const pairs = this.world.getAllOfType(Skill);
        for (const [entity, skill] of pairs) {
            for (const skillId of Object.keys(skill.cooldownRemain)) {
                const remain = skill.cooldownRemain[skillId] - deltaTime;
                skill.cooldownRemain[skillId] = remain <= 0 ? 0 : remain;
            }

            if (skill.pendingCasts.length === 0) continue;
            if (!this.getSkillEffects || !this.getEffectRow || !this.bulletSystem || !this.getBulletRow) {
                skill.pendingCasts.length = 0;
                continue;
            }

            const queue = [...skill.pendingCasts];
            skill.pendingCasts.length = 0;

            for (const request of queue) {
                const { skillId, targetPos } = request;
                if ((skill.cooldownRemain[skillId] ?? 0) > 0) continue;

                const effectIds = this.getSkillEffects(entity, skillId);
                if (!effectIds?.length) continue;

                const plan = buildSkillCastPlan(skillId, effectIds, this.getEffectRow);
                if (!plan) continue;

                executeSkillCastPlan(plan, {
                    world: this.world,
                    entity,
                    attrSystem: this.attrSystem,
                    filters: this.filters,
                    bulletSystem: this.bulletSystem,
                    getBulletRow: this.getBulletRow,
                    targetPos,
                });

                const cooldownSec = this.getSkillCooldown?.(skillId) ?? 1;
                const upgrade = this.world.getComponent(entity, UpgradeState);
                const fireRateMul = this.world.getComponent(entity, PlayerTag)
                    ? Math.max(0.1, upgrade?.fireRateMultiplier ?? 1)
                    : 1;
                skill.cooldownRemain[skillId] = Math.max(0, cooldownSec / fireRateMul);
            }
        }
    }
}
