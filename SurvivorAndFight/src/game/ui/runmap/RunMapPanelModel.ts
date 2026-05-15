import type { RunDifficulty } from '../../../defines';
import type { RunMapState } from '../../run/RunMapState';
import type { RunSeed } from '../../run/RunTypes';

export interface RunMapPanelPayload {
    difficulty: RunDifficulty;
    runSeed: RunSeed;
    runMapState: RunMapState;
}

export class RunMapPanelModel {
    difficulty: RunDifficulty = 1;
    runSeed: RunSeed | null = null;
    runMapState: RunMapState | null = null;

    applyPayload(payload?: RunMapPanelPayload): void {
        if (!payload) return;
        this.difficulty = payload.difficulty;
        this.runSeed = payload.runSeed;
        this.runMapState = payload.runMapState;
    }
}
