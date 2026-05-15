import type { RunDifficulty } from '../../defines';
import type { RunSeed } from '../run/RunTypes';

export function createRunSeed(difficulty: RunDifficulty): RunSeed {
    const rand = Math.floor(Math.random() * 0xffffffff);
    return {
        value: `d${difficulty}-${rand.toString(16).padStart(8, '0')}`,
        createdAt: Date.now(),
    };
}
