import { System } from '../core/System';
import type { EcsWorld } from '../core/World';
import type { FilterRegistry } from '../filters/FilterRegistry';
import { Experience } from '../components/Experience';
import { UpgradeState } from '../components/UpgradeState';

type RarityKey = 'common' | 'rare' | 'epic';

interface RarityRow {
    rarity: RarityKey;
    baseWeight: number;
    levelFactor: number;
}

interface EffectRow {
    id: string;
    effectType: string;
    tier: number;
    rarity: RarityKey;
    value: number;
}

/**
 * On each level-up reward roll, choose one upgrade entry by rarity+level weights
 * and apply it to player UpgradeState.
 */
export class UpgradeRewardSystem implements System {
    readonly group = 'logic' as const;
    readonly priority = -9;

    constructor(
        private readonly world: EcsWorld,
        private readonly filters: FilterRegistry,
        private readonly getRarityRows: () => RarityRow[],
        private readonly getEffectRows: () => EffectRow[],
    ) {}

    update(_deltaTime: number): void {
        const players = this.filters.getNamedFilter('Players');
        if (players.length === 0) return;
        const player = players[0];
        const xp = this.world.getComponent(player, Experience);
        const upgrade = this.world.getComponent(player, UpgradeState);
        if (!xp || !upgrade) return;
        if (xp.pendingRewardRolls <= 0) return;

        while (xp.pendingRewardRolls > 0) {
            const rolled = this.rollOneUpgrade(xp.level, upgrade);
            if (!rolled) break;
            this.applyUpgrade(upgrade, rolled);
            xp.pendingRewardRolls -= 1;
            console.log('[Upgrade] granted', {
                effectType: rolled.effectType,
                tier: rolled.tier,
                rarity: rolled.rarity,
                value: rolled.value,
                level: xp.level,
            });
        }
    }

    private rollOneUpgrade(level: number, upgrade: UpgradeState): EffectRow | null {
        const rarityRows = this.getRarityRows();
        const effects = this.getEffectRows();
        if (rarityRows.length === 0 || effects.length === 0) return null;

        const candidates = effects.filter((row) => {
            const currentTier = upgrade.tiers[row.effectType] ?? 0;
            return row.tier === currentTier + 1 && row.tier <= 3;
        });
        if (candidates.length === 0) return null;

        const rarityWeight = new Map<RarityKey, number>();
        for (const r of rarityRows) {
            rarityWeight.set(r.rarity, Math.max(0, r.baseWeight + level * r.levelFactor));
        }

        const weighted: Array<{ row: EffectRow; w: number }> = candidates.map((row) => ({
            row,
            w: Math.max(0.0001, rarityWeight.get(row.rarity) ?? 0.0001),
        }));
        const total = weighted.reduce((s, x) => s + x.w, 0);
        if (total <= 0) return weighted[0].row;
        let r = Math.random() * total;
        for (const item of weighted) {
            r -= item.w;
            if (r <= 0) return item.row;
        }
        return weighted[weighted.length - 1].row;
    }

    private applyUpgrade(upgrade: UpgradeState, row: EffectRow): void {
        upgrade.tiers[row.effectType] = row.tier;
        if (row.effectType === 'fire_rate') {
            upgrade.fireRateMultiplier *= 1 + row.value;
        } else if (row.effectType === 'damage') {
            upgrade.bulletDamageMultiplier *= 1 + row.value;
        } else if (row.effectType === 'multi_shot') {
            upgrade.multiShotExtra += Math.max(0, Math.round(row.value));
        } else if (row.effectType === 'on_hit_spawn') {
            upgrade.onHitSpawnCount += Math.max(0, Math.round(row.value));
        }
    }
}
