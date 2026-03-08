/**
 * 技能组件。当前技能 id、冷却剩余、本帧待释放由 ControlSystem 写入。
 * pendingCast.targetPos 在 simple 索敌时由 ControlSystem 填入鼠标/目标世界坐标。
 */
export class Skill {
    constructor(
        public currentSkillId: string | null = null,
        public cooldownRemain: Record<string, number> = {},
        public pendingCast: { skillId: string; targetPos?: { x: number; y: number; z?: number } } | null = null,
    ) {}
}
