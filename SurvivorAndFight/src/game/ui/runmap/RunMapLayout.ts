import { RUN_MAP_MARGIN_X, RUN_MAP_MARGIN_Y, RUN_MAP_NODE_SIZE } from '../../../defines';
import type { RunAct, RunNode } from '../../run/RunTypes';

/** 节点中心点在 MapPanel 本地坐标系中的位置。 */
export interface NodeLayoutPos {
    x: number;
    y: number;
}

export interface ActLayoutBounds {
    minCol: number;
    maxCol: number;
    minRow: number;
    maxRow: number;
}

export function getActLayoutBounds(act: RunAct): ActLayoutBounds {
    const nodes = collectActNodes(act);
    if (nodes.length === 0) {
        return { minCol: 0, maxCol: 0, minRow: 0, maxRow: 0 };
    }
    return {
        minCol: Math.min(...nodes.map((n) => n.gridCol)),
        maxCol: Math.max(...nodes.map((n) => n.gridCol)),
        minRow: Math.min(...nodes.map((n) => n.gridRow)),
        maxRow: Math.max(...nodes.map((n) => n.gridRow)),
    };
}

/**
 * 将 Act 内所有节点映射到 MapPanel 内，保证节点中心落在 [margin, panelSize-margin] 内。
 * gridRow 小 = 底层（大 Y），gridRow 大 = 顶层 Boss（小 Y）。
 */
export function layoutActNodes(act: RunAct, panelWidth: number, panelHeight: number): Map<string, NodeLayoutPos> {
    const result = new Map<string, NodeLayoutPos>();
    const nodes = collectActNodes(act);
    if (nodes.length === 0) return result;

    const bounds = getActLayoutBounds(act);
    const half = RUN_MAP_NODE_SIZE * 0.5;
    const innerW = Math.max(panelWidth - RUN_MAP_MARGIN_X * 2 - RUN_MAP_NODE_SIZE, 1);
    const innerH = Math.max(panelHeight - RUN_MAP_MARGIN_Y * 2 - RUN_MAP_NODE_SIZE, 1);
    const colSpan = Math.max(bounds.maxCol - bounds.minCol, 1);
    const rowSpan = Math.max(bounds.maxRow - bounds.minRow, 1);
    const stepX = bounds.maxCol === bounds.minCol ? 0 : innerW / colSpan;
    const stepY = bounds.maxRow === bounds.minRow ? 0 : innerH / rowSpan;

    for (const node of nodes) {
        const x = RUN_MAP_MARGIN_X + half + (node.gridCol - bounds.minCol) * stepX;
        const y = RUN_MAP_MARGIN_Y + half + (bounds.maxRow - node.gridRow) * stepY;
        result.set(node.id, { x, y });
    }

    return result;
}

function collectActNodes(act: RunAct): RunNode[] {
    const nodes: RunNode[] = [];
    for (const layer of act.layers) {
        nodes.push(...layer.nodes);
    }
    return nodes;
}
