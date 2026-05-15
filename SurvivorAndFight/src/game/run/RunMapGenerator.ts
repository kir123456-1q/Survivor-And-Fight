import type { RunDifficulty } from '../../defines';
import {
    RUN_MAP_GENERATION_MAX_RETRIES,
    RUN_MAP_GRID_COLS,
    RUN_MAP_GRID_ROWS,
} from '../../defines';
import { SeededRng } from './SeededRng';
import type { RunAct, RunGraph, RunLayer, RunNode, RunNodeType, RunSeed } from './RunTypes';
import { getActBossNodeId, getActStartNodeId } from './RunTypes';

export class RunMapGenerator {
    static generate(seed: RunSeed, difficulty: RunDifficulty): RunGraph {
        for (let attempt = 0; attempt < RUN_MAP_GENERATION_MAX_RETRIES; attempt++) {
            const rng = new SeededRng(`${seed.value}:${attempt}`);
            const acts = [0, 1, 2].map((i) => this.buildActGrid(rng, i as 0 | 1 | 2, difficulty));
            const graph: RunGraph = { acts: acts as [RunAct, RunAct, RunAct], seed };
            if (this.validateActReachBoss(graph)) return graph;
        }
        return this.generateFallback(seed);
    }

    private static buildActGrid(rng: SeededRng, index: 0 | 1 | 2, difficulty: RunDifficulty): RunAct {
        const rows: RunNode[][] = [];

        for (let row = 0; row < RUN_MAP_GRID_ROWS; row++) {
            const isStart = row === 0;
            const isBoss = row === RUN_MAP_GRID_ROWS - 1;
            const count = isStart || isBoss ? 1 : rng.int(2, 3);
            const cols = this.pickDistinctCols(rng, count);
            const nodes: RunNode[] = cols.map((col) => {
                const id = `a${index}-r${row}-c${col}`;
                const type = isBoss
                    ? 'Boss'
                    : isStart
                        ? 'Rest'
                        : this.pickNodeType(rng, difficulty);
                const needsPayload = type === 'Combat' || type === 'Boss' || type === 'Treasure';
                return {
                    id,
                    type,
                    payloadId: needsPayload ? `enc_${id}` : null,
                    gridCol: col,
                    gridRow: row,
                };
            });
            rows.push(nodes);
        }

        const layers: RunLayer[] = [];
        for (let row = 0; row < RUN_MAP_GRID_ROWS; row++) {
            const edges: [string, string][] = [];
            if (row < RUN_MAP_GRID_ROWS - 1) {
                this.connectRows(rng, rows[row], rows[row + 1], edges);
            }
            layers.push({ nodes: rows[row], edges });
        }

        return { index, layers };
    }

    private static pickDistinctCols(rng: SeededRng, count: number): number[] {
        const pool = Array.from({ length: RUN_MAP_GRID_COLS }, (_, i) => i);
        const picked: number[] = [];
        while (picked.length < count && pool.length > 0) {
            const i = rng.int(0, pool.length - 1);
            picked.push(pool.splice(i, 1)[0]);
        }
        picked.sort((a, b) => a - b);
        return picked;
    }

    private static connectRows(
        rng: SeededRng,
        fromNodes: RunNode[],
        toNodes: RunNode[],
        edges: [string, string][],
    ): void {
        const incoming = new Set<string>();

        for (const from of fromNodes) {
            const targetCount = rng.int(1, Math.min(2, toNodes.length));
            const targets = new Set<RunNode>();
            while (targets.size < targetCount) {
                targets.add(rng.pick(toNodes));
            }
            for (const to of targets) {
                edges.push([from.id, to.id]);
                incoming.add(to.id);
            }
        }

        for (const to of toNodes) {
            if (incoming.has(to.id)) continue;
            const from = rng.pick(fromNodes);
            edges.push([from.id, to.id]);
            incoming.add(to.id);
        }
    }

    private static pickNodeType(rng: SeededRng, difficulty: RunDifficulty): RunNodeType {
        const roll = rng.next();
        const combatBias = difficulty * 0.06;
        if (roll < 0.4 + combatBias) return 'Combat';
        if (roll < 0.55) return 'Treasure';
        if (roll < 0.72) return 'Rest';
        return 'Unknown';
    }

    private static validateActReachBoss(graph: RunGraph): boolean {
        for (const act of graph.acts) {
            const startId = getActStartNodeId(act);
            const bossId = getActBossNodeId(act);
            if (!startId || !bossId) return false;
            if (!this.canReach(act, startId, bossId)) return false;
        }
        return true;
    }

    private static canReach(act: RunAct, fromId: string, toId: string): boolean {
        const adj = new Map<string, string[]>();
        for (const layer of act.layers) {
            for (const [from, to] of layer.edges) {
                if (!adj.has(from)) adj.set(from, []);
                adj.get(from)!.push(to);
            }
        }
        const queue = [fromId];
        const seen = new Set<string>([fromId]);
        while (queue.length > 0) {
            const cur = queue.shift()!;
            if (cur === toId) return true;
            for (const next of adj.get(cur) ?? []) {
                if (!seen.has(next)) {
                    seen.add(next);
                    queue.push(next);
                }
            }
        }
        return false;
    }

    private static generateFallback(seed: RunSeed): RunGraph {
        const acts = ([0, 1, 2] as const).map((index) => {
            const startId = `a${index}-fb-s`;
            const midId = `a${index}-fb-m`;
            const bossId = `a${index}-fb-b`;
            return {
                index,
                layers: [
                    {
                        nodes: [{ id: startId, type: 'Rest' as const, payloadId: null, gridCol: 3, gridRow: 0 }],
                        edges: [[startId, midId] as [string, string]],
                    },
                    {
                        nodes: [{ id: midId, type: 'Combat' as const, payloadId: `enc_${midId}`, gridCol: 3, gridRow: 4 }],
                        edges: [[midId, bossId] as [string, string]],
                    },
                    {
                        nodes: [{ id: bossId, type: 'Boss' as const, payloadId: `enc_${bossId}`, gridCol: 3, gridRow: 8 }],
                        edges: [],
                    },
                ],
            };
        });
        return { acts: acts as [RunAct, RunAct, RunAct], seed };
    }
}
