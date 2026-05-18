import type { SimpleEcsDemo } from '../demo/SimpleEcsDemo';
import {
    getAblationPresetIndex,
    isAblationTestWave,
    TEST_ABLATION_PRESETS,
} from '../../defines';
import { testLevelFpsTracker } from '../test/TestLevelFpsTracker';
import type { RunMapState } from '../run/RunMapState';

/** 跨 UI / 战斗的当前局跑图会话。 */
export class MetaRunSession {
    static runMapState: RunMapState | null = null;
    static resumeRunMap: (() => void | Promise<void>) | null = null;
    static combatDemo: SimpleEcsDemo | null = null;
    static onRewardPanelClosed: ((picked: boolean) => void) | null = null;

    /** Level3 测试关：6 波（1–3 规模曲线 + 4–6 消融），双方无敌。 */
    static testMode = false;
    static testWaveIndex = 0;
    /** 当前波已刷怪，允许计时采样。 */
    static testWaveAwaitingClear = false;
    static onTestCombatComplete: (() => void | Promise<void>) | null = null;

    /** 第 4–6 波消融：是否启用对象池 / Worker（由 applyAblationForWave 写入）。 */
    static testUseObjectPool = true;
    static testUseCombatWorker = true;

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

    static resetTestSession(): void {
        MetaRunSession.testMode = false;
        MetaRunSession.testWaveIndex = 0;
        MetaRunSession.testWaveAwaitingClear = false;
        MetaRunSession.onTestCombatComplete = null;
        MetaRunSession.resetTestCombatOptimizations();
        testLevelFpsTracker.resetSession();
    }

    /** 第 1–3 波：默认开启池化 + Worker。 */
    static resetTestCombatOptimizations(): void {
        MetaRunSession.testUseObjectPool = true;
        MetaRunSession.testUseCombatWorker = true;
    }

    static isAblationWave(waveIndex?: number): boolean {
        const idx = waveIndex ?? MetaRunSession.testWaveIndex;
        return MetaRunSession.testMode && isAblationTestWave(idx);
    }

    /** 第 4–6 波：应用表 7.2 对应预设。 */
    static applyAblationForWave(waveIndex: number): void {
        const preset = TEST_ABLATION_PRESETS[getAblationPresetIndex(waveIndex)];
        if (!preset) return;
        MetaRunSession.testUseObjectPool = preset.usePool;
        MetaRunSession.testUseCombatWorker = preset.useWorker;
    }

    static completeBossVictory(): void {
        const state = this.runMapState;
        if (state) {
            state.advanceActAfterBoss();
        }
        void this.resumeRunMap?.();
    }
}
