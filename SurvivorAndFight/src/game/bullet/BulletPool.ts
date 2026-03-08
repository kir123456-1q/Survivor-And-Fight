/**
 * 子弹节点对象池。按 prefabPath 分桶缓存已回收的子弹节点，spawn 时优先从池中取，回收时放回池中避免频繁实例化/销毁。
 */
export class BulletPool {
    private readonly pools = new Map<string, any[]>();

    /**
     * 从池中取出一个节点；若该 path 下无可用节点则返回 null，由调用方新建。
     */
    get(prefabPath: string): any | null {
        const arr = this.pools.get(prefabPath);
        if (!arr || arr.length === 0) return null;
        return arr.pop() ?? null;
    }

    /**
     * 将节点回收到池中。调用方须先将节点从场景移除并重置状态（如 position）。
     */
    put(prefabPath: string, node: any): void {
        if (!node) return;
        if (node.parent) node.parent.removeChild(node);
        let arr = this.pools.get(prefabPath);
        if (!arr) {
            arr = [];
            this.pools.set(prefabPath, arr);
        }
        arr.push(node);
    }

    /** 清空指定 path 或全部池。 */
    clear(prefabPath?: string): void {
        if (prefabPath) {
            const arr = this.pools.get(prefabPath);
            if (arr) arr.length = 0;
        } else {
            this.pools.forEach((arr) => { arr.length = 0; });
        }
    }
}
