/**
 * 技能组件。当前技能 id、冷却剩余、待释放队列由 ControlSystem / PlayerAutoCastSystem 写入。
 */
export interface PendingCastRequest {
    skillId: string;
    targetPos?: { x: number; y: number; z?: number };
}

export class Skill {
    constructor(
        public currentSkillId: string | null = null,
        public cooldownRemain: Record<string, number> = {},
        public pendingCasts: PendingCastRequest[] = [],
    ) {}

    /** 兼容旧逻辑：读写队列首项。 */
    get pendingCast(): PendingCastRequest | null {
        return this.pendingCasts[0] ?? null;
    }

    set pendingCast(value: PendingCastRequest | null) {
        if (value) {
            if (this.pendingCasts.length === 0) this.pendingCasts.push(value);
            else this.pendingCasts[0] = value;
        } else {
            this.pendingCasts.length = 0;
        }
    }
}
