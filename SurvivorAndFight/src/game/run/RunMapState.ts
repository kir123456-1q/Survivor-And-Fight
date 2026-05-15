import { MAP_INVALID_NODE } from '../../defines';
import type { RunGraph } from './RunTypes';
import { edgeKey, findRunNode, getActStartNodeId } from './RunTypes';

export type SelectNextResult = { ok: true } | { ok: false; code: string };

export class RunMapState {
    readonly graph: RunGraph;
    currentNodeId: string;
    readonly visited = new Set<string>();
    readonly traversedEdges = new Set<string>();
    availableNext: string[] = [];
    currentActIndex: 0 | 1 | 2 = 0;
    pendingBossVictory = false;
    /** 为 true 时仅允许点击底层起点以「确认出发」，尚未解锁上一层节点。 */
    awaitingStartConfirm = true;

    private constructor(graph: RunGraph, startNodeId: string) {
        this.graph = graph;
        this.currentNodeId = startNodeId;
        this.visited.add(startNodeId);
        this.availableNext = [];
    }

    static create(graph: RunGraph): RunMapState {
        const startId = getActStartNodeId(graph.acts[0]);
        return new RunMapState(graph, startId);
    }

    getCurrentAct() {
        return this.graph.acts[this.currentActIndex];
    }

    isAwaitingStartConfirm(): boolean {
        return this.awaitingStartConfirm;
    }

    selectNext(nodeId: string): SelectNextResult {
        if (this.awaitingStartConfirm) {
            if (nodeId !== this.currentNodeId) {
                return { ok: false, code: MAP_INVALID_NODE };
            }
            this.awaitingStartConfirm = false;
            this.recomputeAvailableNext();
            return { ok: true };
        }

        if (!this.availableNext.includes(nodeId)) {
            return { ok: false, code: MAP_INVALID_NODE };
        }

        const fromId = this.currentNodeId;
        const node = findRunNode(this.graph, nodeId);
        this.traversedEdges.add(edgeKey(fromId, nodeId));
        this.currentNodeId = nodeId;
        this.visited.add(nodeId);

        if (node?.type === 'Boss') {
            this.pendingBossVictory = true;
        }

        this.recomputeAvailableNext();
        return { ok: true };
    }

    advanceActAfterBoss(): boolean {
        if (!this.pendingBossVictory || this.currentActIndex >= 2) {
            this.pendingBossVictory = false;
            return false;
        }
        this.currentActIndex = (this.currentActIndex + 1) as 0 | 1 | 2;
        const nextStart = getActStartNodeId(this.getCurrentAct());
        this.currentNodeId = nextStart;
        this.visited.clear();
        this.visited.add(nextStart);
        this.traversedEdges.clear();
        this.pendingBossVictory = false;
        this.awaitingStartConfirm = true;
        this.availableNext = [];
        return true;
    }

    getCurrentNode() {
        return findRunNode(this.graph, this.currentNodeId);
    }

    isTraversedEdge(fromId: string, toId: string): boolean {
        return this.traversedEdges.has(edgeKey(fromId, toId));
    }

    private recomputeAvailableNext(): void {
        const act = this.getCurrentAct();
        const next: string[] = [];
        for (const layer of act.layers) {
            for (const [from, to] of layer.edges) {
                if (from === this.currentNodeId && !this.visited.has(to)) {
                    next.push(to);
                }
            }
        }
        this.availableNext = [...new Set(next)];
    }
}
