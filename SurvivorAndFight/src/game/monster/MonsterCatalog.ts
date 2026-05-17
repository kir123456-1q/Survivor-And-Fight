import { Data } from '../../config/Data';
import { buildMonsterIconPath } from '../../defines';

export type MonsterAttackType = 'melee' | 'ranged';

export interface MonsterRow {
    id: string;
    name: string;
    iconPath: string;
    tier: number;
    attackType: MonsterAttackType;
    hp: number;
    maxHp: number;
    chaseSpeedScale: number;
    contactDps: number;
    skillId: string;
    spawnWeight: number;
    enabled: boolean;
}

function row(id: string): Record<string, unknown> | undefined {
    return Data?.Monster?.GetByID?.(id) as Record<string, unknown> | undefined;
}

export function getMonsterRow(monsterId: string): MonsterRow | undefined {
    const r = row(monsterId);
    if (!r || r.enabled === false) return undefined;
    const attack = String(r.attackType ?? 'melee');
    return {
        id: String(r.id),
        name: String(r.name ?? r.id),
        iconPath: String(r.iconPath ?? buildMonsterIconPath(monsterId)),
        tier: Number(r.tier) || 1,
        attackType: attack === 'ranged' ? 'ranged' : 'melee',
        hp: Number(r.hp) || 40,
        maxHp: Number(r.maxHp) || 40,
        chaseSpeedScale: Number(r.chaseSpeedScale) || 1,
        contactDps: Number(r.contactDps) || 15,
        skillId: String(r.skillId ?? ''),
        spawnWeight: Number(r.spawnWeight) || 1,
        enabled: r.enabled !== false,
    };
}

export function getMonsterIconPath(monsterId: string): string | undefined {
    const r = getMonsterRow(monsterId);
    return r?.iconPath;
}

/** 按玩家等级与难度 tier 加权随机选怪（不含校准格）。 */
export function pickMonsterIdForWave(playerLevel: number): string | undefined {
    const all = (Data?.Monster?.GetAll?.() ?? []) as Array<Record<string, unknown>>;
    const maxTier = playerLevel <= 1 ? 1 : playerLevel <= 3 ? 2 : playerLevel <= 5 ? 3 : 4;
    const pool = all.filter((r) => {
        if (r.enabled === false) return false;
        const tier = Number(r.tier) || 1;
        if (tier > maxTier) return false;
        if (tier >= 4 && playerLevel < 5 && Math.random() > 0.15) return false;
        return true;
    });
    if (pool.length === 0) return undefined;

    let total = 0;
    const weights: number[] = [];
    for (const r of pool) {
        const w = Number(r.spawnWeight) || 1;
        weights.push(w);
        total += w;
    }
    let roll = Math.random() * total;
    for (let i = 0; i < pool.length; i++) {
        roll -= weights[i];
        if (roll <= 0) return String(pool[i].id);
    }
    return String(pool[pool.length - 1].id);
}
