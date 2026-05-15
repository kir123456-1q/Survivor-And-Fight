import type { RunMapState } from '../run/RunMapState';

/** 跨 UI / 战斗的当前局跑图会话。 */
export class MetaRunSession {
    static runMapState: RunMapState | null = null;
    static resumeRunMap: (() => void | Promise<void>) | null = null;

    static completeBossVictory(): void {
        const state = this.runMapState;
        if (state) {
            state.advanceActAfterBoss();
        }
        void this.resumeRunMap?.();
    }
}
