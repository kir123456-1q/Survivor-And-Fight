import type { EcsWorld } from '../../ecs/core/World';
import { Attribute } from '../../ecs/components/Attribute';
import { SkillLoadoutState } from '../../ecs/components/SkillLoadoutState';
import { UpgradeState } from '../../ecs/components/UpgradeState';
import { Data } from '../../config/Data';
import { REWARD_HEAL_MAX_HP_RATIO } from '../../defines';
import { MetaRunSession } from '../meta/MetaRunSession';
import type { RewardOption } from './RewardTypes';

function firstEmptySlot(slots: string[]): number {
    const idx = slots.findIndex((v) => !v || v.length === 0);
    return idx >= 0 ? idx : -1;
}

function applyUpgradeRow(upgrade: UpgradeState, row: Record<string, unknown>): void {
    const effectType = String(row.effectType);
    const tier = Number(row.tier) || 1;
    const value = Number(row.value) || 0;
    upgrade.tiers[effectType] = tier;
    if (effectType === 'fire_rate') {
        upgrade.fireRateMultiplier *= 1 + value;
    } else if (effectType === 'damage') {
        upgrade.bulletDamageMultiplier *= 1 + value;
    } else if (effectType === 'multi_shot') {
        upgrade.multiShotExtra += Math.max(0, Math.round(value));
    } else if (effectType === 'on_hit_spawn') {
        upgrade.onHitSpawnCount += Math.max(0, Math.round(value));
    }
}

export class RewardApplyService {
    static apply(option: RewardOption, world: EcsWorld | null, playerEntity: number): void {
        if (world && playerEntity >= 0) {
            RewardApplyService.applyToEcs(option, world, playerEntity);
            return;
        }
        RewardApplyService.applyToRunSession(option);
    }

    private static applyToEcs(option: RewardOption, world: EcsWorld, playerEntity: number): void {
        switch (option.kind) {
            case 'heal': {
                const attr = world.getComponent(playerEntity, Attribute);
                if (!attr || typeof attr.base.maxHp !== 'number') return;
                const heal = Math.max(1, Math.round(attr.base.maxHp * REWARD_HEAL_MAX_HP_RATIO));
                attr.base.hp = Math.min(attr.base.maxHp, attr.base.hp + heal);
                break;
            }
            case 'effect': {
                if (!option.id) return;
                const loadout = world.getComponent(playerEntity, SkillLoadoutState);
                if (!loadout) return;
                const slot = firstEmptySlot(loadout.unequippedEffectIds);
                if (slot < 0) return;
                loadout.unequippedEffectIds[slot] = option.id;
                loadout.dirty = true;
                break;
            }
            case 'skill': {
                if (!option.id) return;
                const loadout = world.getComponent(playerEntity, SkillLoadoutState);
                if (!loadout) return;
                const slot = firstEmptySlot(loadout.ownedSkillIds);
                if (slot < 0) return;
                loadout.ownedSkillIds[slot] = option.id;
                loadout.dirty = true;
                break;
            }
            case 'strengthen': {
                const upgrade = world.getComponent(playerEntity, UpgradeState);
                if (!upgrade || !option.id) return;
                const row = Data?.UpgradeEffect?.GetByID?.(option.id) as Record<string, unknown> | undefined;
                if (row) applyUpgradeRow(upgrade, row);
                break;
            }
            default:
                break;
        }
    }

    private static applyToRunSession(option: RewardOption): void {
        switch (option.kind) {
            case 'heal':
                MetaRunSession.pendingHealRatio = REWARD_HEAL_MAX_HP_RATIO;
                break;
            case 'effect':
                if (option.id) MetaRunSession.pendingEffectIds.push(option.id);
                break;
            case 'skill':
                if (option.id) MetaRunSession.pendingSkillIds.push(option.id);
                break;
            case 'strengthen':
                if (option.id) MetaRunSession.pendingUpgradeIds.push(option.id);
                break;
            default:
                break;
        }
    }

    /** 进入战斗后把跑图阶段累积的奖励落到玩家实体。 */
    static flushRunSessionToEcs(world: EcsWorld, playerEntity: number): void {
        if (MetaRunSession.pendingHealRatio > 0) {
            RewardApplyService.apply(
                {
                    kind: 'heal',
                    title: '',
                    description: '',
                },
                world,
                playerEntity,
            );
            MetaRunSession.pendingHealRatio = 0;
        }
        for (const id of MetaRunSession.pendingEffectIds.splice(0)) {
            RewardApplyService.apply(
                { kind: 'effect', id, title: '', description: '' },
                world,
                playerEntity,
            );
        }
        for (const id of MetaRunSession.pendingSkillIds.splice(0)) {
            RewardApplyService.apply(
                { kind: 'skill', id, title: '', description: '' },
                world,
                playerEntity,
            );
        }
        for (const id of MetaRunSession.pendingUpgradeIds.splice(0)) {
            RewardApplyService.apply(
                { kind: 'strengthen', id, title: '', description: '' },
                world,
                playerEntity,
            );
        }
    }
}
