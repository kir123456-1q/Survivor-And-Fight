import { PLAYER_LEVEL_EXP_BASE, PLAYER_LEVEL_EXP_STEP } from '../../defines';

export class Experience {
    constructor(
        public level: number = 1,
        public exp: number = 0,
        public expToNext: number = PLAYER_LEVEL_EXP_BASE,
        public pendingRewardRolls: number = 0,
    ) {}
}

export function calcExpToNext(level: number): number {
    return PLAYER_LEVEL_EXP_BASE + Math.max(0, level - 1) * PLAYER_LEVEL_EXP_STEP;
}
