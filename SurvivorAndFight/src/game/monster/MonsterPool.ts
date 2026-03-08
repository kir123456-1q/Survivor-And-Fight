/**
 * 怪物视图节点对象池。回收时不销毁节点，仅从场景移除并放入池中；生成怪物时优先从池中取节点，不足再实例化。
 * 与 ECS 解耦：池只管理节点，实体的创建/销毁由调用方根据 world 与 Character 表处理。
 */
export class MonsterPool {
    private readonly nodes: any[] = [];

    /**
     * 从池中取出一个怪物视图节点；无则返回 null。
     */
    get(): any | null {
        return this.nodes.length > 0 ? this.nodes.pop() ?? null : null;
    }

    /**
     * 将怪物视图节点回收进池。调用方须先将节点从场景移除，并已销毁或重置对应 ECS 实体。
     */
    put(node: any): void {
        if (!node) return;
        if (node.parent) node.parent.removeChild(node);
        this.nodes.push(node);
    }

    clear(): void {
        this.nodes.length = 0;
    }
}
