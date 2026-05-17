import { BULLET_WORLD_ICON_SIZE, HIT_RADIUS } from '../../defines';

/** 与图标换皮后视觉体积匹配的碰撞半径。 */
export const BULLET_HIT_RADIUS = Math.max(HIT_RADIUS, Math.round(BULLET_WORLD_ICON_SIZE * 0.45));

export function hitRadiusSq(): number {
    return BULLET_HIT_RADIUS * BULLET_HIT_RADIUS;
}

/** 线段 (x0,y0)→(x1,y1) 与圆心 (cx,cy) 半径 r 是否相交。 */
export function segmentHitsCircle(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    cx: number,
    cy: number,
    radiusSq: number,
): boolean {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const fx = x0 - cx;
    const fy = y0 - cy;
    const lenSq = dx * dx + dy * dy;
    if (lenSq < 1e-8) {
        return fx * fx + fy * fy < radiusSq;
    }
    let t = -(fx * dx + fy * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const px = x0 + t * dx - cx;
    const py = y0 + t * dy - cy;
    return px * px + py * py < radiusSq;
}

export function pointHitsCircle(
    bx: number,
    by: number,
    cx: number,
    cy: number,
    radiusSq: number,
): boolean {
    const dx = bx - cx;
    const dy = by - cy;
    return dx * dx + dy * dy < radiusSq;
}
