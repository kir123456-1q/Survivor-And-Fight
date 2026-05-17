import type { SimpleEcsDemo } from '../demo/SimpleEcsDemo';
import type { RunMapState } from '../run/RunMapState';

/** 跨 UI / 战斗的当前局跑图会话。 */
export class MetaRunSession {
    static runMapState: RunMapState | null = null;
    static resumeRunMap: (() => void | Promise<void>) | null = null;
    static combatDemo: SimpleEcsDemo | null = null;
    static onRewardPanelClosed: ((picked: boolean) => void) | null = null;

    /** 跑图阶段选择、尚未进入 ECS 的奖励。 */
    static pendingHealRatio = 0;
    static readonly pendingEffectIds: string[] = [];
    static readonly pendingSkillIds: string[] = [];
    static readonly pendingUpgradeIds: string[] = [];

    static resetRunRewards(): void {
        MetaRunSession.pendingHealRatio = 0;
        MetaRunSession.pendingEffectIds.length = 0;
        MetaRunSession.pendingSkillIds.length = 0;
        MetaRunSession.pendingUpgradeIds.length = 0;
    }

    static completeBossVictory(): void {
        const state = this.runMapState;
        if (state) {
            state.advanceActAfterBoss();
        }
        void this.resumeRunMap?.();
    }
}
