import { RUN_MAP_LINE_BASE_WIDTH, RUN_MAP_NODE_SIZE } from '../../../defines';
import { findDescendantByName } from '../UiNodeUtil';
import type { NodeLayoutPos } from './RunMapLayout';

/**
 * 将 LineNode 左端锚定在 from 中心，右端指向 to 中心，长度与两节点间距一致。
 */
export function applyLineBetween(
    line: any,
    from: NodeLayoutPos,
    to: NodeLayoutPos,
    nodeSize = RUN_MAP_NODE_SIZE,
): number {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const fullDist = Math.sqrt(dx * dx + dy * dy);
    const dist = Math.max(0, fullDist - nodeSize * 0.85);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    setPivotLeftCenter(line);

    line.x = from.x;
    line.y = from.y;
    line.rotation = angle;
    if (line.scaleX !== undefined) line.scaleX = 1;
    if (line.scaleY !== undefined) line.scaleY = 1;

    const baseW = RUN_MAP_LINE_BASE_WIDTH;
    if (line.width !== undefined) {
        line.width = dist > 0 ? dist : baseW * 0.01;
    } else if (line.scaleX !== undefined) {
        line.scaleX = dist / baseW;
    }

    const moved = findDescendantByName(line, 'MovedlineNode');
    if (moved) {
        setPivotLeftCenter(moved);
        moved.x = 0;
        moved.y = 0;
        moved.rotation = 0;
        if (moved.width !== undefined) {
            moved.width = line.width ?? dist;
        }
        if (moved.scaleX !== undefined) moved.scaleX = 1;
    }

    return dist;
}

function setPivotLeftCenter(node: any): void {
    if (node.anchorX !== undefined) {
        node.anchorX = 0;
        node.anchorY = 0.5;
    }
    if (typeof node.setPivot === 'function') {
        node.setPivot(0, 0.5, true);
    } else if (node.pivotX !== undefined) {
        node.pivotX = 0;
        node.pivotY = 0.5;
    }
}
