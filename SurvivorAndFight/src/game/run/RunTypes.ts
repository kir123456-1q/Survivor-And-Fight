export type RunNodeType = 'Boss' | 'Treasure' | 'Rest' | 'Combat' | 'Unknown';

export interface RunSeed {
    value: string;
    createdAt: number;
}

export interface RunNode {
    id: string;
    type: RunNodeType;
    payloadId: string | null;
    gridCol: number;
    gridRow: number;
}

export interface RunLayer {
    nodes: RunNode[];
    edges: [string, string][];
}

export interface RunAct {
    index: 0 | 1 | 2;
    layers: RunLayer[];
}

export interface RunGraph {
    acts: [RunAct, RunAct, RunAct];
    seed: RunSeed;
}

export function findRunNode(graph: RunGraph, nodeId: string): RunNode | null {
    for (const act of graph.acts) {
        for (const layer of act.layers) {
            const found = layer.nodes.find((n) => n.id === nodeId);
            if (found) return found;
        }
    }
    return null;
}

export function getActStartNodeId(act: RunAct): string {
    let best: RunNode | null = null;
    for (const layer of act.layers) {
        for (const node of layer.nodes) {
            if (!best || node.gridRow < best.gridRow) {
                best = node;
            }
        }
    }
    return best?.id ?? act.layers[0]?.nodes[0]?.id ?? '';
}

export function getActBossNodeId(act: RunAct): string {
    let best: RunNode | null = null;
    for (const layer of act.layers) {
        for (const node of layer.nodes) {
            if (node.type === 'Boss') return node.id;
            if (!best || node.gridRow > best.gridRow) {
                best = node;
            }
        }
    }
    return best?.id ?? '';
}

export function edgeKey(fromId: string, toId: string): string {
    return `${fromId}->${toId}`;
}
