/** 轴对齐包围盒（相对同一 UI 根节点）。 */
export interface StageRect {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

export function isPointInStageRect(x: number, y: number, rect: StageRect): boolean {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

/** 开启槽位鼠标（按下）。 */
export function enableSlotPointer(node: any): void {
    if (!node) return;
    node.mouseEnabled = true;
    if (typeof node.mouseThrough !== 'undefined') node.mouseThrough = false;
}

/** 从 Laya 事件或 InputManager 读取 stage 设计坐标指针。 */
export function readPointerStageXY(e?: any): { x: number; y: number } {
    if (e) {
        if (typeof e.stageX === 'number' && typeof e.stageY === 'number') {
            return { x: e.stageX, y: e.stageY };
        }
        if (typeof e.mouseX === 'number' && typeof e.mouseY === 'number') {
            return { x: e.mouseX, y: e.mouseY };
        }
        const touch = e.touchPos ?? e.touches?.[0];
        if (touch && typeof touch.x === 'number' && typeof touch.y === 'number') {
            return { x: touch.x, y: touch.y };
        }
    }

    const pt = new Laya.Point();
    if (typeof Laya.stage.getMousePoint === 'function') {
        Laya.stage.getMousePoint(pt);
        return { x: pt.x, y: pt.y };
    }

    const im = (Laya as { InputManager?: { mouseX?: number; mouseY?: number } }).InputManager;
    if (im && typeof im.mouseX === 'number' && typeof im.mouseY === 'number') {
        return { x: im.mouseX, y: im.mouseY };
    }

    return { x: Laya.stage.mouseX, y: Laya.stage.mouseY };
}

/** stage 坐标 → UI 根节点（MainUIPanel）本地坐标。 */
export function pointerToRootLocal(root: any, e?: any): { x: number; y: number } | null {
    if (!root) return null;
    const stagePt = readPointerStageXY(e);
    const pt = new Laya.Point(stagePt.x, stagePt.y);
    if (typeof root.globalToLocal === 'function') {
        const local = root.globalToLocal(pt);
        return { x: local.x, y: local.y };
    }
    return stagePt;
}

/**
 * 节点相对 root 的包围盒（沿 parent 链累加 x/y，与 MainUI 布局一致）。
 * 比 localToGlobal 更可靠（避免 stage 缩放与 UI 根不一致）。
 */
export function getNodeRectInRoot(node: any, root: any): StageRect | null {
    if (!node || !root) return null;
    if (node.visible === false || node.displayed === false) return null;

    const w = Number(node.width) || 0;
    const h = Number(node.height) || 0;
    if (w <= 0 || h <= 0) return null;

    let x = Number(node.x) || 0;
    let y = Number(node.y) || 0;
    let cur = node.parent;
    while (cur && cur !== root) {
        x += Number(cur.x) || 0;
        y += Number(cur.y) || 0;
        cur = cur.parent;
    }
    if (cur !== root) {
        return getNodeStageRectFallback(node);
    }

    return { left: x, top: y, right: x + w, bottom: y + h };
}

/** 无共同 root 时回退 localToGlobal。 */
function getNodeStageRectFallback(node: any): StageRect | null {
    if (!node) return null;
    const w = Number(node.width) || 0;
    const h = Number(node.height) || 0;
    if (w <= 0 || h <= 0) return null;
    if (typeof node.localToGlobal === 'function') {
        const p0 = node.localToGlobal(new Laya.Point(0, 0));
        const p1 = node.localToGlobal(new Laya.Point(w, h));
        return {
            left: Math.min(p0.x, p1.x),
            top: Math.min(p0.y, p1.y),
            right: Math.max(p0.x, p1.x),
            bottom: Math.max(p0.y, p1.y),
        };
    }
    return null;
}

/** @deprecated 使用 getNodeRectInRoot + pointerToRootLocal */
export function getNodeStageRect(node: any): StageRect | null {
    return getNodeStageRectFallback(node);
}
