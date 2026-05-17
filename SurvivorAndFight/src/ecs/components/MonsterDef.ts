/** 怪物种类 id（对应 monster_table.id）。 */
export class MonsterDef {
    constructor(
        public monsterId: string,
        public attackType: 'melee' | 'ranged' = 'melee',
        public tier: number = 1,
    ) {}
}
