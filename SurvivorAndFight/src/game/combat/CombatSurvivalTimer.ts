/**
 * 战斗生存倒计时：支持暂停（清除计时）与重置（从满时长重新开始）。
 */
export class CombatSurvivalTimer {
    private timerKey: object | null = null;
    private durationSec = 0;
    private onComplete: (() => void) | null = null;
    private running = false;

    isRunning(): boolean {
        return this.running;
    }

    start(durationSec: number, onComplete: () => void): void {
        this.stop();
        this.durationSec = durationSec;
        this.onComplete = onComplete;
        this.running = true;
        this.schedule();
    }

    /** Tab 暂停：停止当前计时，不触发完成。 */
    pause(): void {
        if (!this.running) return;
        this.clearScheduled();
    }

    /** Tab 恢复：从满时长重新计时。 */
    reset(): void {
        if (!this.running || !this.onComplete) return;
        this.clearScheduled();
        this.schedule();
    }

    stop(): void {
        this.running = false;
        this.clearScheduled();
        this.onComplete = null;
        this.durationSec = 0;
    }

    private schedule(): void {
        this.clearScheduled();
        this.timerKey = {};
        Laya.timer.once(this.durationSec * 1000, this.timerKey, () => {
            const cb = this.onComplete;
            this.stop();
            cb?.();
        });
    }

    private clearScheduled(): void {
        if (this.timerKey) {
            Laya.timer.clearAll(this.timerKey);
            this.timerKey = null;
        }
    }
}
