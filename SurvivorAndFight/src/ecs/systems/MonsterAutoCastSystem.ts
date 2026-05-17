import type { EcsWorld } from '../core/World';
import { System } from '../core/System';
import type { FilterRegistry } from '../filters/FilterRegistry';
import { Skill } from '../components/Skill';
import { MonsterDef } from '../components/MonsterDef';
import { Position } from '../components/TransformComponents';
import { PlayerTag } from '../components/PlayerTag';
import { MONSTER_ATTACK_RANGE, MONSTER_CAST_STAGGER_SEC, MONSTER_MELEE_SKILL_RANGE } from '../../defines';
import { getMonsterRow } from '../../game/monster/MonsterCatalog';

/**
 * 怪物自动施法：近战在贴近时直伤，远程在射程内发射子弹；同帧错开入队。
 */
export class MonsterAutoCastSystem implements System {
    readonly group = 'logic' as const;
    readonly priority = 5;

    private castCursor = 0;

    constructor(
        private readonly world: EcsWorld,
        private readonly filters: FilterRegistry,
        private readonly isPaused?: () => boolean,
    ) {}

    update(_deltaTime: number): void {
        if (this.isPaused?.()) return;
        const players = this.filters.getNamedFilter('Players');
        if (players.length === 0) return;
        const playerPos = this.world.getComponent(players[0], Position);
        if (!playerPos) return;

        const monsters = this.filters.getNamedFilter('Monsters');
        if (monsters.length === 0) return;

        const start = this.castCursor % monsters.length;
        for (let k = 0; k < monsters.length; k++) {
            const idx = (start + k) % monsters.length;
            const entity = monsters[idx];
            if (this.tryQueueCast(entity, playerPos, players[0])) {
                this.castCursor = (idx + 1) % monsters.length;
                return;
            }
        }
    }

    private tryQueueCast(
        entity: number,
        playerPos: Position,
        playerEntity: number,
    ): boolean {
        const skill = this.world.getComponent(entity, Skill);
        const def = this.world.getComponent(entity, MonsterDef);
        if (!skill || !def?.skillId) return false;

        const row = getMonsterRow(def.monsterId);
        const skillId = row?.skillId ?? def.skillId;
        if (!skillId) return false;

        if ((skill.cooldownRemain[skillId] ?? 0) > 0) return false;
        if (skill.pendingCasts.some((p) => p.skillId === skillId)) return false;

        const mPos = this.world.getComponent(entity, Position);
        if (!mPos) return false;

        const dx = playerPos.x - mPos.x;
        const dy = (playerPos.y ?? 0) - (mPos.y ?? 0);
        const dist = Math.sqrt(dx * dx + dy * dy);
        const attackType = row?.attackType ?? def.attackType;
        const range = attackType === 'ranged' ? MONSTER_ATTACK_RANGE : MONSTER_MELEE_SKILL_RANGE;
        if (dist > range) return false;

        skill.pendingCasts.push({
            skillId,
            targetPos: { x: playerPos.x, y: playerPos.y ?? 0, z: 0 },
        });
        return true;
    }

    /** 生成时写入初始冷却错开。 */
    static initialCooldownForIndex(index: number): number {
        return (index % 5) * MONSTER_CAST_STAGGER_SEC;
    }
}
