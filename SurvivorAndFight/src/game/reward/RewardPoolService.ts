import { Data } from '../../config/Data';
import { REWARD_HEAL_MAX_HP_RATIO } from '../../defines';
import { getEffectIconPath, getSkillIconPath } from '../skill/SkillLoadoutModel';
import type { RewardKind, RewardOption, RewardPoolContext } from './RewardTypes';

const ALL_KINDS: RewardKind[] = ['heal', 'effect', 'skill', 'strengthen'];

function shuffle<T>(items: T[]): T[] {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function pickOne<T>(pool: T[]): T | null {
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
}

function upgradeEffectRows(): Array<Record<string, unknown>> {
    const rows = Data?.UpgradeEffect?.GetAll?.() as Array<Record<string, unknown>> | undefined;
    if (!rows?.length) {
        return [
            { id: 'u_fire_1', effectType: 'fire_rate', tier: 1, rarity: 'common', value: 0.12, name: '攻速强化' },
            { id: 'u_dmg_1', effectType: 'damage', tier: 1, rarity: 'common', value: 0.12, name: '伤害强化' },
            { id: 'u_ms_1', effectType: 'multi_shot', tier: 1, rarity: 'common', value: 1, name: '多重射击' },
        ];
    }
    return rows;
}

function skillPool(): string[] {
    const all = (Data?.Skill?.GetAll?.() ?? []) as Array<Record<string, unknown>>;
    return all
        .map((r) => String(r.id))
        .filter((id) => id.length > 0 && id !== 'player_auto_shot');
}

function effectPool(): string[] {
    const all = (Data?.SkillEffect?.GetAll?.() ?? []) as Array<Record<string, unknown>>;
    return all
        .filter((r) => {
            const id = String(r.id ?? '');
            return id.length > 0 && id !== 'player_auto_shot_effect_1' && r.enabled !== false;
        })
        .map((r) => String(r.id));
}

function buildHealOption(): RewardOption {
    const pct = Math.round(REWARD_HEAL_MAX_HP_RATIO * 100);
    return {
        kind: 'heal',
        title: '篝火休整',
        description: `恢复 ${pct}% 最大生命`,
    };
}

function buildEffectOption(effectId: string): RewardOption {
    const row = Data?.SkillEffect?.GetByID?.(effectId) as Record<string, unknown> | undefined;
    const name = String(row?.name ?? effectId);
    return {
        kind: 'effect',
        id: effectId,
        title: name,
        description: '获得新 Effect',
        iconPath: getEffectIconPath(effectId),
    };
}

function buildSkillOption(skillId: string): RewardOption {
    const row = Data?.Skill?.GetByID?.(skillId) as Record<string, unknown> | undefined;
    const name = String(row?.name ?? skillId);
    return {
        kind: 'skill',
        id: skillId,
        title: name,
        description: '获得新技能',
        iconPath: getSkillIconPath(skillId),
    };
}

function buildStrengthenOption(row: Record<string, unknown>): RewardOption {
    const name = String(row.name ?? row.effectType ?? row.id ?? '属性强化');
    const tier = Number(row.tier) || 1;
    return {
        kind: 'strengthen',
        id: String(row.id),
        title: String(name),
        description: `强化 Lv.${tier}`,
    };
}

function rollKind(context: RewardPoolContext): RewardKind {
    if (context === 'rest') return 'heal';
    if (context === 'combat') return 'effect';
    if (context === 'boss') return 'skill';
    return pickOne(ALL_KINDS) ?? 'heal';
}

function buildOptionForKind(kind: RewardKind, ownedSkills: Set<string>, ownedEffects: Set<string>): RewardOption | null {
    if (kind === 'heal') return buildHealOption();

    if (kind === 'effect') {
        const pool = effectPool().filter((id) => !ownedEffects.has(id));
        const id = pickOne(pool.length > 0 ? pool : effectPool());
        return id ? buildEffectOption(id) : null;
    }

    if (kind === 'skill') {
        const pool = skillPool().filter((id) => !ownedSkills.has(id));
        const id = pickOne(pool.length > 0 ? pool : skillPool());
        return id ? buildSkillOption(id) : null;
    }

    const row = pickOne(upgradeEffectRows());
    return row ? buildStrengthenOption(row) : null;
}

function requiredKind(context: RewardPoolContext): RewardKind | null {
    if (context === 'rest') return 'heal';
    if (context === 'combat') return 'effect';
    if (context === 'boss') return 'skill';
    return null;
}

/**
 * 生成三选一奖励；rest/combat/boss 保证对应类型至少出现一次，unknown 全随机。
 */
export function rollRewardOptions(
    context: RewardPoolContext,
    ownedSkills: Set<string> = new Set(),
    ownedEffects: Set<string> = new Set(),
): RewardOption[] {
    const required = requiredKind(context);
    const options: RewardOption[] = [];

    if (required) {
        const forced = buildOptionForKind(required, ownedSkills, ownedEffects);
        if (forced) options.push(forced);
    }

    const fillerKinds =
        context === 'unknown'
            ? shuffle([...ALL_KINDS, ...ALL_KINDS])
            : shuffle(ALL_KINDS.filter((k) => k !== required));

    let guard = 0;
    while (options.length < 3 && guard++ < 40) {
        const kind =
            context === 'unknown'
                ? (pickOne(ALL_KINDS) ?? 'heal')
                : fillerKinds[(options.length + guard) % fillerKinds.length];
        const opt = buildOptionForKind(kind, ownedSkills, ownedEffects);
        if (!opt) continue;
        const dup = options.some((o) => o.kind === opt.kind && o.id === opt.id && o.title === opt.title);
        if (dup) continue;
        options.push(opt);
    }

    while (options.length < 3) {
        const opt = buildOptionForKind(rollKind(context), ownedSkills, ownedEffects);
        if (opt) options.push(opt);
        else break;
    }

    return options.slice(0, 3);
}
