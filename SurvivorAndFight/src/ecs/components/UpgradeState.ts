/**
 * Runtime-applied progression upgrades.
 */
export class UpgradeState {
    /** attack speed multiplier for auto shooting (cooldown divisor) */
    fireRateMultiplier = 1;
    /** bullet damage multiplier */
    bulletDamageMultiplier = 1;
    /** additional bullets per cast */
    multiShotExtra = 0;
    /** extra bullets spawned on hit (radial) */
    onHitSpawnCount = 0;

    /** per-effect acquired tier [0..3] */
    tiers: Record<string, number> = {
        fire_rate: 0,
        damage: 0,
        multi_shot: 0,
        on_hit_spawn: 0,
    };
}
