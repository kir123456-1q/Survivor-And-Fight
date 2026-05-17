/** 设置节点可见性（兼容 UI2 GWidget 的 visible / displayed）。 */
export function setNodeVisible(node: any, visible: boolean): void {
    if (!node) return;
    if (typeof node.visible !== 'undefined') node.visible = visible;
    if (typeof node.displayed !== 'undefined') node.displayed = visible;
}

export function findDescendantByName(root: any, name: string): any | null {
    if (!root) return null;
    const queue: any[] = [root];
    while (queue.length > 0) {
        const node = queue.shift();
        if (!node) continue;
        if (String(node.name ?? '') === name) return node;
        const childCount = typeof node.numChildren === 'number' ? node.numChildren : 0;
        for (let i = 0; i < childCount; i++) {
            queue.push(node.getChildAt(i));
        }
    }
    return null;
}

export function bindClick(target: any, caller: object, handler: () => void): void {
    if (!target?.on) return;
    target.off(Laya.Event.CLICK, caller, handler);
    target.on(Laya.Event.CLICK, caller, handler);
}

export function unbindClick(target: any, caller: object, handler: () => void): void {
    if (!target?.off) return;
    target.off(Laya.Event.CLICK, caller, handler);
}
