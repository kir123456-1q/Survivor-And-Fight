import {
    isAblationTestWave,
    TEST_ABLATION_PRESETS,
    TEST_ABLATION_WAVE_COUNT,
    TEST_ABLATION_WAVE_START_INDEX,
    TEST_WAVE_MONSTER_COUNTS,
} from '../../defines';
import type { TestAblationPresetId } from '../../defines';
import { MetaRunSession } from '../meta/MetaRunSession';

/** 单帧 deltaTime 上限，避免切后台/卡顿造成统计失真。 */
const MAX_SAMPLE_DELTA_SEC = 0.25;

export interface AblationSegmentMetrics {
    presetId: TestAblationPresetId;
    label: string;
    thesisNote: string;
    waveNumber: number;
    avgFps: number;
    p95FrameMs: number;
    frameCount: number;
    durationSec: number;
}

/**
 * 测试关卡帧率采样：1–6 波分波 FPS；第 4–6 波额外记录 P95 供表 7.2。
 */
export class TestLevelFpsTracker {
    private waveFrameCount = 0;
    private waveDeltaSumSec = 0;
    private waveFrameTimesMs: number[] = [];
    private currentWaveIndex = -1;
    private sessionFrameCount = 0;
    private sessionDeltaSumSec = 0;
    private waveSampling = false;
    private readonly ablationResults: AblationSegmentMetrics[] = [];

    resetSession(): void {
        this.waveFrameCount = 0;
        this.waveDeltaSumSec = 0;
        this.waveFrameTimesMs = [];
        this.currentWaveIndex = -1;
        this.sessionFrameCount = 0;
        this.sessionDeltaSumSec = 0;
        this.waveSampling = false;
        this.ablationResults.length = 0;
    }

    beginWave(waveIndex: number): void {
        this.currentWaveIndex = waveIndex;
        this.waveFrameCount = 0;
        this.waveDeltaSumSec = 0;
        this.waveFrameTimesMs = isAblationTestWave(waveIndex) ? [] : [];
        this.waveSampling = true;
        if (isAblationTestWave(waveIndex)) {
            const preset = TEST_ABLATION_PRESETS[waveIndex - TEST_ABLATION_WAVE_START_INDEX];
            console.log(
                '[TestAblation] sampling',
                `wave ${waveIndex + 1}`,
                preset?.label,
                `pool=${preset?.usePool}`,
                `worker=${preset?.useWorker}`,
            );
        }
    }

    tick(deltaTimeSec: number, paused: boolean): void {
        if (!MetaRunSession.testMode) return;
        if (!this.waveSampling || !MetaRunSession.testWaveAwaitingClear || paused) return;

        const dt = Math.min(Math.max(0, deltaTimeSec), MAX_SAMPLE_DELTA_SEC);
        if (dt <= 0) return;

        this.waveFrameCount += 1;
        this.waveDeltaSumSec += dt;
        this.sessionFrameCount += 1;
        this.sessionDeltaSumSec += dt;
        if (isAblationTestWave(this.currentWaveIndex)) {
            this.waveFrameTimesMs.push(dt * 1000);
        }
    }

    endWave(waveIndex: number): void {
        if (!this.waveSampling) return;
        this.waveSampling = false;

        const monsters = TEST_WAVE_MONSTER_COUNTS[waveIndex] ?? 0;
        const avgFps = this.computeAvgFps(this.waveFrameCount, this.waveDeltaSumSec);
        const p95FrameMs = this.computeP95FrameMs(this.waveFrameTimesMs);

        if (isAblationTestWave(waveIndex)) {
            const preset = TEST_ABLATION_PRESETS[waveIndex - TEST_ABLATION_WAVE_START_INDEX];
            const metrics: AblationSegmentMetrics = {
                presetId: preset?.id ?? 'baseline',
                label: preset?.label ?? `wave-${waveIndex + 1}`,
                thesisNote: preset?.thesisNote ?? '',
                waveNumber: waveIndex + 1,
                avgFps,
                p95FrameMs,
                frameCount: this.waveFrameCount,
                durationSec: this.waveDeltaSumSec,
            };
            this.ablationResults.push(metrics);
            console.log(
                '[TestAblation] FPS',
                `wave ${waveIndex + 1}/${TEST_WAVE_MONSTER_COUNTS.length}`,
                metrics.label,
                `monsters=${monsters}`,
                `avgFPS=${avgFps.toFixed(2)}`,
                `P95=${p95FrameMs.toFixed(2)}ms`,
                `frames=${metrics.frameCount}`,
                `duration=${metrics.durationSec.toFixed(2)}s`,
                `note=${metrics.thesisNote}`,
            );
            return;
        }

        console.log(
            '[TestLevel] FPS',
            `wave ${waveIndex + 1}/${TEST_WAVE_MONSTER_COUNTS.length}`,
            `monsters=${monsters}`,
            `avgFPS=${avgFps.toFixed(2)}`,
            `frames=${this.waveFrameCount}`,
            `duration=${this.waveDeltaSumSec.toFixed(2)}s`,
        );
    }

    logAblationTable(): void {
        if (this.ablationResults.length === 0) {
            console.warn('[TestAblation] no ablation wave results (waves 4–6)');
            return;
        }

        console.log('[TestAblation] ========== 表 7.2 对象池 / Worker 消融（第4–6波）==========');
        console.log('[TestAblation] 配置 | 平均FPS | P95(ms) | 备注');
        for (const r of this.ablationResults) {
            console.log(
                '[TestAblation]',
                `${r.label} | ${r.avgFps.toFixed(2)} | ${r.p95FrameMs.toFixed(2)} | ${r.thesisNote}`,
            );
        }
        console.log('[TestAblation] LaTeX row hint (copy into tab:perf):');
        for (const r of this.ablationResults) {
            console.log(
                `[TestAblation] ${r.label} & ${r.avgFps.toFixed(2)} & ${r.p95FrameMs.toFixed(2)} & ${r.thesisNote} \\\\`,
            );
        }
        console.log('[TestAblation] ========================================================');
    }

    logSessionSummary(): void {
        const avgFps = this.computeAvgFps(this.sessionFrameCount, this.sessionDeltaSumSec);
        console.log(
            '[TestLevel] FPS summary',
            `waves=${TEST_WAVE_MONSTER_COUNTS.length}`,
            `ablationWaves=${TEST_ABLATION_WAVE_COUNT}`,
            `avgFPS=${avgFps.toFixed(2)}`,
            `totalFrames=${this.sessionFrameCount}`,
            `duration=${this.sessionDeltaSumSec.toFixed(2)}s`,
        );
    }

    getAblationResults(): readonly AblationSegmentMetrics[] {
        return this.ablationResults;
    }

    private computeAvgFps(frameCount: number, deltaSumSec: number): number {
        if (frameCount <= 0 || deltaSumSec <= 1e-6) return 0;
        return frameCount / deltaSumSec;
    }

    private computeP95FrameMs(frameTimesMs: number[]): number {
        if (frameTimesMs.length === 0) return 0;
        const sorted = [...frameTimesMs].sort((a, b) => a - b);
        const idx = Math.min(sorted.length - 1, Math.ceil(0.95 * sorted.length) - 1);
        return sorted[Math.max(0, idx)];
    }
}

export const testLevelFpsTracker = new TestLevelFpsTracker();
