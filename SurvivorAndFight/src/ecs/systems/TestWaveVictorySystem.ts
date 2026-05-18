import { System } from '../core/System';
import { TEST_WAVE_DURATION_SEC } from '../../defines';
import { MetaRunSession } from '../../game/meta/MetaRunSession';
import { testLevelFpsTracker } from '../../game/test/TestLevelFpsTracker';

/**
 * 测试关卡：每波固定时长后自动进入下一波（无击杀要求、无生存倒计时）。
 */
export class TestWaveVictorySystem implements System {
    readonly group = 'logic' as const;
    readonly priority = -6.5;

    private advancing = false;
    private waveElapsed = 0;
    private trackedWaveIndex = -1;

    constructor(
        private readonly isPaused?: () => boolean,
        private readonly onWaveCleared?: () => void | Promise<void>,
    ) {}

    update(deltaTime: number): void {
        if (!MetaRunSession.testMode) return;
        if (this.isPaused?.()) return;
        if (!MetaRunSession.testWaveAwaitingClear) return;
        if (this.advancing) return;

        if (MetaRunSession.testWaveIndex !== this.trackedWaveIndex) {
            this.trackedWaveIndex = MetaRunSession.testWaveIndex;
            this.waveElapsed = 0;
        }

        this.waveElapsed += deltaTime;
        if (this.waveElapsed < TEST_WAVE_DURATION_SEC) return;

        this.advancing = true;
        MetaRunSession.testWaveAwaitingClear = false;
        const waveIndex = MetaRunSession.testWaveIndex;
        testLevelFpsTracker.endWave(waveIndex);
        console.log(
            '[TestLevel] wave',
            waveIndex + 1,
            'time up',
            TEST_WAVE_DURATION_SEC,
            's',
        );
        Promise.resolve(this.onWaveCleared?.())
            .finally(() => {
                this.advancing = false;
            });
    }

    resetTimer(): void {
        this.waveElapsed = 0;
        this.trackedWaveIndex = MetaRunSession.testWaveIndex;
    }
}
